import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {PrismaClient} from '@prisma/client';
if(!process.env.DATABASE_URL?.includes('bedifferent_test'))throw Error('Isolated database required');
process.env.MILESTONES_ENABLED='true';process.env.JOURNEY_OVERVIEW_ENABLED='true';
const req=createRequire(import.meta.url),cache=new Map(),db=new PrismaClient();
function load(file){const full=path.resolve(file);if(full.endsWith('.json'))return JSON.parse(fs.readFileSync(full,'utf8'));if(cache.has(full))return cache.get(full);const mod={exports:{}};cache.set(full,mod.exports);const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(name=>name.startsWith('.')?load(path.resolve(path.dirname(full),name)+(path.extname(name)?'':'.ts')):req(name),mod,mod.exports);cache.set(full,mod.exports);return mod.exports;}
const {getMilestoneSnapshot}=load('lib/milestone-service.ts');
const stamp=Date.now().toString(36),now=new Date('2026-10-24T12:00:00Z');
try{
 const athlete=await db.user.create({data:{email:`milestone-events-${stamp}@example.invalid`,passwordHash:'test',name:'QA Sam',locale:'en'}});
 const coach=await db.user.create({data:{email:`milestone-events-coach-${stamp}@example.invalid`,passwordHash:'test',role:'COACH'}});
 assert.equal((await getMilestoneSnapshot(athlete.id,now)).awards.length,0);
 for(let day=0;day<14;day++){
  const date=new Date(now.getTime()-day*86400000);date.setUTCHours(0,0,0,0);
  await db.nutritionDaily.create({data:{userId:athlete.id,date,calories:day%2?0:2400}});
 }
 await db.workout.create({data:{userId:athlete.id,completedAt:new Date('2026-10-23T12:00:00Z')}});
 await db.plannedRecoveryDay.create({data:{athleteId:athlete.id,coachId:coach.id,day:new Date('2026-10-24T00:00:00Z'),createdAt:new Date('2026-10-23T00:00:00Z')}});
 let snapshot=await getMilestoneSnapshot(athlete.id,now);
 assert.equal(snapshot.nutritionDays,14);assert.equal(snapshot.recoveryDays,1);assert.equal(snapshot.streak,14,'Nutrition and planned rest preserve one day per calendar date');
 let keys=new Set(snapshot.awards.map(x=>x.key));
 for(const key of ['step13_first_workout','step13_streak_7','step13_streak_14','first_nutrition_entry','nutrition_seven_days','first_planned_recovery'])assert(keys.has(key),key);
 for(const key of ['first_chapter_completed','first_test_passed','first_level_up','truly_different_confirmed','step13_streak_30'])assert(!keys.has(key),'Must not invent '+key);
 assert(snapshot.awards.every(x=>x.message.startsWith('QA Sam, ')),'Achievements address the athlete');
 assert(snapshot.awards.some(x=>x.title==='14 DAYS OF CONSISTENCY'));
 const pathway=await db.journeyPathway.create({data:{slug:'milestone-events-'+stamp,titleDe:'QA'}});
 const version=await db.journeyPathwayVersion.create({data:{pathwayId:pathway.id,version:1,state:'PUBLISHED',goalSlugs:['health']}});
 const level=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:'READY',labelDe:'READY',position:1}});
 const top=await db.journeyLevelDefinition.create({data:{versionId:version.id,code:'TRULY_DIFFERENT',labelDe:'TRULY DIFFERENT',position:5}});
 const chapter=await db.journeyChapter.create({data:{levelId:level.id,position:1,titleDe:'QA chapter'}});
 const assessment=await db.journeyAssessment.create({data:{versionId:version.id,chapterId:chapter.id,kind:'CHAPTER_FINAL',titleDe:'QA approved test',criteria:{schemaVersion:1,metrics:[{key:'reps',unit:'reps',min:1}]}}});
 const enrollment=await db.journeyEnrollment.create({data:{userId:athlete.id,versionId:version.id,state:'ACTIVE',confirmedLevel:'READY'}});
 const attempt=await db.journeyTestAttempt.create({data:{enrollmentId:enrollment.id,assessmentId:assessment.id,idempotencyKey:'qa',results:[],verdict:'PENDING'}});
 assert(!(await getMilestoneSnapshot(athlete.id,now)).awards.some(x=>x.key==='first_test_passed'),'Unreviewed attempt does not earn a test success');
 await db.journeyTestAttempt.update({where:{id:attempt.id},data:{verdict:'PASSED',reviewedAt:now,reviewedById:coach.id}});
 await db.journeyChapterCompletion.create({data:{enrollmentId:enrollment.id,chapterId:chapter.id,attemptId:attempt.id,completedAt:now}});
 await db.journeyLevelAward.create({data:{enrollmentId:enrollment.id,levelId:top.id,reason:'PASSED_CHAPTER_TEST',attemptId:attempt.id,awardedAt:now}});
 await Promise.all([getMilestoneSnapshot(athlete.id,now),getMilestoneSnapshot(athlete.id,now)]);
 snapshot=await getMilestoneSnapshot(athlete.id,now);keys=new Set(snapshot.awards.map(x=>x.key));
 for(const key of ['first_chapter_completed','first_test_passed','first_level_up','truly_different_confirmed'])assert(keys.has(key),key);
 const awards=await db.milestoneAward.findMany({where:{userId:athlete.id}});
 assert.equal(new Set(awards.map(x=>x.key)).size,awards.length,'Replay never duplicates awards');
 assert.equal((await db.journeyEnrollment.findUnique({where:{id:enrollment.id}})).confirmedLevel,'READY','Milestone processing cannot promote the athlete');
 console.log('MILESTONE_EVENTS_OK: all requested triggers, nutrition without calorie targets, named English presentation, pending tests, replay and level isolation');
}finally{await db.$disconnect();}
