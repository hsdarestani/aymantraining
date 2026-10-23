import {z} from "zod";

export const milestonesEnabled=()=>process.env.MILESTONES_ENABLED==="true";
export const validDay=(day:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const n=new Date(day+"T00:00:00Z");return !Number.isNaN(n.getTime())&&n.toISOString().slice(0,10)===day;
};
export const toDayDate=(day:string)=>new Date(day+"T00:00:00Z");
export const addDays=(day:string,offset:number)=>new Date(toDayDate(day).getTime()+offset*86400000).toISOString().slice(0,10);
export type Activity={day:string;kind:"WORKOUT"|"CHECKIN"|"JOURNEY"|"RECOVERY";sourceId:string};
export type Schedule={day:string;sourceId:string};
export type StreakData={streak:number;best:number;eligibleDays:number;todayStatus:"ACHIEVED"|"PLANNED_RECOVERY"|"PENDING";days:Activity[]};
export function calculateStreak(today:string,events:Activity[],scheduled:Schedule[]=[],limit=120):StreakData{
 if(!validDay(today))throw Error("Invalid local calendar day");
 const start=addDays(today,-(Math.max(1,limit)-1));
 const scheduledSet=new Set(scheduled.filter(s=>validDay(s.day)).map(s=>s.day));
 const priority:Record<Activity["kind"],number>={WORKOUT:4,JOURNEY:3,CHECKIN:2,RECOVERY:1};
 const byDay=new Map<string,Activity>();
 for(const event of events){
  if(!validDay(event.day)||event.day<start||event.day>today||!event.sourceId)continue;
  // A rest plan may not override an actual scheduled workout that was missed.
  if(event.kind==="RECOVERY"&&scheduledSet.has(event.day))continue;
  const current=byDay.get(event.day);
  if(!current||priority[event.kind]>priority[current.kind])byDay.set(event.day,event);
 }
 const days=[...byDay.values()].sort((a,b)=>a.day.localeCompare(b.day));
 let best=0,run=0,last="";
 for(const e of days){run=last&&addDays(last,1)===e.day?run+1:1;best=Math.max(best,run);last=e.day}
 let cursor=byDay.has(today)?today:addDays(today,-1),streak=0;
 while(byDay.has(cursor)&&streak<limit){streak++;cursor=addDays(cursor,-1)}
 return {streak,best,eligibleDays:days.length,days,
  todayStatus:byDay.get(today)?.kind==="RECOVERY"?"PLANNED_RECOVERY":byDay.has(today)?"ACHIEVED":"PENDING"};
}
export const ruleSchema=z.object({
 athleteId:z.string().min(1),key:z.string().regex(/^[a-z0-9_]{3,40}$/),
 metric:z.enum(["STREAK_DAYS","WORKOUT_COUNT","EARNED_LEVELS","NUTRITION_DAYS","RECOVERY_DAYS","CHAPTER_COUNT","PASSED_TESTS","LEVEL_UPS","TRULY_DIFFERENT"]),
 threshold:z.number().int().min(1).max(1000),
 title:z.string().trim().min(3).max(70),
 message:z.string().trim().min(3).max(250),
 visualIntensity:z.enum(["SMALL","MEDIUM","FULL"]),
 enabled:z.boolean().default(true)
}).strict();
export const recoverySchema=z.object({
 athleteId:z.string().min(1),day:z.string().refine(validDay),reason:z.string().trim().max(200).optional()
}).strict();
export const defaultRules=[
 {key:"step13_streak_7",metric:"STREAK_DAYS",threshold:7,title:"7 TAGE BESTÄNDIG",
  message:"Sieben nachgewiesene Tage, einschließlich im Voraus geplanter Erholung.",visualIntensity:"SMALL"},
 {key:"step13_streak_30",metric:"STREAK_DAYS",threshold:30,title:"30 TAGE BESTÄNDIG",
  message:"Dreißig nachgewiesene Tage. Die Erholung gehört zum Plan.",visualIntensity:"FULL"},
 {key:"step13_first_workout",metric:"WORKOUT_COUNT",threshold:1,title:"ERSTE EINHEIT",
  message:"Deine erste abgeschlossene Trainingseinheit ist dokumentiert.",visualIntensity:"SMALL"}
,
 {key:"step13_streak_14",metric:"STREAK_DAYS",threshold:14,title:"14 TAGE BESTÄNDIG",message:"Vierzehn nachgewiesene Tage. Dein Rhythmus wird beständiger.",visualIntensity:"MEDIUM"},
 {key:"first_planned_recovery",metric:"RECOVERY_DAYS",threshold:1,title:"ERHOLUNG GEHÖRT DAZU",message:"Du hast einen im Voraus geplanten Erholungstag eingehalten.",visualIntensity:"SMALL"},
 {key:"first_nutrition_entry",metric:"NUTRITION_DAYS",threshold:1,title:"DEIN TAG IST DOKUMENTIERT",message:"Dein Ernährungseintrag zählt. Regelmäßiges Dokumentieren wird gefeiert, nicht weniger Essen.",visualIntensity:"SMALL"},
 {key:"nutrition_seven_days",metric:"NUTRITION_DAYS",threshold:7,title:"7 TAGE ERNÄHRUNG DOKUMENTIERT",message:"Sieben verschiedene Tage dokumentiert. Du machst deine Gewohnheiten sichtbar.",visualIntensity:"MEDIUM"},
 {key:"first_chapter_completed",metric:"CHAPTER_COUNT",threshold:1,title:"KAPITEL GESCHAFFT",message:"Ein Trainingskapitel ist mit bestätigtem Abschlusstest abgeschlossen.",visualIntensity:"MEDIUM"},
 {key:"first_test_passed",metric:"PASSED_TESTS",threshold:1,title:"TEST BESTANDEN",message:"Dein Trainer hat deinen bestandenen Test bestätigt.",visualIntensity:"MEDIUM"},
 {key:"first_level_up",metric:"LEVEL_UPS",threshold:1,title:"NÄCHSTES LEVEL ERREICHT",message:"Deine abgeschlossenen Kapitel und bestätigten Tests haben das nächste Level freigeschaltet.",visualIntensity:"FULL"},
 {key:"truly_different_confirmed",metric:"TRULY_DIFFERENT",threshold:1,title:"TRULY DIFFERENT",message:"Dein höchstes Level wurde bestätigt. Dieser Erfolg gehört dir.",visualIntensity:"FULL"}
] as const;
