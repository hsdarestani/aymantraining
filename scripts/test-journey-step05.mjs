import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Step 05 tests require the disposable bedifferent_test database.");
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
 const full=path.resolve(file.endsWith(".ts")?file:file+".ts");
 if(cache.has(full))return cache.get(full);
 const mod={exports:{}};
 cache.set(full,mod.exports);
 const js=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true
 }}).outputText;
 new Function("require","module","exports",js)((name)=>name.startsWith(".")?load(path.resolve(path.dirname(full),name)):require(name),mod,mod.exports);
 cache.set(full,mod.exports);return mod.exports;
}
const editor=load("lib/journey-editor-service.ts");
const policy=load("lib/journey-editor-contract.ts");
const db=new PrismaClient(),stamp=Date.now().toString(36);
const email=(name)=>name+"_"+stamp+"@example.invalid";
let passed=0;
async function check(name,fn){await fn();passed++;console.log("PASS",name);}
async function rejects(fn,word){await assert.rejects(fn,e=>{assert(String(e).includes(word),String(e));return true});}
try{
 const admin=await db.user.create({data:{email:email("coach_admin"),role:"ADMIN",passwordHash:"test"}});
 const coach=await db.user.create({data:{email:email("coach_writer"),role:"COACH",passwordHash:"test"}});
 const athlete=await db.user.create({data:{email:email("coach_athlete"),role:"ATHLETE",passwordHash:"test"}});
 const oldGoal=await db.goal.create({data:{userId:athlete.id,type:"calisthenics"}});
 const oldScore=await db.scoreSnapshot.create({data:{userId:athlete.id,date:new Date("2026-10-18T00:00:00Z"),total:39}});
 const existingPlan=await db.trainingPlan.create({data:{name:"Old active plan "+stamp,isTemplate:true,active:true}});
 const exercise=await db.exercise.create({data:{id:"step05_"+stamp,nameDe:"Übung "+stamp,category:"QA",active:true}});
 const mediaImage=await db.mediaAsset.create({data:{ownerId:coach.id,relatedUserId:coach.id,kind:"EXERCISE_IMAGE",storageKey:"journey-media/2026/step05-img-"+stamp,originalName:"coach.webp",mimeType:"image/webp",sizeBytes:250}});
 const mediaVideo=await db.mediaAsset.create({data:{ownerId:coach.id,relatedUserId:coach.id,kind:"EXERCISE_VIDEO",storageKey:"journey-media/2026/step05-vid-"+stamp,originalName:"coach.mp4",mimeType:"video/mp4",sizeBytes:2500}});
 const goals=["football","athleticism","muscle_building"];
 const request=await db.journeyIntake.create({data:{userId:athlete.id,selectedGoalSlugs:[...goals].sort(),
  selfLevel:"TRULY_DIFFERENT",status:"PENDING_PATHWAY"}});
 await check("a non-coach cannot create curriculum",async()=>{
  await rejects(()=>editor.createCoachJourney(athlete.id,{titleDe:"Football club",goals}),"UNAUTHORIZED");
 });
 await check("coach creates the exact curated combination as a DRAFT with five ordered levels",async()=>{
  const created=await editor.createCoachJourney(coach.id,{titleDe:"Coach path "+stamp,
   description:"Trainingsweg Fußball + Athletik + Muskelaufbau",goals});
  assert(created.versionId);
  const version=await editor.getCoachJourneyVersion(coach.id,created.versionId);
  assert.deepEqual(version.levels.map(x=>x.code),["READY","AWAKE","DIFFERENT","BE_DIFFERENT","TRULY_DIFFERENT"]);
  assert.equal(version.state,"DRAFT");assert.equal(version.goalSlugs.length,3);
  globalThis.testPath=created;globalThis.testVersion=version;
 });
 await check("duplicate exact goal combination is rejected",async()=>{
  await rejects(()=>editor.createCoachJourney(coach.id,{titleDe:"Duplicate way",goals}),"DUPLICATE_COMBINATION");
 });
 const root=globalThis.testVersion,created=globalThis.testPath;
 const assessment={titleDe:"Coach bestätigter Test",approved:true,
  criteria:{schemaVersion:1,metrics:[{key:"technique_score",unit:"points",min:5}]},
  retestRules:{minHoursAfterFailure:24,guidanceDe:"Trainiere weiter."}};
 const draft={revision:root.revision,notes:"Zielkombination vorbereitet",levels:root.levels.map((x,i)=>({
  code:x.code,description:x.description,chapters:[{
   titleDe:"Kapitel "+(i+1),description:"Trainingsabschnitt",plannedDurationDays:14,
   items:[{kind:"GUIDANCE",titleDe:"Anleitung "+i,description:"Schrittweise Einweisung",exerciseId:null,trainingPlanId:null,mandatory:true,media:[]}],
   test:assessment
  }]
 })),placement:assessment};
 draft.levels[0].chapters[0].items.push({kind:"EXERCISE",titleDe:"Coach-Übung",
  description:"Körper kontrollieren und langsam bewegen.",exerciseId:exercise.id,trainingPlanId:null,mandatory:true,
  media:[
   {mediaAssetId:mediaImage.id,role:"START_IMAGE",presenter:"COACH",durationSec:null},
   {mediaAssetId:mediaVideo.id,role:"EXPLANATION_VIDEO",presenter:"COACH",durationSec:10}
  ]});
 draft.levels[0].chapters[0].items.push({kind:"TRAINING_PLAN",titleDe:"Aufbauplan",
  description:"",exerciseId:null,trainingPlanId:existingPlan.id,mandatory:true,media:[]});
 await check("incomplete drafts cannot be published",async()=>{
  await rejects(()=>editor.publishCoachJourneyVersion(coach.id,created.versionId),"INCOMPLETE");
 });
 await check("field-level contract refuses wrong duration and incomplete metric",async()=>{
  const wrong=structuredClone(draft);wrong.levels[0].chapters[0].items[1].media[1].durationSec=20;
  assert(!policy.curriculumDraftSchema.safeParse(wrong).success);
  const invalid=structuredClone(draft);invalid.levels[0].chapters[0].test.criteria.metrics[0].unit="";
  assert(!policy.curriculumDraftSchema.safeParse(invalid).success);
 });
 await check("draft graph saves every chapter test, item and FREE/PRO media without altering legacy records",async()=>{
  const saved=await editor.saveCoachJourneyDraft(coach.id,created.versionId,draft);
  assert(saved.revision!==draft.revision);
  const v=await editor.getCoachJourneyVersion(coach.id,created.versionId);
  assert.equal(v.levels.length,5);assert.equal(v.levels[0].chapters[0].items.length,3);
  const media=v.levels[0].chapters[0].items[1].media;
  assert.equal(media.find(x=>x.role==="START_IMAGE")?.mediaAssetId,mediaImage.id);
  assert.equal(media.find(x=>x.role==="EXPLANATION_VIDEO")?.durationSec,10);
  assert.equal((await db.goal.findUnique({where:{id:oldGoal.id}})).type,"calisthenics");
  assert.equal((await db.scoreSnapshot.findUnique({where:{id:oldScore.id}})).total,39);
 });
 await check("stale editor tab cannot overwrite newer draft",async()=>{
  await rejects(()=>editor.saveCoachJourneyDraft(coach.id,created.versionId,draft),"REVISION_CONFLICT");
 });
 await check("publish frozen version once, map waiting intake only to PENDING with no awards",async()=>{
  const result=await editor.publishCoachJourneyVersion(coach.id,created.versionId);
  assert.equal(result.matchedIntakes,1);
  const waiting=await db.journeyIntake.findUnique({where:{id:request.id}});
  assert.equal(waiting.matchedVersionId,created.versionId);
  assert.equal(waiting.status,"PENDING_PLACEMENT");
  const enrollment=await db.journeyEnrollment.findUnique({where:{userId_versionId:{userId:athlete.id,versionId:created.versionId}}});
  assert.equal(enrollment.state,"PENDING");assert.equal(enrollment.confirmedLevel,null);
  assert.equal(await db.journeyLevelAward.count({where:{enrollmentId:enrollment.id}}),0);
  assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:enrollment.id}}),0);
 });
 await check("published version is read only and cloning creates a separate draft",async()=>{
  const published=await editor.getCoachJourneyVersion(coach.id,created.versionId);
  await rejects(()=>editor.saveCoachJourneyDraft(coach.id,created.versionId,{
   revision:published.revision,notes:"modification",levels:published.levels,placement:published.placement
  }),"PUBLISHED_IMMUTABLE");
  await rejects(()=>editor.publishCoachJourneyVersion(coach.id,created.versionId),"PUBLISHED_IMMUTABLE");
  const clone=await editor.cloneCoachJourneyVersion(coach.id,created.id);
  assert.equal(clone.version,2);
  const v2=await editor.getCoachJourneyVersion(coach.id,clone.id);
  assert.equal(v2.state,"DRAFT");
  assert.equal(v2.levels[0].chapters[0].items[1].media.length,2);
  assert.equal((await db.journeyPathwayVersion.findUnique({where:{id:created.versionId}})).state,"PUBLISHED");
  await rejects(()=>editor.cloneCoachJourneyVersion(coach.id,created.id),"DRAFT_ALREADY_EXISTS");
 });
 console.log("COACH_JOURNEY_STEP05_OK "+passed);
}finally{await db.$disconnect();}
