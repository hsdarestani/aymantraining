import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";
import {getDailyProfile} from "../../../lib/daily-profile-service";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"digital_twin"))return errorJson("Der digitale Athlet ist PRO.",403);
 const since=new Date(Date.now()-90*86400000);
 const [history,context,body,tests]=await Promise.all([
  prisma.scoreSnapshot.findMany({where:{userId:user.id,date:{gte:since},completeness:{gt:0}},orderBy:{date:"asc"}}),
  prisma.athleteContext.findUnique({where:{userId:user.id}}),
  prisma.bodyMetric.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.performanceTest.findMany({where:{userId:user.id,completedAt:{not:null}},include:{results:true},orderBy:{completedAt:"desc"},take:8})
 ]);
 const current=history.at(-1)??await prisma.scoreSnapshot.findFirst({where:{userId:user.id,completeness:{gt:0}},orderBy:{date:"desc"}});
 if(!current)return NextResponse.json({ok:true,current:null,history:[],target:null});
 const profile=await getDailyProfile(user.id);
 const first=history[0]??current;
 const days=Math.max(1,(current.date.getTime()-first.date.getTime())/86400000);
 const daily=(current.total-first.total)/days;
 const targetDate=context?.targetDate??new Date(Date.now()+84*86400000);
 const futureDays=Math.max(1,(targetDate.getTime()-Date.now())/86400000);
 const projected=Math.max(0,Math.min(100,Math.round(current.total+daily*futureDays)));
 const targetScore=context?.targetScore??Math.max(current.total,projected);
 const pillars={
  strength:current.strength??null,endurance:current.endurance??null,athleticism:current.athleticism??null,
  mobility:current.mobility??null,recovery:current.recovery??null,fuel:current.fuel??null,consistency:current.consistency??null
 };
 const targetPillars=Object.fromEntries(Object.entries(pillars).map(([k,v])=>[k,v==null?null:Math.min(100,Math.max(Number(v),Math.round(Number(v)+(targetScore-current.total)*0.8)))]));
 return NextResponse.json({
  ok:true,
  current:{total:current.total,level:profile.journey.confirmedLevel,pillars,completeness:current.completeness,recordedDate:current.date},
  target:{score:targetScore,date:targetDate,projected,pillars:targetPillars},
  history:history.map(x=>({date:x.date,total:x.total})),
  body,
  tests:tests.map(t=>({id:t.id,name:t.name,completedAt:t.completedAt,results:t.results})),
  disclaimer:"Die Prognose ist eine Trenddarstellung und keine medizinische Vorhersage."
 });
}
