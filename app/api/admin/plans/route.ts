import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";

const schema=z.object({
  name:z.string().min(2).max(120),
  description:z.string().max(1000).optional(),
  proOnly:z.boolean().default(false),
  cloneFromId:z.string().optional()
});

export async function GET(){
  await requireRole(["COACH","ADMIN"]);
  const items=await prisma.trainingPlan.findMany({include:{items:true,assignments:{where:{active:true}}},orderBy:{updatedAt:"desc"}});
  return NextResponse.json({ok:true,items});
}

export async function POST(request:Request){
  await requireRole(["COACH","ADMIN"]);
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));
  if(!p.success)return errorJson("Ungültiger Plan.",422);
  if(p.data.cloneFromId){
    const source=await prisma.trainingPlan.findUnique({where:{id:p.data.cloneFromId},include:{items:true}});
    if(!source)return errorJson("Vorlage nicht gefunden.",404);
    const item=await prisma.trainingPlan.create({data:{
      name:p.data.name,
      description:p.data.description??source.description,
      proOnly:p.data.proOnly,
      isTemplate:true,
      active:true,
      items:{create:source.items.map(x=>({
        exerciseId:x.exerciseId,dayIndex:x.dayIndex,orderIndex:x.orderIndex,targetSets:x.targetSets,
        targetReps:x.targetReps,targetRpe:x.targetRpe,restSeconds:x.restSeconds,notes:x.notes,
        progressionRule:x.progressionRule??undefined
      }))}
    }});
    return NextResponse.json({ok:true,item});
  }
  const item=await prisma.trainingPlan.create({data:{name:p.data.name,description:p.data.description,proOnly:p.data.proOnly,isTemplate:true,active:true}});
  return NextResponse.json({ok:true,item});
}
