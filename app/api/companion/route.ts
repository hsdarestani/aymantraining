import {translate,language} from "../../../lib/i18n/translate";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {getDailyProfile} from "../../../lib/daily-profile-service";
import {scoreView} from "../../../lib/score-view";
import {hasFeature} from "../../../lib/entitlements";
import {PATCH as updateWorkout} from "../workouts/[id]/route";
import {POST as recordSet} from "../workouts/[id]/sets/route";

const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("set"),workoutId:z.string(),exerciseId:z.string(),setNumber:z.number().int().min(1).max(20),reps:z.number().int().min(0).max(1000).optional(),durationS:z.number().int().min(0).max(86400).optional(),distanceM:z.number().min(0).max(500000).optional(),weightKg:z.number().min(0).max(1000).optional(),rpe:z.number().int().min(1).max(10).optional()}),
 z.object({action:z.literal("complete"),workoutId:z.string(),rpe:z.number().int().min(1).max(10).optional()})
]);

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const [score,workout,profile]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*3600000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}},sets:{orderBy:[{exerciseId:"asc"},{setNumber:"asc"}]}},orderBy:{scheduledAt:"asc"}}),
  getDailyProfile(user.id)
 ]);
 return NextResponse.json({
  ok:true,locale:user.locale,
  score:scoreView(score,await hasFeature(user.subscriptionTier,"score_details"),profile.journey.confirmedLevel),
  workout:workout?{
    id:workout.id,title:translate(workout.title,language(user.locale)),scheduledAt:workout.scheduledAt,
    exercises:workout.exercises.map(x=>({id:x.exerciseId,name:user.locale==="en"?(x.exercise.nameEn||x.exercise.nameDe):x.exercise.nameDe,sets:x.targetSets,reps:x.targetReps,rpe:x.targetRpe,restSeconds:x.restSeconds,completed:workout.sets.filter(s=>s.exerciseId===x.exerciseId).length}))
  }:null,
  updatedAt:new Date().toISOString()
 });
}

export async function POST(request:Request){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Uhr Aktion.",422);const data=p.data;
 const workout=await prisma.workout.findFirst({where:{id:data.workoutId,userId:user.id},include:{exercises:true}});
 if(!workout)return errorJson("Training nicht gefunden.",404);
 if(data.action==="set"){
  if(!workout.exercises.some(x=>x.exerciseId===data.exerciseId))return errorJson("Übung gehört nicht zu diesem Training.",422);
  return recordSet(new Request(request.url,{method:"POST",headers:request.headers,body:JSON.stringify(data)}),{params:Promise.resolve({id:workout.id})});
 }
 return updateWorkout(new Request(request.url,{method:"PATCH",headers:request.headers,body:JSON.stringify(data)}),{params:Promise.resolve({id:workout.id})});
}
