import {canCoachAccess} from "../../../../lib/coach-access";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {queueNotification} from "../../../../lib/notifications";

const block=z.object({metric:z.string().min(1).max(80),label:z.string().min(1).max(100),unit:z.string().min(1).max(30),instructions:z.string().max(500).optional(),instructionVideoUrl:z.string().max(500).optional()});
const schema=z.object({userId:z.string(),name:z.string().min(2).max(100),scheduledAt:z.string().optional(),notes:z.string().max(1000).optional(),definition:z.array(block).min(1).max(20)});

export async function POST(request:Request){
  const currentCoach=await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiger Test.",422);
if(!await canCoachAccess(currentCoach,p.data.userId))return errorJson("Keine Berechtigung.",403);  const item=await prisma.performanceTest.create({data:{userId:p.data.userId,name:p.data.name,scheduledAt:p.data.scheduledAt?new Date(p.data.scheduledAt):new Date(),notes:p.data.notes,definition:p.data.definition}});
  await queueNotification({userId:p.data.userId,category:"test_due",title:"BE DIFFERENT TEST",body:`Dein Test „${p.data.name}“ ist fällig.`});
  return NextResponse.json({ok:true,item});
}