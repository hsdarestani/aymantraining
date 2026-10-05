import {translate,language} from "../../../lib/i18n/translate";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {levelForScore,recomputeScoreForUser} from "../../../lib/scoring";

const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("set"),workoutId:z.string(),exerciseId:z.string(),setNumber:z.number().int().min(1).max(20),reps:z.number().int().min(0).max(500).optional(),weightKg:z.number().min(0).max(1000).optional(),rpe:z.number().int().min(1).max(10).optional()}),
 z.object({action:z.literal("complete"),workoutId:z.string(),rpe:z.number().int().min(1).max(10).optional()})
]);

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const [score,workout]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*3600000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}},sets:{orderBy:[{exerciseId:"asc"},{setNumber:"asc"}]}},orderBy:{scheduledAt:"asc"}})
 ]);
 return NextResponse.json({
  ok:true,locale:user.locale,
  score:score?{total:score.total,level:levelForScore(score.total),recovery:score.recovery,completeness:score.completeness}:null,
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
  const set=await prisma.setLog.upsert({where:{workoutId_exerciseId_setNumber:{workoutId:workout.id,exerciseId:data.exerciseId,setNumber:data.setNumber}},update:{reps:data.reps,weightKg:data.weightKg,rpe:data.rpe,completedAt:new Date()},create:{workoutId:workout.id,exerciseId:data.exerciseId,setNumber:data.setNumber,reps:data.reps,weightKg:data.weightKg,rpe:data.rpe}});
  if(!workout.startedAt)await prisma.workout.update({where:{id:workout.id},data:{startedAt:new Date()}});
  return NextResponse.json({ok:true,set});
 }
 const completed=await prisma.workout.update({where:{id:workout.id},data:{completedAt:new Date(),rpe:data.rpe??workout.rpe}});
 await recomputeScoreForUser(user.id);
 return NextResponse.json({ok:true,workout:completed});
}
