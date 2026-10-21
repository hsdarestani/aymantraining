import assert from "node:assert/strict";
import fs from "node:fs";import path from "node:path";import ts from "typescript";
import {createRequire} from "node:module";import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Step 06 requires isolated bedifferent_test database.");
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
 const full=path.resolve(file.endsWith(".ts")?file:file+".ts");
 if(cache.has(full))return cache.get(full);
 const mod={exports:{}};cache.set(full,mod.exports);
 const js=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true
 }}).outputText;
 new Function("require","module","exports",js)((name)=>name.startsWith(".")?load(path.resolve(path.dirname(full),name)):require(name),mod,mod.exports);
 cache.set(full,mod.exports);return mod.exports;
}
const db=new PrismaClient(),service=load("lib/journey-service.ts"),views=load("lib/journey-test-views.ts");
const suffix=Date.now().toString(36);const checks=[];
const test=async(name,fn)=>{await fn();checks.push(name);console.log("PASS",name)};
const throws=async(fn,contains)=>assert.rejects(fn,e=>{assert(String(e).includes(contains),String(e));return true});
const key=name=>name+"_"+suffix;
const criterion={schemaVersion:1,metrics:[{key:"pushups",unit:"reps",min:20}]};
try{
 const coach=await db.user.create({data:{email:key("step6coach")+"@example.invalid",passwordHash:"test",role:"COACH"}});
 const stranger=await db.user.create({data:{email:key("step6other")+"@example.invalid",passwordHash:"test",role:"COACH"}});
 const athlete=await db.user.create({data:{email:key("step6athlete")+"@example.invalid",passwordHash:"test",role:"ATHLETE"}});
 const other=await db.user.create({data:{email:key("step6another")+"@example.invalid",passwordHash:"test",role:"ATHLETE"}});
 await db.coachAssignment.create({data:{coachId:coach.id,athleteId:athlete.id,active:true}});
 const pathway=await db.journeyPathway.create({data:{slug:key("step6"),titleDe:"Athletik und Kraft"}});
 const ver=await db.journeyPathwayVersion.create({data:{pathwayId:pathway.id,version:1,state:"PUBLISHED",goalSlugs:["athleticism","muscle_building"]}});
 const lv1=await db.journeyLevelDefinition.create({data:{versionId:ver.id,code:"READY",labelDe:"READY",position:1}});
 const lv2=await db.journeyLevelDefinition.create({data:{versionId:ver.id,code:"AWAKE",labelDe:"AWAKE",position:2}});
 const ch1=await db.journeyChapter.create({data:{levelId:lv1.id,position:1,titleDe:"Basis"}});
 const ch2=await db.journeyChapter.create({data:{levelId:lv1.id,position:2,titleDe:"Technik"}});
 const ch3=await db.journeyChapter.create({data:{levelId:lv2.id,position:1,titleDe:"Aufbau"}});
 const i1=await db.journeyChapterItem.create({data:{chapterId:ch1.id,position:1,kind:"GUIDANCE",titleDe:"Grundlagen",mandatory:true}});
 const i2=await db.journeyChapterItem.create({data:{chapterId:ch2.id,position:1,kind:"GUIDANCE",titleDe:"Technik",mandatory:true}});
 const final1=await db.journeyAssessment.create({data:{versionId:ver.id,chapterId:ch1.id,kind:"CHAPTER_FINAL",titleDe:"READY Test 1",criteria:criterion,
  retestRules:{minHoursAfterFailure:48,guidanceDe:"Arbeite an deiner Rumpfstabilität."},approvedAt:new Date()}});
 const final2=await db.journeyAssessment.create({data:{versionId:ver.id,chapterId:ch2.id,kind:"CHAPTER_FINAL",titleDe:"READY Test 2",criteria:criterion,approvedAt:new Date()}});
 const placement=await db.journeyAssessment.create({data:{versionId:ver.id,kind:"PLACEMENT",titleDe:"Einstufung READY",criteria:criterion,approvedAt:new Date()}});
 const enrollment=await db.journeyEnrollment.create({data:{userId:athlete.id,versionId:ver.id,state:"PENDING",selfLevel:"TRULY_DIFFERENT"}});
 await test("self-estimation has zero chapter access and placement is private",async()=>{
  const list=await views.listAthleteJourneyTests(athlete.id);
  assert.equal(list.length,1);assert.equal(list[0].confirmedLevel,null);
  assert.equal(list[0].chapters.filter(c=>c.unlocked).length,0);
  assert.equal(list[0].placement.id,placement.id);
  assert.equal((await views.listAthleteJourneyTests(other.id)).length,0);
 });
 await test("unassigned coach cannot view pending results",async()=>{
  assert.equal((await views.listPendingJourneyReviews({id:stranger.id,role:"COACH"})).length,0);
 });
 const failed=await service.submitJourneyAssessment({
  userId:athlete.id,enrollmentId:enrollment.id,assessmentId:placement.id,
  results:[{key:"pushups",unit:"reps",value:10}],idempotencyKey:key("placement_failed")
 });
 await test("submitted placement remains pending and duplicate pending attempt is refused",async()=>{
  const listed=await views.listAthleteJourneyTests(athlete.id);
  assert.equal(listed[0].placement.attempts[0].verdict,"PENDING");
  assert.equal(listed[0].placement.canSubmit,false);
  await throws(()=>service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
   assessmentId:placement.id,results:[{key:"pushups",unit:"reps",value:28}],idempotencyKey:key("while_pending")}),"vorheriger Test");
  assert.equal((await views.listPendingJourneyReviews({id:coach.id,role:"COACH"})).length,1);
 });
 await test("another coach cannot decide the athlete's result",async()=>{
  await throws(()=>service.reviewJourneyAttempt({attemptId:failed.id,reviewerId:stranger.id,coachFeedbackDe:"Weitertrainieren."}),"zuständig");
  assert.equal((await db.journeyTestAttempt.findUnique({where:{id:failed.id}})).verdict,"PENDING");
 });
 await test("failing test preserves lock and returns failure metrics and retest time",async()=>{
  const result=await service.reviewJourneyAttempt({attemptId:failed.id,reviewerId:coach.id,coachFeedbackDe:"Stabile Technik zuerst."});
  assert.equal(result.verdict,"FAILED");assert.deepEqual(result.score.failed.map(f=>f.key),["pushups"]);
  assert(result.nextRetestAt);assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),0);
  const listed=await views.listAthleteJourneyTests(athlete.id);
  assert.equal(listed[0].placement.canSubmit,false);
  assert(listed[0].placement.guidanceDe.includes("Rumpfstabilität"));
  await throws(()=>service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
    assessmentId:placement.id,results:[{key:"pushups",unit:"reps",value:29}],idempotencyKey:key("too_early")}),"Nächster Versuch");
 });
 await test("passed placement still cannot auto-confirm self-selected TRULY DIFFERENT",async()=>{
  await db.journeyTestAttempt.update({where:{id:failed.id},data:{reviewedAt:new Date(Date.now()-50*3600000)}});
  const submission=await service.submitJourneyAssessment({
    userId:athlete.id,enrollmentId:enrollment.id,assessmentId:placement.id,
    results:[{key:"pushups",unit:"reps",value:25}],idempotencyKey:key("placement_success")
  });
  const result=await service.reviewJourneyAttempt({attemptId:submission.id,reviewerId:coach.id});
  assert.equal(result.verdict,"PASSED");
  assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,null);
  await throws(()=>service.confirmJourneyPlacement({enrollmentId:enrollment.id,approvedById:coach.id,
   reason:"PLACEMENT_TEST",level:"READY",passedPlacementAttemptId:failed.id}),"Bestandener");
  await service.confirmJourneyPlacement({enrollmentId:enrollment.id,approvedById:coach.id,
    reason:"PLACEMENT_TEST",level:"READY",passedPlacementAttemptId:submission.id});
  assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,"READY");
  assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),1);
 });
 await test("mandatory exercises are required before final submission",async()=>{
  await throws(()=>service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
   assessmentId:final1.id,idempotencyKey:key("premature"),results:[{key:"pushups",unit:"reps",value:30}]}),"Pflichtinhalte");
  await service.markJourneyItemComplete(athlete.id,enrollment.id,i1.id);
 });
 await test("a failure on a chapter never unlocks the next chapter",async()=>{
  const attempt=await service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
   assessmentId:final1.id,idempotencyKey:key("chapter_fail"),results:[{key:"pushups",unit:"reps",value:8}]});
  await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:coach.id,coachFeedbackDe:"Technik überprüfen."});
  assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),1);
  await db.journeyTestAttempt.update({where:{id:attempt.id},data:{reviewedAt:new Date(Date.now()-50*3600000)}});
 });
 await test("passing chapter one unlocks chapter two but not AWAKE",async()=>{
  const attempt=await service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
   assessmentId:final1.id,idempotencyKey:key("chapter_pass"),results:[{key:"pushups",unit:"reps",value:30}]});
  const first=await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:coach.id});
  assert.equal(first.verdict,"PASSED");assert.equal(first.nextChapterId,ch2.id);assert.equal(first.nextLevel,null);
  assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,"READY");
  assert.equal((await service.reviewJourneyAttempt({attemptId:attempt.id,reviewerId:coach.id})).replayed,true);
 });
 await test("next chapter test promotes READY to AWAKE and keeps private history",async()=>{
  await service.markJourneyItemComplete(athlete.id,enrollment.id,i2.id);
  const a=await service.submitJourneyAssessment({userId:athlete.id,enrollmentId:enrollment.id,
   assessmentId:final2.id,idempotencyKey:key("chapter2pass"),results:[{key:"pushups",unit:"reps",value:35}]});
  const result=await service.reviewJourneyAttempt({attemptId:a.id,reviewerId:coach.id});
  assert.equal(result.nextLevel,"AWAKE");assert.equal(result.nextChapterId,ch3.id);
  assert.equal(await db.journeyLevelAward.count({where:{enrollmentId:enrollment.id}}),2);
  const own=await views.listAthleteJourneyTests(athlete.id);
  assert(own[0].chapters.some(c=>c.id===ch3.id&&c.unlocked));
  assert(own[0].chapters.find(c=>c.id===ch1.id).assessment.attempts.some(t=>t.verdict==="FAILED"));
  assert.equal((await views.listAthleteJourneyTests(other.id)).length,0);
 });
 console.log("STEP06_JOURNEY_OK "+checks.length);
}finally{await db.$disconnect();}
