import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const full=await hasFeature(user.subscriptionTier,"weekly_report_full");
 const now=new Date(),since=new Date(now.getTime()-7*86400000),before=new Date(now.getTime()-14*86400000);
 const [scores,workouts,checks]=await Promise.all([
  prisma.scoreSnapshot.findMany({where:{userId:user.id,date:{gte:before}},orderBy:{date:"asc"}}),
  prisma.workout.findMany({where:{userId:user.id,scheduledAt:{gte:since}}}),
  prisma.dailyCheck.findMany({where:{userId:user.id,date:{gte:since}}})
 ]);
 const latest=scores.at(-1),older=scores.find(s=>s.date>=before&&s.date<since)??scores[0];
 const delta=(latest?.total??0)-(older?.total??latest?.total??0);
 const completed=workouts.filter(w=>w.completedAt).length;
 const sleep=checks.map(c=>c.sleepHours).filter((x):x is number=>x!=null);
 const avgSleep=sleep.length?sleep.reduce((a,b)=>a+b,0)/sleep.length:null;
 const positives=[
  `Training ${completed} von ${workouts.length}`,
  `Leistungswert ${delta>=0?"+":""}${delta} Prozent`,
  `Beständigkeit ${latest?.consistency??"Keine Angabe"}`
 ];
 const focus=[
  `Schlaf im Schnitt ${avgSleep==null?"Keine Angabe":avgSleep.toFixed(1)+" Stunden"}`,
  `Regeneration ${latest?.recovery??"Keine Angabe"}`,
  checks.length<5?"Tagescheck häufiger ausfüllen":"Tageschecks stabil halten"
 ];
 const actions=[
  "Geplante Einheiten sauber abschließen",
  "Schlafroutine stabil halten",
  "Tagescheck konsequent ausfüllen"
 ];
 return NextResponse.json({ok:true,full,score:latest?.total??0,delta,positives,focus:full?focus:[],actions:full?actions:[]});
}
