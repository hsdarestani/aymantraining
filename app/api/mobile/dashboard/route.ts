import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,dateOnly} from "../../../../lib/http";
import {levelForScore} from "../../../../lib/scoring";
import {hasFeature} from "../../../../lib/entitlements";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const today=dateOnly();
 const [score,check,wearable,nextWorkout,recommendations,nutrition,radarFull,scoreDetails]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-43200000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}}},orderBy:{scheduledAt:"asc"}}),
  prisma.recommendation.findMany({where:{userId:user.id,date:today},orderBy:{createdAt:"desc"},take:3}),
  prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
  hasFeature(user.subscriptionTier,"coach_radar_full"),
  hasFeature(user.subscriptionTier,"score_details")
 ]);
 const scoreView=score?scoreDetails?{...score,level:levelForScore(score.total)}:{id:score.id,date:score.date,total:score.total,completeness:score.completeness,level:levelForScore(score.total)}:null;
 const radar=radarFull?recommendations:recommendations.length?[{severity:"locked",title:"Dein Tageszustand ist bereit",explanation:"",action:"PRO zeigt dir die Ursache und die klare Empfehlung für heute."}]:[];
 return NextResponse.json({
  ok:true,
  user:{id:user.id,name:user.name,tier:user.subscriptionTier,onboardingCompleted:user.onboardingCompleted,locale:user.locale},
  score:scoreView,check,wearable,nextWorkout,recommendations:radar,radarLocked:!radarFull,scoreDetailsLocked:!scoreDetails,
  activity:{
   steps:wearable?.steps??check?.steps??0,
   stepTarget:10000,
   activeCalories:wearable?.activeCalories??0,
   waterMl:nutrition?.waterMl??check?.waterMl??0,
   waterTargetMl:2500,
   proteinG:nutrition?.proteinG??check?.proteinG??0,
   proteinTargetG:130
  }
 });
}
