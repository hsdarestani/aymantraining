import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
import {levelForScore} from "../../../lib/scoring";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const [score,workout]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*3600000)}},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}}},orderBy:{scheduledAt:"asc"}})
 ]);
 return NextResponse.json({
  ok:true,
  score:score?{total:score.total,level:levelForScore(score.total),recovery:score.recovery,completeness:score.completeness}:null,
  workout:workout?{id:workout.id,title:workout.title,scheduledAt:workout.scheduledAt,exercises:workout.exercises.map(x=>({name:x.exercise.nameDe,sets:x.targetSets,reps:x.targetReps}))}:null,
  updatedAt:new Date().toISOString()
 });
}
