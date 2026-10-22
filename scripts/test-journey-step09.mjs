import assert from "node:assert/strict";
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {PrismaClient} from "@prisma/client";
if(!process.env.DATABASE_URL?.includes("bedifferent_test"))throw Error("Disposable database required.");
const require=createRequire(import.meta.url),cache=new Map(),db=new PrismaClient();
function load(name){
 const file=path.resolve(name.endsWith(".ts")?name:name+".ts");
 if(cache.has(file))return cache.get(file);
 const m={exports:{}};cache.set(file,m.exports);
 const output=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function("require","module","exports",output)((dep)=>dep.startsWith(".")?load(path.resolve(path.dirname(file),dep)):require(dep),m,m.exports);
 cache.set(file,m.exports);return m.exports;
}
const service=load("lib/step09-coaching.ts");let count=0;
const test=async(name,fn)=>{await fn();console.log("PASS",name);count++};
const rejects=async(fn,msg)=>assert.rejects(fn,e=>{assert(String(e).includes(msg),String(e));return true});
const stamp=Date.now().toString(36);
try{
 const coach=await db.user.create({data:{email:"s9coach"+stamp+"@example.invalid",role:"COACH",passwordHash:"x"}});
 const notCoach=await db.user.create({data:{email:"s9othercoach"+stamp+"@example.invalid",role:"COACH",passwordHash:"x"}});
 const athlete=await db.user.create({data:{email:"s9athlete"+stamp+"@example.invalid",role:"ATHLETE",passwordHash:"x",subscriptionTier:"PRO"}});
 const free=await db.user.create({data:{email:"s9free"+stamp+"@example.invalid",role:"ATHLETE",passwordHash:"x",subscriptionTier:"FREE"}});
 await db.coachAssignment.create({data:{athleteId:athlete.id,coachId:coach.id,active:true}});
 const video=await db.mediaAsset.create({data:{ownerId:athlete.id,relatedUserId:athlete.id,kind:"TECHNIQUE_VIDEO",storageKey:"media/test-s9-"+stamp,originalName:"athlete.mp4",mimeType:"video/mp4",sizeBytes:150}});
 const workout=await db.workout.create({data:{userId:athlete.id,title:"Next strength session",scheduledAt:new Date(Date.now()+86400000)}});
 await test("empty day reports no scheduled training, not fabricated rest or readiness",async()=>{
  const day=await service.getStep09Today(athlete.id);
  assert.equal(day.plan.kind,"NO_WORKOUT_PLANNED");
  assert.equal(day.readiness.hasCheckin,false);assert.equal(day.readiness.energy,null);
  assert.equal(day.nextWorkout.id,workout.id);
 });
 await test("PRO athlete submits owned video once",async()=>{
  const first=await service.submitTechniqueReview({athleteId:athlete.id,mediaId:video.id,sourceWorkoutId:workout.id,athleteNoteDe:"Bitte Technik ansehen."});
  assert.equal(first.status,"PENDING");
  const again=await service.submitTechniqueReview({athleteId:athlete.id,mediaId:video.id});
  assert.equal(again.replayed,true);
  assert.equal(await db.coachTechniqueReview.count({where:{mediaId:video.id}}),1);
 });
 await test("FREE and other user video submissions rejected",async()=>{
  await rejects(()=>service.submitTechniqueReview({athleteId:free.id,mediaId:video.id}),"COACH_PRO_REQUIRED");
  const other=await db.user.create({data:{email:"s9other"+stamp+"@example.invalid",role:"ATHLETE",passwordHash:"x",subscriptionTier:"PRO"}});
  await rejects(()=>service.submitTechniqueReview({athleteId:other.id,mediaId:video.id}),"MEDIA_NOT_OWNED");
 });
 const review=await db.coachTechniqueReview.findFirstOrThrow({where:{mediaId:video.id}});
 await test("unassigned coach cannot access athlete review",async()=>{
  await rejects(()=>service.reviewTechnique({actor:{id:notCoach.id,role:"COACH"},reviewId:review.id,feedbackDe:"Weiter am Kniehub arbeiten."}),"NOT_ASSIGNED");
 });
 await test("invalid athlete workout may not be targeted",async()=>{
  const another=await db.workout.create({data:{userId:free.id,title:"Different athlete"}});
  await rejects(()=>service.reviewTechnique({actor:{id:coach.id,role:"COACH"},reviewId:review.id,feedbackDe:"Kniehub stabilisieren.",nextSessionCueDe:"Langsam aufbauen.",targetWorkoutId:another.id}),"INVALID_TARGET_WORKOUT");
 });
 await test("coach reviews and targets next scheduled workout; no automatic exercise workload edit",async()=>{
  const before=await db.workout.findUniqueOrThrow({where:{id:workout.id}});
  await service.reviewTechnique({actor:{id:coach.id,role:"COACH"},reviewId:review.id,
   feedbackDe:"Schulterposition verbessern und Ellbogen im Blick behalten.",
   nextSessionCueDe:"Bei Aufwärmsätzen Ellbogen ruhig und Rumpf stabil halten.",targetWorkoutId:workout.id});
  const after=await db.workout.findUniqueOrThrow({where:{id:workout.id}});
  assert.equal(before.notes,after.notes);
  const detail=await service.getCoachCueForWorkout(athlete.id,workout.id,workout.scheduledAt);
  assert(detail.text.includes("Ellbogen"));
  assert.equal(detail.assignedToWorkout,true);
  assert.equal((await service.getStep09Today(athlete.id)).coach.nextSessionCueDe,detail.text);
 });
 await test("review decisions are immutable",async()=>{
  await rejects(()=>service.reviewTechnique({actor:{id:coach.id,role:"COACH"},reviewId:review.id,feedbackDe:"Noch einmal prüfen."}),"ALREADY_REVIEWED");
 });
 console.log("STEP09_COACH_ACCEPTANCE_OK "+count);
}finally{await db.$disconnect();}
