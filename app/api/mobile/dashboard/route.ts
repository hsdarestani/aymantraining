import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,dateOnly} from "../../../../lib/http";
import {scoreView} from "../../../../lib/score-view";
import {getDailyProfile} from "../../../../lib/daily-profile-service";
import {getDashboardPreference} from "../../../../lib/women-dashboard";
import {hasFeature} from "../../../../lib/entitlements";

const dayMs=86400000;
const isoDay=(d:Date)=>dateOnly(d).toISOString().slice(0,10);

function cycleSummary(enabled:boolean|undefined,start:Date|null|undefined,lengthRaw:number|undefined){
 if(!enabled||!start)return null;
 const length=Math.max(20,Math.min(45,lengthRaw||28));
 const days=Math.max(0,Math.floor((dateOnly(new Date()).getTime()-dateOnly(start).getTime())/dayMs));
 const day=days%length+1;
 const ovulation=Math.max(10,Math.round(length-14));
 const phase=day<=5?"MENSTRUATION":day<ovulation-1?"FOLLIKELPHASE":day<=ovulation+1?"OVULATIONSFENSTER":"LUTEALPHASE";
 return {day,length,phase};
}

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const dailyProfile=await getDailyProfile(user.id);
 const dashboardPreference=await getDashboardPreference(user.id);
 const womenGoals=dashboardPreference.mode==="WOMEN"?await prisma.goal.findMany({where:{userId:user.id,active:true},select:{type:true},take:12}):[];
 const today=new Date(dailyProfile.date+"T00:00:00.000Z");
 const tomorrow=new Date(today.getTime()+dayMs);
 const opened=await prisma.analyticsEvent.findFirst({where:{userId:user.id,name:"app_open",createdAt:{gte:today,lt:tomorrow}},select:{id:true}});
 if(!opened)await prisma.analyticsEvent.create({data:{userId:user.id,name:"app_open",properties:{surface:"mobile_home"}}});
 const timelineStart=new Date(today.getTime()-dayMs);
 const timelineEnd=new Date(today.getTime()+2*dayMs);
 const [score,check,wearable,nextWorkout,recommendations,nutrition,radarFull,scoreDetails,advancedWearable,context,timelineWorkouts,lineSetting,heroPhoto]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-43200000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}}},orderBy:{scheduledAt:"asc"}}),
  prisma.recommendation.findMany({where:{userId:user.id,date:today},orderBy:{createdAt:"desc"},take:3}),
  prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  hasFeature(user.subscriptionTier,"coach_radar_full"),
  hasFeature(user.subscriptionTier,"score_details"),
  hasFeature(user.subscriptionTier,"wearable_advanced"),
  prisma.athleteContext.findUnique({where:{userId:user.id}}),
  prisma.workout.findMany({
   where:{userId:user.id,scheduledAt:{gte:timelineStart,lt:timelineEnd}},
   select:{id:true,title:true,scheduledAt:true,completedAt:true},
   orderBy:{scheduledAt:"asc"}
  }),
  prisma.systemSetting.findUnique({where:{key:"different_lines"}}),
  prisma.mediaAsset.findFirst({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"},select:{id:true}})
 ]);
 const radar=radarFull?recommendations:recommendations.length?[{severity:"locked",title:"Dein Tageszustand ist bereit",explanation:"",action:"PRO zeigt dir die Ursache und die klare Empfehlung für heute."}]:[];
 const lines=Array.isArray(lineSetting?.value)?lineSetting!.value as string[]:[];
 const line=String(lines[Math.floor(Date.now()/dayMs)%Math.max(1,lines.length)]||"Heute zählt die nächste saubere Entscheidung.");
 const dayStrip=[-1,0,1].map(offset=>{
  const date=new Date(today.getTime()+offset*dayMs),key=isoDay(date);
  const workouts=timelineWorkouts.filter(w=>w.scheduledAt&&isoDay(w.scheduledAt)===key).map(w=>({id:w.id,title:w.title,scheduledAt:w.scheduledAt,completed:Boolean(w.completedAt)}));
  return {offset,date:key,workouts};
 });
 return NextResponse.json({
  ok:true,
  user:{id:user.id,name:user.name,tier:user.subscriptionTier,onboardingCompleted:user.onboardingCompleted,locale:user.locale},
  score:scoreView(score,scoreDetails,dailyProfile.journey.confirmedLevel),
  dailyProfile,
  dashboardPreference,
  womenGoals:womenGoals.map(g=>g.type),
  pillarPreview:scoreDetails&&score?{
   strength:score.strength,endurance:score.endurance,athleticism:score.athleticism,mobility:score.mobility,
   recovery:score.recovery,fuel:score.fuel,consistency:score.consistency
  }:null,
  differentLine:line,
  heroPhotoId:heroPhoto?.id??null,
  dayStrip,
  cycle:cycleSummary(context?.cycleTrackingEnabled,context?.cycleStartDate,context?.cycleLengthDays),
  check,wearable:advancedWearable?wearable:wearable?{date:wearable.date,steps:wearable.steps,activeCalories:wearable.activeCalories,totalCalories:wearable.totalCalories,sleepMinutes:wearable.sleepMinutes}:null,nextWorkout,recommendations:radar,radarLocked:!radarFull,scoreDetailsLocked:!scoreDetails,
  activity:{
   steps:wearable?.date?.toISOString().slice(0,10)===dailyProfile.date?wearable.steps??check?.steps??null:check?.steps??null,
   stepTarget:context?.stepTarget??10000,
   activeCalories:wearable?.date?.toISOString().slice(0,10)===dailyProfile.date?wearable.activeCalories??null:null,
   waterMl:nutrition?.waterMl??check?.waterMl??null,
   waterTargetMl:context?.waterTargetMl??2500,
   proteinG:nutrition?.proteinG??check?.proteinG??null,
   proteinTargetG:context?.proteinTargetG??130,
   sleepHours:dailyProfile.today.sleepHours
  }
 },{headers:{"cache-control":"private, no-store"}});
}
