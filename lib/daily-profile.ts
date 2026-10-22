// BD Score is a longitudinal performance snapshot, never an earned Journey level.
// All three domains are deliberately independent: profile, today's signals, plan.
export type ProfileScore = {date:Date;total:number;completeness:number}|null;
export type DailyCheckInput = {energy:number|null;soreness:number|null;sleepHours:number|null}|null;
export type SleepInput = {date:Date;sleepMinutes:number|null}|null;
export type WorkoutInput = {id:string;title:string;scheduledAt:Date|null;completedAt:Date|null};
export type DailyProfileInput = {
 now:Date;timeZone:string;score:ProfileScore;check:DailyCheckInput;sleep:SleepInput;
 workouts:WorkoutInput[];confirmedLevel:string|null;
};
export function localDateKey(value:Date,timeZone:string):string {
 try {
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value);
  const get=(key:string)=>parts.find(part=>part.type===key)?.value||"";
  return get("year")+"-"+get("month")+"-"+get("day");
 } catch {return localDateKey(value,"Europe/Berlin");}
}
export function buildDailyProfile(input:DailyProfileInput){
 const date=localDateKey(input.now,input.timeZone);
 // A database @db.Date value is a calendar key, not a local-time instant.
 const snapshotDay=input.score?.date.toISOString().slice(0,10)??null;
 const ageDays=snapshotDay?Math.floor((Date.parse(date+"T00:00:00Z")-Date.parse(snapshotDay+"T00:00:00Z"))/86400000):null;
 const enoughData=(input.score?.completeness??0)>0;
 const workouts=input.workouts.filter(w=>w.scheduledAt&&localDateKey(w.scheduledAt,input.timeZone)===date);
 const scheduled=workouts.length,completed=workouts.filter(w=>w.completedAt!=null).length;
 const planStatus=scheduled===0?"NOT_SCHEDULED":completed===scheduled?"DONE":completed>0?"PARTIAL":"PLANNED";
 const wearableDate=input.sleep?.date.toISOString().slice(0,10)??null;
 const previousDay=new Date(Date.parse(date+"T00:00:00Z")-86400000).toISOString().slice(0,10);
 const recentSleep=wearableDate===date||wearableDate===previousDay;
 const sleepHours=recentSleep&&input.sleep?.sleepMinutes!=null?Math.round(input.sleep.sleepMinutes/6)/10:input.check?.sleepHours??null;
 const missing:string[]=[];
 if(!input.check)missing.push("CHECK_IN");
 if(sleepHours==null)missing.push("SLEEP");
 if(!enoughData)missing.push("PROFILE_SCORE");
 if(scheduled===0)missing.push("SCHEDULE");
 return {
  date,timeZone:input.timeZone,
  profile:{
   value:enoughData?input.score!.total:null,completeness:input.score?.completeness??0,
   recordedDate:snapshotDay,daysOld:ageDays,
   freshness:!enoughData?"MISSING":ageDays!=null&&ageDays>14?"OLD":"RECORDED",
   // A historical snapshot cannot be relabelled as today's readiness.
   isToday:enoughData&&snapshotDay===date
  },
  today:{
   energy:input.check?.energy??null,soreness:input.check?.soreness??null,sleepHours,
   hasCheckIn:Boolean(input.check),missing,
   // Today's subjective condition is not a new numeric BD Score.
   readinessScore:null
  },
  plan:{
   status:planStatus,scheduled,completed,
   completionPercent:scheduled?Math.round(100*completed/scheduled):null
  },
  journey:{confirmedLevel:input.confirmedLevel},
  // Level is only approved by a coach or chapter/test awards, never a score band.
  scoreIsLevel:false
 };
}
