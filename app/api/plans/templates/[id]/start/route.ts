import {NextResponse} from "next/server";
import {prisma} from "../../../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser,dateOnly} from "../../../../../../lib/http";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  const {id}=await params;
  const plan=await prisma.trainingPlan.findFirst({where:{id,active:true,isTemplate:true,...(user.subscriptionTier==="FREE"?{proOnly:false}:{})},include:{items:{orderBy:[{dayIndex:"asc"},{orderIndex:"asc"}]}}});
  if(!plan)return errorJson("Plan nicht verfügbar.",404);
  const start=dateOnly();
  await prisma.$transaction(async tx=>{
    await tx.planAssignment.updateMany({where:{userId:user.id,active:true},data:{active:false,endsAt:new Date()}});
    await tx.workout.deleteMany({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date()}}});
    await tx.planAssignment.create({data:{userId:user.id,planId:plan.id,startsAt:start}});
    for(let d=0;d<28;d++){
      const dayItems=plan.items.filter(i=>i.dayIndex===d%7);if(!dayItems.length)continue;
      const scheduledAt=new Date(start);scheduledAt.setUTCDate(start.getUTCDate()+d);scheduledAt.setUTCHours(18,0,0,0);
      await tx.workout.create({data:{userId:user.id,trainingPlanId:plan.id,title:`${plan.name} · Woche ${Math.floor(d/7)+1}`,scheduledAt,exercises:{create:dayItems.map((i,index)=>({exerciseId:i.exerciseId,orderIndex:index,targetSets:i.targetSets,targetReps:i.targetReps,targetRpe:i.targetRpe,restSeconds:i.restSeconds,notes:i.notes}))}}});
    }
  });
  return NextResponse.json({ok:true,planId:plan.id});
}