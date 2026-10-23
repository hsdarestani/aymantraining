import {translate,language} from "./i18n/translate";
import {prisma} from "./db";
import {localDateKey} from "./daily-profile";
import {milestonesEnabled,calculateStreak,addDays,toDayDate,defaultRules,type Activity,type Schedule} from "./milestone-contract";
import type {Prisma} from "@prisma/client";

const privateHeaders={"cache-control":"private, no-store"};
export {privateHeaders as milestoneHeaders};
function hasActualCheck(c:{energy:number|null;soreness:number|null;mood:number|null;stress:number|null;sleepHours:number|null}){
 return [c.energy,c.soreness,c.mood,c.stress,c.sleepHours].some(v=>v!==null);
}
export async function getVerifiedEngagement(userId:string,now=new Date()){
 const user=await prisma.user.findUnique({where:{id:userId},select:{timezone:true,name:true,locale:true}});
 if(!user)throw Error("NOT_FOUND");
 const zone=user.timezone||"Europe/Berlin",today=localDateKey(now,zone),since=addDays(today,-119);
 const start=new Date(since+"T00:00:00Z");
 const [workouts,checks,planned,rest,journey,workoutCount,levelAwards,nutrition,completedChapters,passedTests,levelUps,trulyDifferent]=await Promise.all([
  prisma.workout.findMany({where:{userId,completedAt:{gte:new Date(start.getTime()-86400000),lte:now}},
   select:{id:true,completedAt:true}}),
  prisma.dailyCheck.findMany({where:{userId,date:{gte:start}},
   select:{id:true,date:true,energy:true,soreness:true,mood:true,stress:true,sleepHours:true}}),
  prisma.workout.findMany({where:{userId,scheduledAt:{gte:new Date(start.getTime()-86400000),lte:new Date(now.getTime()+86400000)}},
   select:{scheduledAt:true}}),
  milestonesEnabled()?prisma.plannedRecoveryDay.findMany({where:{athleteId:userId,day:{gte:start}},
   select:{id:true,day:true,createdAt:true}}):Promise.resolve([]),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"
   ?prisma.journeyActivityCompletion.findMany({where:{enrollment:{userId},completedAt:{gte:start,lte:now}},
     select:{id:true,completedAt:true}}):Promise.resolve([]),
  prisma.workout.count({where:{userId,completedAt:{not:null,lte:now}}}),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"
   ?prisma.journeyLevelAward.count({where:{enrollment:{userId}}}):Promise.resolve(0),
  prisma.nutritionDaily.findMany({where:{userId,date:{gte:start,lte:toDayDate(today)}},select:{id:true,date:true}}),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"?prisma.journeyChapterCompletion.count({where:{enrollment:{userId},completedAt:{lte:now}}}):Promise.resolve(0),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"?prisma.journeyTestAttempt.count({where:{enrollment:{userId},verdict:"PASSED",reviewedById:{not:null},reviewedAt:{lte:now}}}):Promise.resolve(0),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"?prisma.journeyLevelAward.count({where:{enrollment:{userId},reason:"PASSED_CHAPTER_TEST",awardedAt:{lte:now}}}):Promise.resolve(0),
  process.env.JOURNEY_OVERVIEW_ENABLED==="true"?prisma.journeyLevelAward.count({where:{enrollment:{userId},level:{code:"TRULY_DIFFERENT"},awardedAt:{lte:now}}}):Promise.resolve(0)
 ]);
 const activities:Activity[]=[];
 for(const w of workouts)if(w.completedAt)activities.push({day:localDateKey(w.completedAt,zone),kind:"WORKOUT",sourceId:w.id});
 for(const n of nutrition)activities.push({day:n.date.toISOString().slice(0,10),kind:"CHECKIN",sourceId:n.id});
 for(const c of checks)if(hasActualCheck(c))activities.push({day:c.date.toISOString().slice(0,10),kind:"CHECKIN",sourceId:c.id});
 for(const j of journey)activities.push({day:localDateKey(j.completedAt,zone),kind:"JOURNEY",sourceId:j.id});
 const scheduled:Schedule[]=planned.filter(x=>x.scheduledAt!=null).map(x=>({day:localDateKey(x.scheduledAt!,zone),sourceId:"scheduled"}));
 for(const r of rest){
  const day=r.day.toISOString().slice(0,10);
  // A recovery day scheduled retroactively must not create historical credit.
  if(localDateKey(r.createdAt,zone)>day)continue;
  activities.push({day,kind:"RECOVERY",sourceId:r.id});
 }
 const progress=calculateStreak(today,activities,scheduled);
 const recoveryDays=new Set(rest.filter(r=>{const day=r.day.toISOString().slice(0,10);return day<=today&&localDateKey(r.createdAt,zone)<=day&&!scheduled.some(s=>s.day===day)}).map(r=>r.day.toISOString().slice(0,10))).size;
 const nutritionDays=new Set(nutrition.map(n=>n.date.toISOString().slice(0,10))).size;
 return {...progress,workoutCount,earnedLevels:levelAwards,nutritionDays,recoveryDays,completedChapters,passedTests,levelUps,trulyDifferent,today,timeZone:zone,locale:language(user.locale),athleteName:user.name};
}
type Rule={key:string;metric:string;threshold:number;title:string;message:string;visualIntensity:string};
type Progress={best:number;workoutCount:number;earnedLevels:number;nutritionDays:number;recoveryDays:number;completedChapters:number;passedTests:number;levelUps:number;trulyDifferent:number};
function metricValue(rule:Rule,p:Progress){
 const values:Record<string,number>={STREAK_DAYS:p.best,WORKOUT_COUNT:p.workoutCount,EARNED_LEVELS:p.earnedLevels,NUTRITION_DAYS:p.nutritionDays,RECOVERY_DAYS:p.recoveryDays,CHAPTER_COUNT:p.completedChapters,PASSED_TESTS:p.passedTests,LEVEL_UPS:p.levelUps,TRULY_DIFFERENT:p.trulyDifferent};
 return values[rule.metric]??0;
}
function metricReached(rule:Rule,progress:Progress){return metricValue(rule,progress)>=rule.threshold;}
export function presentMilestone<T extends {title:string;message:string}>(award:T,locale:'de'|'en',name:string|null){
 return {...award,title:translate(award.title,locale),message:(name?name+", ":"")+translate(award.message,locale)};
}
export async function getMilestoneSnapshot(userId:string,now=new Date()){
 const verified=await getVerifiedEngagement(userId,now);
 if(!milestonesEnabled())return {...verified,enabled:false,awards:[],next:[]};
 const rules=await prisma.milestoneRule.findMany({where:{athleteId:userId,enabled:true},
  orderBy:[{threshold:"asc"},{createdAt:"asc"}]});
 const all:Rule[]=[...defaultRules,...rules];
 // Create awards idempotently using unique (userId,key); never overwrite award dates.
 const awarded=all.filter(rule=>metricReached(rule,verified));
 // Bounded writes: createMany skips duplicate keys even under concurrent reads.
 if(awarded.length)await prisma.milestoneAward.createMany({data:awarded.map(r=>({
  userId,key:r.key,title:r.title,message:r.message,visualIntensity:r.visualIntensity,
  achievedAt:now
 })),skipDuplicates:true});
 const [awards,next]=await Promise.all([
  prisma.milestoneAward.findMany({where:{userId},orderBy:{createdAt:"desc"},take:50}),
  Promise.resolve(all.filter(r=>!metricReached(r,verified)).map(r=>({
   key:r.key,title:r.title,metric:r.metric,threshold:r.threshold,
   progress:metricValue(r,verified)
  })))
 ]);
 return {...verified,enabled:true,awards:awards.map(a=>presentMilestone(a,verified.locale,verified.athleteName)),next:next.map(r=>({...r,title:translate(r.title,verified.locale)}))};
}
