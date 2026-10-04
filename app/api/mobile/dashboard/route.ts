import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,dateOnly} from "../../../../lib/http";
import {scoreView} from "../../../../lib/score-view";
import {hasFeature} from "../../../../lib/entitlements";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const today=dateOnly();
 const [score,check,wearable,nextWorkout,recommendations,nutrition,radarFull,scoreDetails,advancedWearable,context]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-43200000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}}},orderBy:{scheduledAt:"asc"}}),
  prisma.recommendation.findMany({where:{userId:user.id,date:today},orderBy:{createdAt:"desc"},take:3}),
  prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  hasFeature(user.subscriptionTier,"coach_radar_full"),
  hasFeature(user.subscriptionTier,"score_details"),
  hasFeature(user.subscriptionTier,"wearable_advanced"),
  prisma.athleteContext.findUnique({where:{userId:user.id}})
 ]);
 const radar=radarFull?recommendations:recommendations.length?[{severity:"locked",title:"Dein Tageszustand ist bereit",explanation:"",action:"PRO zeigt dir die Ursache und die klare Empfehlung für heute."}]:[];
 return NextResponse.json({
  ok:true,
  user:{id:user.id,name:user.name,tier:user.subscriptionTier,onboardingCompleted:user.onboardingCompleted,locale:user.locale},
  score:scoreView(score,scoreDetails),check,wearable:advancedWearable?wearable:wearable?{date:wearable.date,steps:wearable.steps,activeCalories:wearable.activeCalories,totalCalories:wearable.totalCalories}:null,nextWorkout,recommendations:radar,radarLocked:!radarFull,scoreDetailsLocked:!scoreDetails,
  activity:{
   steps:wearable?.steps??check?.steps??0,
   stepTarget:context?.stepTarget??10000,
   activeCalories:wearable?.activeCalories??0,
   waterMl:nutrition?.waterMl??check?.waterMl??0,
   waterTargetMl:context?.waterTargetMl??2500,
   proteinG:nutrition?.proteinG??check?.proteinG??0,
   proteinTargetG:context?.proteinTargetG??130
  }
 });
}
