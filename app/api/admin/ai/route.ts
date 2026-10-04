import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {queueNotification} from "../../../../lib/notifications";
const schema=z.object({messageId:z.string(),replacement:z.string().trim().max(4000).optional()});
export async function GET(){await requireRole(["COACH","ADMIN"]);const items=await prisma.aiMessage.findMany({where:{role:"assistant"},include:{user:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:"desc"},take:100});return NextResponse.json({ok:true,items})}
export async function POST(request:Request){
 const coach=await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Prüfung.",422);
 const item=await prisma.aiMessage.findUnique({where:{id:p.data.messageId}});if(!item)return errorJson("Antwort nicht gefunden.",404);
 await prisma.aiMessage.update({where:{id:item.id},data:{coachReviewedAt:new Date(),coachId:coach.id}});
 if(p.data.replacement){
  await prisma.message.create({data:{athleteId:item.userId,coachId:coach.id,senderId:coach.id,kind:"TEXT",text:p.data.replacement}});
  await queueNotification({userId:item.userId,category:"coach_message",title:"Dein Trainer hat ergänzt",body:p.data.replacement.slice(0,160),urgent:true});
 }
 return NextResponse.json({ok:true});
}
