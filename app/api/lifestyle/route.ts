import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";

function avg(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function trend(current:number|null,prior:number|null){if(current==null||prior==null)return null;return Math.round((current-prior)*10)/10}
function sleepScore(hours:number|null,target:number,regularity:number|null){
 const duration=hours==null?null:Math.max(0,Math.min(100,hours/target*100));
 if(duration==null&&regularity==null)return null;
 return Math.round((duration??70)*0.75+(regularity??70)*0.25);
}
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const advanced=await hasFeature(user.subscriptionTier,"sleep_advanced");
 const since=new Date(Date.now()-30*86400000);
 const [wearables,checks,score,ctx]=await Promise.all([
  prisma.wearableDaily.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findMany({where:{userId:user.id,date:{gte:since}},orderBy:{date:"desc"}}),
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.athleteContext.findUnique({where:{userId:user.id}})
 ]);
 const sleepHours=wearables.map(x=>x.sleepMinutes==null?null:x.sleepMinutes/60).filter((x):x is number=>x!=null);
 const recent7=sleepHours.slice(0,7),prior7=sleepHours.slice(7,14);
 const average7=avg(recent7),average30=avg(sleepHours);
 const sleepVariance=recent7.length>1?Math.sqrt(recent7.reduce((s,x)=>s+Math.pow(x-(average7??x),2),0)/recent7.length):null;
 const regularity=sleepVariance==null?null:Math.max(0,Math.min(100,Math.round(100-sleepVariance*25)));
 const targetHours=8;
 const scoreSleep=sleepScore(average7,targetHours,regularity);
 const hrv=wearables.map(x=>x.hrv).filter((x):x is number=>x!=null),rhr=wearables.map(x=>x.restingHr).filter((x):x is number=>x!=null);
 const stages=wearables.find(x=>x.sleepStages&&typeof x.sleepStages==="object")?.sleepStages??null;
 const tips:string[]=[];
 if(average7!=null&&average7<7)tips.push("Plane heute mehr Schlafzeit ein.");
 if(regularity!=null&&regularity<70)tips.push("Halte Schlafenszeit und Aufstehzeit konstanter.");
 if(score?.recovery!=null&&score.recovery<60)tips.push("Reduziere hohe Belastung und priorisiere aktive Regeneration.");
 if(!tips.length)tips.push("Deine Schlafbasis ist stabil. Halte deine Routine konstant.");
 return NextResponse.json({
  ok:true,advanced,score,
  sleep:{
   hoursLatest:sleepHours[0]??checks[0]?.sleepHours??null,average7,average30,
   change7:trend(average7,avg(prior7)),regularity,score:scoreSleep,stages:advanced?stages:null,
   bedtimeTarget:ctx?.bedtimeTarget??"22:30",tips:advanced?tips:[],dataDays:sleepHours.length
  },
  recovery:{hrvLatest:advanced?(hrv[0]??null):null,hrvAverage7:advanced?avg(hrv.slice(0,7)):null,restingHrLatest:advanced?(rhr[0]??null):null,restingHrAverage7:advanced?avg(rhr.slice(0,7)):null},
  wearables:advanced?wearables:wearables.map(x=>({date:x.date,steps:x.steps,activeCalories:x.activeCalories,totalCalories:x.totalCalories,sleepMinutes:x.sleepMinutes})),
  checks
 });
}
