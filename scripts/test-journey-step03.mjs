import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {createRequire} from "node:module";
import {PrismaClient} from "@prisma/client";

// Uses an isolated disposable Postgres database in CI; never run against production.
if(!process.env.DATABASE_URL?.includes("bedifferent_test")){
  throw new Error("Journey acceptance requires bedifferent_test isolated database.");
}
const require=createRequire(import.meta.url);
const cache=new Map();
function load(file){
  const full=path.resolve(file.endsWith(".ts")?file:file+".ts");
  if(cache.has(full))return cache.get(full);
  const mod={exports:{}};
  cache.set(full,mod.exports);
  const src=fs.readFileSync(full,"utf8");
  const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  new Function("require","module","exports",js)((name)=>name.startsWith(".")?load(path.resolve(path.dirname(full),name)):require(name),mod,mod.exports);
  cache.set(full,mod.exports);
  return mod.exports;
}
const domain=load("lib/journey-contract.ts");
const service=load("lib/journey-service.ts");
const db=new PrismaClient();
const stamp=Date.now().toString(36),uuid=(v)=>v+"_"+stamp;
let checks=0;
async function check(name,fn){await fn();checks++;console.log("PASS",name)}
async function rejects(fn,contains){
  await assert.rejects(fn,error=>{assert(String(error).includes(contains),String(error));return true});
}

