import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {createRequire} from "node:module";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Step 07 tests require isolated bedifferent_test.");
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
const db=new PrismaClient(),reader=load("lib/journey-reader.ts");
const stamp=Date.now().toString(36);
let checks=0;
const test=async(label,fn)=>{await fn();checks++;console.log("PASS",label)};
const rejects=async(fn,label)=>assert.rejects(fn,e=>{assert(String(e).includes(label),String(e));return true});
try{
 const coach=await db.user.create({data:{email:"step7co_"+stamp+"@example.invalid",passwordHash:"x",role:"COACH"}});
 const free=await db.user.create({data:{email:"step7free_"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true,subscriptionTier:"FREE"}});
 const pro=await db.user.create({data:{email:"step7pro_"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true,subscriptionTier:"PRO"}});
 const legacy=await db.user.create({data:{email:"step7legacy_"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true}});
 const other=await db.user.create({data:{email:"step7other_"+stamp+"@example.invalid",passwordHash:"x",onboardingCompleted:true}});
 const goal=await db.goal.create({data:{userId:legacy.id,type:"football"}});
 const score=await db.scoreSnapshot.create({data:{userId:legacy.id,date:new Date("2026-10-18T00:00:00Z"),total:39}});
 const plan=await db.trainingPlan.create({data:{name:"Old current plan "+stamp,isTemplate:true,active:true}});
 await db.planAssignment.create({data:{userId:legacy.id,planId:plan.id}});
 const pathway=await db.journeyPathway.create({data:{slug:"step07_"+stamp,titleDe:"Athletik und Fußball",active:true}});
 const version=await db.journeyPathwayVersion.create({data:{pathwayId:pathway.id,version:1,state:"PUBLISHED",
  publishedAt:new Date(),goalSlugs:["athleticism","football"]}});
 const ready=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"READY",labelDe:"READY",position:1}});
 const awake=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"AWAKE",labelDe:"AWAKE",position:2}});
 const chapter1=await db.journeyChapter.create({data:{levelId:ready.id,position:1,titleDe:"Erster Schritt",description:"Vertrauliche Anleitung"}});
 const chapter2=await db.journeyChapter.create({data:{levelId:ready.id,position:2,titleDe:"Noch gesperrt",description:"Vertraulicher Inhalt"}});
 const chapter3=await db.journeyChapter.create({data:{levelId:awake.id,position:1,titleDe:"AWAKE Abschnitt",description:"Noch gesperrt"}});
 const item1=await db.journeyChapterItem.create({data:{chapterId:chapter1.id,position:1,kind:"GUIDANCE",titleDe:"Mobilität",description:"Privater Hinweis",mandatory:true}});
 const item2=await db.journeyChapterItem.create({data:{chapterId:chapter1.id,position:2,kind:"EXERCISE",titleDe:"Kniebeugen",description:"Immer kontrolliert",mandatory:true,publishedSnapshot:{schemaVersion:1,exercise:{nameDe:"Kniebeugen",category:"QA",equipment:null,coachTips:[]},trainingPlan:null}}});
 const lockedItem=await db.journeyChapterItem.create({data:{chapterId:chapter2.id,position:1,kind:"GUIDANCE",titleDe:"Vertrauliche Übung",description:"Geheim",mandatory:true}});
 const image=await db.mediaAsset.create({data:{ownerId:coach.id,kind:"EXERCISE_IMAGE",storageKey:"journey-media/2026/step07-img-"+stamp,originalName:"coach.png",mimeType:"image/png",sizeBytes:550}});
 const video=await db.mediaAsset.create({data:{ownerId:coach.id,kind:"EXERCISE_VIDEO",storageKey:"journey-media/2026/step07-vid-"+stamp,originalName:"coach.mp4",mimeType:"video/mp4",sizeBytes:1450}});
 await db.chapterMediaVariant.create({data:{itemId:item2.id,mediaAssetId:image.id,role:"START_IMAGE",presenter:"COACH",minTier:"FREE"}});
 await db.chapterMediaVariant.create({data:{itemId:item2.id,mediaAssetId:video.id,role:"EXPLANATION_VIDEO",presenter:"COACH",minTier:"PRO",durationSec:10}});
 const enrollmentFree=await db.journeyEnrollment.create({data:{userId:free.id,versionId:version.id,state:"ACTIVE",confirmedLevel:"READY",selfLevel:"READY"}});
 const enrollmentPro=await db.journeyEnrollment.create({data:{userId:pro.id,versionId:version.id,state:"ACTIVE",confirmedLevel:"READY",selfLevel:"READY"}});
 for(const enrollment of [enrollmentFree,enrollmentPro]){
  await db.journeyLevelAward.create({data:{enrollmentId:enrollment.id,levelId:ready.id,reason:"COACH_APPROVAL"}});
  await db.journeyChapterUnlock.create({data:{enrollmentId:enrollment.id,chapterId:chapter1.id,reason:"COACH_APPROVAL"}});
 }
 await db.journeyActivityCompletion.create({data:{enrollmentId:enrollmentFree.id,itemId:item1.id}});
 await test("only self-owned journeys appear and confirmed Level is separate from legacy scores",async()=>{
  const overview=await reader.getJourneyOverview(free.id);
  assert.equal(overview.enrollments.length,1);
  assert.equal(overview.enrollments[0].confirmedLevel,"READY");
  assert.deepEqual(overview.enrollments[0].earnedLevels,["READY"]);
  assert.equal((await reader.getJourneyOverview(other.id)).enrollments.length,0);
 });
 await test("locked preview exposes title only: no lessons, description, media or progress",async()=>{
  const data=await reader.getJourneyOverview(free.id);
  const chapters=data.enrollments[0].levels[0].chapters;
  assert.equal(chapters[0].mandatoryDone,1);assert.equal(chapters[0].mandatoryTotal,2);
  assert.equal(chapters[1].unlocked,false);assert.equal(chapters[1].mandatoryDone,null);
  assert(!JSON.stringify(data).includes("Vertraulicher Inhalt"));
  assert(!JSON.stringify(data).includes("Vertrauliche Übung"));
  assert(!JSON.stringify(data).includes("journey-media/"));
 });
 await test("locked chapters are 403 even for own active enrollment",async()=>{
  await rejects(()=>reader.getOwnedJourneyChapter(free.id,enrollmentFree.id,chapter2.id),"LOCKED");
  await rejects(()=>reader.getOwnedJourneyChapter(pro.id,enrollmentFree.id,chapter1.id),"NOT_FOUND");
  await rejects(()=>reader.getOwnedJourneyChapter(other.id,enrollmentFree.id,chapter1.id),"NOT_FOUND");
 });
 await test("earned FREE chapter includes full instructions and image but not PRO media address",async()=>{
  process.env.JOURNEY_EDITOR_ENABLED="true";
  const c=await reader.getOwnedJourneyChapter(free.id,enrollmentFree.id,chapter1.id);
  assert.equal(c.mandatoryDone,1);assert.equal(c.mandatoryTotal,2);
  assert(c.items[0].description.includes("Privater Hinweis"));
  assert(c.items[1].description.includes("kontrolliert"));
  const pic=c.items[1].media.find(x=>x.role==="START_IMAGE");
  const clip=c.items[1].media.find(x=>x.role==="EXPLANATION_VIDEO");
  assert(pic.available);assert(pic.url.includes(image.id));
  assert.equal(clip.available,false);assert.equal(clip.url,null);
  assert(!JSON.stringify(c).includes(video.id));
  assert(!JSON.stringify(c).includes("journey-media/"));
 });
 await test("earned PRO chapter gets same instructions plus eligible short coach video",async()=>{
  const c=await reader.getOwnedJourneyChapter(pro.id,enrollmentPro.id,chapter1.id);
  assert.equal(c.items.length,2);
  assert(c.items[1].media.find(x=>x.role==="START_IMAGE").available);
  assert(c.items[1].media.find(x=>x.role==="EXPLANATION_VIDEO").url.includes(video.id));
 });
 await test("when media serving is disabled the chapter data remains but no URLs leak",async()=>{
  process.env.JOURNEY_EDITOR_ENABLED="false";
  const c=await reader.getOwnedJourneyChapter(pro.id,enrollmentPro.id,chapter1.id);
  assert.equal(c.items.length,2);
  assert(c.items[1].media.every(x=>x.url===null&&!x.available));
 });
 await test("legacy transfer stores PENDING placement without converting prior Score, Plan or badges",async()=>{
  const res=await reader.optInLegacyJourney(legacy.id,["athleticism","football"],"TRULY_DIFFERENT");
  assert.equal(res.status,"PENDING_PLACEMENT");
  const matching=await db.journeyEnrollment.findUnique({where:{userId_versionId:{userId:legacy.id,versionId:version.id}}});
  assert.equal(matching.state,"PENDING");assert.equal(matching.confirmedLevel,null);
  assert.equal(await db.journeyLevelAward.count({where:{enrollmentId:matching.id}}),0);
  assert.equal(await db.journeyChapterUnlock.count({where:{enrollmentId:matching.id}}),0);
  assert.equal((await db.goal.findUnique({where:{id:goal.id}})).type,"football");
  assert.equal((await db.scoreSnapshot.findUnique({where:{id:score.id}})).total,39);
  assert.equal(await db.planAssignment.count({where:{userId:legacy.id,planId:plan.id}}),1);
 });
 await test("legacy transfer cannot run twice or overwrite an existing enrollment",async()=>{
  await rejects(()=>reader.optInLegacyJourney(legacy.id,["football","athleticism"],"READY"),"ALREADY_REQUESTED");
 });
 await test("unknown goal combinations are stored for coach curation, not substituted",async()=>{
  const res=await reader.optInLegacyJourney(other.id,["health","football"],"READY");
  assert.equal(res.status,"PENDING_PATHWAY");
  assert.equal(await db.journeyEnrollment.count({where:{userId:other.id}}),0);
  assert.equal((await db.journeyIntake.findUnique({where:{userId:other.id}})).status,"PENDING_PATHWAY");
 });
 console.log("JOURNEY_STEP07_OK "+checks);
}finally{await db.$disconnect();}
