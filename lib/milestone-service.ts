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
 const user=await prisma.user.findUnique({where:{id:userId},select:{timezone:true}});
 if(!user)throw Error("NOT_FOUND");
 const zone=user.timezone||"Europe/Berlin",today=localDateKey(now,zone),since=addDays(today,-119);
 const start=new Date(since+"T00:00:00Z");
 const [workouts,checks,planned,rest,journey,workoutCount,levelAwards]=await Promise.all([
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
   ?prisma.journeyLevelAward.count({where:{enrollment:{userId}}}):Promise.resolve(0)
 ]);
 const activities:Activity[]=[];
 for(const w of workouts)if(w.completedAt)activities.push({day:localDateKey(w.completedAt,zone),kind:"WORKOUT",sourceId:w.id});
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
 return {...progress,workoutCount,earnedLevels:levelAwards,today,timeZone:zone};
}
type Rule={key:string;metric:string;threshold:number;title:string;message:string;visualIntensity:string};
function metricReached(rule:Rule,progress:{streak:number;best:number;workoutCount:number;earnedLevels:number}){
 const value=rule.metric==="STREAK_DAYS"?progress.best:rule.metric==="WORKOUT_COUNT"?progress.workoutCount:
  rule.metric==="EARNED_LEVELS"?progress.earnedLevels:0;
 return value>=rule.threshold;
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
   progress:r.metric==="STREAK_DAYS"?verified.best:r.metric==="WORKOUT_COUNT"?verified.workoutCount:verified.earnedLevels
  })))
 ]);
 return {...verified,enabled:true,awards,next};
}