try{
  await check("coach criteria reject duplicate, unbounded and contradictory metrics",async()=>{
    assert(!domain.journeyCriteriaSchema.safeParse({schemaVersion:1,metrics:[{key:"pushups",unit:"reps"}]}).success);
    assert(!domain.journeyCriteriaSchema.safeParse({schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:20,max:10}]}).success);
    assert(!domain.journeyCriteriaSchema.safeParse({schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:20},{key:"pushups",unit:"reps",min:10}]}).success);
    assert(!domain.journeyResultsSchema.safeParse([{key:"x",unit:"reps",value:NaN}]).success);
  });
  await check("pure assessment grades missing results and min/max correctly",async()=>{
    const criterion={schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:20},{key:"sprint",unit:"seconds",max:5}]};
    assert.equal(domain.assessJourneyResults(criterion,[{key:"pushups",unit:"reps",value:23},{key:"sprint",unit:"seconds",value:4.7}]).passed,true);
    assert.equal(domain.assessJourneyResults(criterion,[{key:"pushups",unit:"reps",value:14}]).passed,false);
    assert.equal(domain.assessJourneyResults(criterion,[{key:"pushups",unit:"reps",value:30},{key:"sprint",unit:"reps",value:4}]).passed,false);
  });
  await check("subscription alone never bypasses locked chapter",async()=>{
    assert.equal(domain.canOpenJourneyMedia({earnedChapter:false,tier:"ELITE",minTier:"FREE"}),false);
    assert.equal(domain.canOpenJourneyMedia({earnedChapter:true,tier:"FREE",minTier:"PRO"}),false);
    assert.equal(domain.canOpenJourneyMedia({earnedChapter:true,tier:"PRO",minTier:"PRO"}),true);
    assert.deepEqual(domain.normalizeGoalSlugs(["muscle_building","football","athleticism"]),["athleticism","football","muscle_building"]);
    assert.throws(()=>domain.normalizeGoalSlugs(["football","football"]));
  });
  const admin=await db.user.create({data:{email:uuid("journey_admin")+"@example.invalid",passwordHash:"isolated-test",role:"ADMIN"}});
  const athlete=await db.user.create({data:{email:uuid("journey_athlete")+"@example.invalid",passwordHash:"isolated-test",role:"ATHLETE",subscriptionTier:"FREE"}});
  const other=await db.user.create({data:{email:uuid("journey_other")+"@example.invalid",passwordHash:"isolated-test",role:"ATHLETE"}});
  // Baseline entities remain editable and available throughout an athlete's new journey.
  const existingGoal=await db.goal.create({data:{userId:athlete.id,type:"muscle_building"}});
  const existingScore=await db.scoreSnapshot.create({data:{userId:athlete.id,date:new Date("2026-10-20T00:00:00Z"),total:35}});
  const goals=await Promise.all(["football","athleticism","muscle_building"].map(slug=>
    db.journeyGoal.create({data:{slug:uuid(slug),titleDe:slug}})));
  const pathway=await db.journeyPathway.create({data:{slug:uuid("football_athletics_strength"),titleDe:"Fußball + Athletik + Muskelaufbau"}});
  for(const goal of goals)await db.journeyPathwayGoal.create({data:{pathwayId:pathway.id,goalId:goal.id}});
  const version=await db.journeyPathwayVersion.create({
    data:{pathwayId:pathway.id,version:1,state:"PUBLISHED",goalSlugs:goals.map(g=>g.slug).sort(),publishedAt:new Date()}});
  const ready=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"READY",labelDe:"READY",position:1}});
  const awake=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"AWAKE",labelDe:"AWAKE",position:2}});
  const c1=await db.journeyChapter.create({data:{levelId:ready.id,position:1,titleDe:"Grundlagen"}});
  const c2=await db.journeyChapter.create({data:{levelId:ready.id,position:2,titleDe:"Technik"}});
  const c3=await db.journeyChapter.create({data:{levelId:awake.id,position:1,titleDe:"Aufbau"}});
  const item1=await db.journeyChapterItem.create({data:{chapterId:c1.id,position:1,kind:"GUIDANCE",mandatory:true,titleDe:"Mobilität"}});
  const item2=await db.journeyChapterItem.create({data:{chapterId:c2.id,position:1,kind:"GUIDANCE",mandatory:true,titleDe:"Technik"}});
  const item3=await db.journeyChapterItem.create({data:{chapterId:c3.id,position:1,kind:"GUIDANCE",mandatory:true,titleDe:"Kraft"}});
  const mediaImage=await db.mediaAsset.create({data:{ownerId:admin.id,kind:"EXERCISE_IMAGE",storageKey:uuid("journey_photo"),originalName:"photo.png",mimeType:"image/png",sizeBytes:321}});
  const mediaVideo=await db.mediaAsset.create({data:{ownerId:admin.id,kind:"EXERCISE_VIDEO",storageKey:uuid("journey_video"),originalName:"coach.mp4",mimeType:"video/mp4",sizeBytes:1024}});
  const image=await db.chapterMediaVariant.create({data:{itemId:item1.id,mediaAssetId:mediaImage.id,role:"START_IMAGE",minTier:"FREE"}});
  const video=await db.chapterMediaVariant.create({data:{itemId:item1.id,mediaAssetId:mediaVideo.id,role:"EXPLANATION_VIDEO",minTier:"PRO",durationSec:10}});
  const invalidVideo=await db.chapterMediaVariant.create({data:{itemId:item1.id,mediaAssetId:mediaVideo.id,role:"EXPLANATION_VIDEO",presenter:"TRAINER",minTier:"FREE",durationSec:10}});
  const criteria={schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:20}]};
  const assessment1=await db.journeyAssessment.create({data:{versionId:version.id,chapterId:c1.id,kind:"CHAPTER_FINAL",titleDe:"Kapitelprüfung 1",criteria,approvedAt:new Date()}});
  const assessment2=await db.journeyAssessment.create({data:{versionId:version.id,chapterId:c2.id,kind:"CHAPTER_FINAL",titleDe:"Kapitelprüfung 2",criteria,approvedAt:new Date()}});
  const placementAssessment=await db.journeyAssessment.create({data:{versionId:version.id,kind:"PLACEMENT",titleDe:"Einstufungstest",criteria,approvedAt:new Date()}});
  const enrollment=await service.enrollInJourney(athlete.id,version.id,"READY");
  await check("exact goal combination resolves to coach-authored published version only",async()=>{
    const v=await service.findCuratedJourney(goals.map(g=>g.slug));
    assert.equal(v.id,version.id);
    const x=await service.findCuratedJourney(["missing_football"]);
    assert.equal(x,null);
  });
  await check("self-assessment stays PENDING, including on repeat enrollment",async()=>{
    const second=await service.enrollInJourney(athlete.id,version.id,"AWAKE");
    assert.equal(second.id,enrollment.id);
    assert.equal(second.confirmedLevel,null);
    assert.equal((await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}})),0);
    assert.equal((await service.inspectJourneyMediaAccess(athlete.id,image.id)).allowed,false);
  });
  await check("non-coach cannot approve even READY placement",async()=>{
    await rejects(()=>service.confirmJourneyPlacement({enrollmentId:enrollment.id,level:"READY",approvedById:other.id,reason:"COACH_APPROVAL"}),"Trainerfreigabe");
  });
  await check("approved placement grants first chapter only, no other chapters",async()=>{
    const placement=await service.confirmJourneyPlacement({enrollmentId:enrollment.id,level:"READY",approvedById:admin.id,reason:"COACH_APPROVAL"});
    assert.equal(placement.firstChapterId,c1.id);
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),1);
    assert.equal((await service.inspectJourneyMediaAccess(athlete.id,image.id)).allowed,true);
    assert.equal((await service.inspectJourneyMediaAccess(athlete.id,video.id)).reason,"SUBSCRIPTION_REQUIRED");
    assert.equal((await service.inspectJourneyMediaAccess(athlete.id,invalidVideo.id)).reason,"INVALID_MEDIA_POLICY");
    await rejects(()=>service.confirmJourneyPlacement({enrollmentId:enrollment.id,level:"TRULY_DIFFERENT",approvedById:admin.id,reason:"COACH_APPROVAL"}),"bereits");
  });
  await check("future chapter activity cannot be completed early",async()=>{
    await rejects(()=>service.markJourneyItemComplete(athlete.id,enrollment.id,item2.id),"gesperrt");
    await rejects(()=>service.markJourneyItemComplete(other.id,enrollment.id,item1.id),"eigene");
  });
  await check("PRO unlocks extra media for earned chapter, not extra chapters",async()=>{
    await db.user.update({where:{id:athlete.id},data:{subscriptionTier:"PRO"}});
    assert.equal((await service.inspectJourneyMediaAccess(athlete.id,video.id)).allowed,true);
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),1);
    await db.user.update({where:{id:athlete.id},data:{subscriptionTier:"FREE"}});
  });
  await check("required chapter activity gates exam and repeats remain idempotent",async()=>{
    const args={userId:athlete.id,enrollmentId:enrollment.id,assessmentId:assessment1.id,
      results:[{key:"pushups",unit:"reps",value:14}],idempotencyKey:uuid("failed_attempt")};
    await rejects(()=>service.submitJourneyAssessment(args),"Pflichtinhalte");
    await service.markJourneyItemComplete(athlete.id,enrollment.id,item1.id);
    const first=await service.submitJourneyAssessment(args);
    assert.equal(first.verdict,"PENDING");
    const retry=await service.submitJourneyAssessment(args);
    assert.equal(first.id,retry.id);
    await rejects(()=>service.submitJourneyAssessment({...args,results:[{key:"pushups",unit:"reps",value:24}]}),"anderen Ergebnissen");
    const result=await service.reviewJourneyAttempt({attemptId:first.id,reviewerId:admin.id,coachFeedbackDe:"Weiter üben"});
    assert.equal(result.verdict,"FAILED");
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),1);
  });
  await check("passing first chapter unlocks chapter 2, not AWAKE",async()=>{
    const attempt=await service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
      assessmentId:assessment1.id,results:[{key:"pushups",unit:"reps",value:24}],idempotencyKey:uuid("passing_first")});
    const decision=await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:admin.id});
    assert.equal(decision.verdict,"PASSED");
    assert.equal(decision.nextChapterId,c2.id);
    assert.equal(decision.nextLevel,null);
    assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,"READY");
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),2);
    assert.equal((await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:admin.id})).replayed,true);
  });
  await check("passing last READY chapter earns AWAKE, without changing legacy score",async()=>{
    await service.markJourneyItemComplete(athlete.id,enrollment.id,item2.id);
    const attempt=await service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
      assessmentId:assessment2.id,results:[{key:"pushups",unit:"reps",value:28}],idempotencyKey:uuid("passing_second")});
    const decision=await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:admin.id});
    assert.equal(decision.nextLevel,"AWAKE");
    assert.equal(decision.nextChapterId,c3.id);
    assert.equal(await db.journeyLevelAward.count({where:{enrollmentId:enrollment.id}}),2);
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),3);
    assert.equal((await db.scoreSnapshot.findUnique({where:{id:existingScore.id}})).total,35);
    assert.equal((await db.goal.findUnique({where:{id:existingGoal.id}})).type,"muscle_building");
    assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,"AWAKE");
  });
  await check("unapproved placement assessment never admits future users",async()=>{
    await db.journeyAssessment.update({where:{id:placementAssessment.id},data:{approvedAt:null}});
    const recruit=await db.user.create({data:{email:uuid("recruit")+"@example.invalid",passwordHash:"isolated-test",role:"ATHLETE"}});
    const newcomer=await service.enrollInJourney(recruit.id,version.id,"TRULY_DIFFERENT");
    await rejects(()=>service.submitJourneyAssessment({userId:recruit.id,enrollmentId:newcomer.id,
      assessmentId:placementAssessment.id,results:[{key:"pushups",unit:"reps",value:50}],
      idempotencyKey:uuid("recruit_attempt")}),"nicht für diesen Weg genehmigt");
    assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:newcomer.id}}),0);
  });
  console.log("JOURNEY_STEP03_OK "+checks);
}finally{
  await db.$disconnect();
}
