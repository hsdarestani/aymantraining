import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser} from "../../../../lib/http";

export async function GET(){
  const user=await requireApiUser();
  if(!user)return errorJson("Nicht angemeldet.",401);
  const workouts=await prisma.workout.findMany({
    where:{userId:user.id,completedAt:null},
    include:{exercises:{include:{exercise:true}}},
    orderBy:{scheduledAt:"asc"},
    take:12
  });
  const urls=new Set<string>();
  for(const workout of workouts){
    for(const item of workout.exercises){
      const ex=item.exercise;
      for(const value of [ex.imageStart,ex.imageMiddle,ex.imageEnd,ex.videoUrl]){
        if(value)urls.add(value);
      }
    }
  }
  return NextResponse.json({ok:true,urls:[...urls]});
}
