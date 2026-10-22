import assert from "node:assert/strict";
import {createRequire} from "node:module";
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Isolated bedifferent_test required");
const db=new PrismaClient(),cache=new Map(),req=createRequire(import.meta.url);
function load(modulePath){
 const full=path.resolve(modulePath.endsWith(".ts")?modulePath:modulePath+".ts");
 if(cache.has(full))return cache.get(full);
 const m={exports:{}};cache.set(full,m.exports);
 const code=ts.transpileModule(fs.readFileSync(full,"utf8"),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true
 }}).outputText;
 new Function("require","module","exports",code)((name)=>name.startsWith(".")?load(path.resolve(path.dirname(full),name)):req(name),m,m.exports);
 cache.set(full,m.exports);return m.exports;
}
const access=load("lib/legacy-media-access.ts"),reader=load("lib/journey-reader.ts");
const label=Date.now().toString(36);let passed=0;
async function check(name,fn){await fn();passed++;console.log("PASS",name)}
try{
 const owner=await db.user.create({data:{email:"s8-co-"+label+"@example.invalid",role:"COACH",passwordHash:"test"}});
 const free=await db.user.create({data:{email:"s8-free-"+label+"@example.invalid",role:"ATHLETE",subscriptionTier:"FREE",passwordHash:"test"}});
 const pro=await db.user.create({data:{email:"s8-pro-"+label+"@example.invalid",role:"ATHLETE",subscriptionTier:"PRO",passwordHash:"test"}});
 const outsider=await db.user.create({data:{email:"s8-other-"+label+"@example.invalid",role:"ATHLETE",subscriptionTier:"PRO",passwordHash:"test"}});
 const image=await db.mediaAsset.create({data:{ownerId:owner.id,kind:"EXERCISE_IMAGE",storageKey:"media/step08-img-"+label,mimeType:"image/png",originalName:"demo.png",sizeBytes:100}});
 const legacyClip=await db.mediaAsset.create({data:{ownerId:owner.id,kind:"EXERCISE_VIDEO",storageKey:"media/step08-vid-"+label,mimeType:"video/mp4",originalName:"legacy.mp4",sizeBytes:1024}});
 const privateClip=await db.mediaAsset.create({data:{ownerId:owner.id,kind:"EXERCISE_VIDEO",storageKey:"journey-media/2026/s8-"+label,mimeType:"video/mp4",originalName:"coach.mp4",sizeBytes:1000}});
 const ex=await db.exercise.create({data:{id:"s8_"+label,nameDe:"Ausfallschritt",category:"Athletik",videoUrl:"/api/media/"+legacyClip.id,active:true,freeAccess:true}});
 await check("a FREE athlete cannot stream formerly public exercise video",async()=>{
  assert.equal(await access.canReadLegacyExerciseVideo({userId:free.id,assetId:legacyClip.id,tier:"FREE",role:"ATHLETE"}),false);
 });
 await check("PRO may view assigned published legacy video",async()=>{
  assert.equal(await access.canReadLegacyExerciseVideo({userId:pro.id,assetId:legacyClip.id,tier:"PRO",role:"ATHLETE"}),true);
 });
 await check("orphan or Journey namespace video never gains legacy access",async()=>{
  assert.equal(await access.canReadLegacyExerciseVideo({userId:pro.id,assetId:privateClip.id,tier:"PRO",role:"ATHLETE"}),false);
 });
 const pathway=await db.journeyPathway.create({data:{slug:"s8_"+label,titleDe:"Sicherer Fortschritt"}});
 const version=await db.journeyPathwayVersion.create({data:{pathwayId:pathway.id,state:"PUBLISHED",version:1,goalSlugs:["athleticism"],publishedAt:new Date()}});
 const level=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:"READY",labelDe:"READY",position:1}});
 const chapter=await db.journeyChapter.create({data:{levelId:level.id,titleDe:"Anfang",position:1}});
 const item=await db.journeyChapterItem.create({data:{chapterId:chapter.id,titleDe:"Ausfallschritt",kind:"EXERCISE",description:"Bewegung sauber durchführen",position:1,exerciseId:ex.id,
  publishedSnapshot:{schemaVersion:1,exercise:{nameDe:"Ausfallschritt",category:"Athletik",equipment:null,coachTips:["Langsam"]},trainingPlan:null}}});
 await db.chapterMediaVariant.create({data:{itemId:item.id,mediaAssetId:image.id,role:"START_IMAGE",presenter:"COACH",minTier:"FREE"}});
 await db.chapterMediaVariant.create({data:{itemId:item.id,mediaAssetId:privateClip.id,role:"EXPLANATION_VIDEO",presenter:"COACH",minTier:"PRO",durationSec:10}});
 const e1=await db.journeyEnrollment.create({data:{userId:free.id,versionId:version.id,state:"ACTIVE",confirmedLevel:"READY"}});
 const e2=await db.journeyEnrollment.create({data:{userId:pro.id,versionId:version.id,state:"ACTIVE",confirmedLevel:"READY"}});
 await db.journeyChapterUnlock.create({data:{enrollmentId:e1.id,chapterId:chapter.id,reason:"COACH_APPROVAL"}});
 await db.journeyChapterUnlock.create({data:{enrollmentId:e2.id,chapterId:chapter.id,reason:"COACH_APPROVAL"}});
 await check("locked athlete cannot obtain any chapter text or media link",async()=>{
  await assert.rejects(()=>reader.getOwnedJourneyChapter(outsider.id,e2.id,chapter.id));
 });
 await check("PRO chapter media is hidden from FREE, even with unlocked chapter",async()=>{
  process.env.JOURNEY_EDITOR_ENABLED="true";
  const view=await reader.getOwnedJourneyChapter(free.id,e1.id,chapter.id);
  const clip=view.items[0].media.find(x=>x.role==="EXPLANATION_VIDEO");
  assert.equal(clip.available,false);assert.equal(clip.url,null);
 });
 await check("published snapshots survive legacy exercise modifications",async()=>{
  await db.exercise.update({where:{id:ex.id},data:{nameDe:"Manipulierte neue Übung",coachCue1:"Falsch",videoUrl:null}});
  const frozen=await reader.getOwnedJourneyChapter(pro.id,e2.id,chapter.id);
  assert.equal(frozen.items[0].exercise.nameDe,"Ausfallschritt");
  assert.equal(frozen.items[0].exercise.coachTips[0],"Langsam");
  assert(frozen.items[0].media.find(x=>x.role==="EXPLANATION_VIDEO").url.endsWith(privateClip.id));
 });
 console.log("JOURNEY_STEP08_OK "+passed);
}finally{await db.$disconnect();}
