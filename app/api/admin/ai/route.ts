import {handOffNightConversations} from "../../../../lib/ai-shift";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {canCoachAccess,coachAthleteFilter} from "../../../../lib/coach-access";
import {aiPolicySchema,defaultAiPolicy} from "../../../../lib/ai-policy";
import {queueNotification} from "../../../../lib/notifications";
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("review"),messageId:z.string(),replacement:z.string().trim().min(1).max(4000).optional()}),
 z.object({action:z.literal("claim"),handoffId:z.string()}),
 z.object({action:z.literal("resolve"),handoffId:z.string(),reply:z.string().trim().min(1).max(4000)}),
 z.object({action:z.literal("settings"),settings:aiPolicySchema})
]);
export async function GET(){
 const coach=await requireRole(["COACH","ADMIN"]),filter=await coachAthleteFilter(coach);
 await handOffNightConversations();
 const [items,handoffs,setting]=await Promise.all([prisma.aiMessage.findMany({where:{...filter,role:"assistant"},include:{user:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:"desc"},take:100}),prisma.aiHandoff.findMany({where:{...filter},include:{user:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:"desc"},take:100}),prisma.systemSetting.findUnique({where:{key:"ai_policy"}})]);
 return NextResponse.json({ok:true,items,handoffs,settings:aiPolicySchema.safeParse(setting?.value??{}).data??defaultAiPolicy,canConfigure:coach.role==="ADMIN"});
}
export async function POST(request:Request){
 const coach=await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const raw=await request.json().catch(()=>null);const p=schema.safeParse(raw?.action?raw:{...raw,action:"review"});if(!p.success)return errorJson("Ungültige Prüfung.",422);
 if(p.data.action==="settings"){
  if(coach.role!=="ADMIN")return errorJson("Keine Berechtigung.",403);
  await prisma.systemSetting.upsert({where:{key:"ai_policy"},update:{value:p.data.settings},create:{key:"ai_policy",value:p.data.settings}});return NextResponse.json({ok:true});
 }
 if(p.data.action==="review"){
  const data=p.data,item=await prisma.aiMessage.findUnique({where:{id:data.messageId}});
  if(!item||item.role!=="assistant")return errorJson("Antwort nicht gefunden.",404);
  if(!await canCoachAccess(coach,item.userId))return errorJson("Keine Berechtigung.",403);
  const notified=await prisma.$transaction(async tx=>{
   const updated=await tx.aiMessage.updateMany({where:{id:item.id,coachReviewedAt:null},data:{coachReviewedAt:new Date(),coachId:coach.id}});if(!updated.count)return false;
   if(data.replacement)await tx.message.create({data:{athleteId:item.userId,coachId:coach.id,senderId:coach.id,kind:"TEXT",text:data.replacement}});
   return Boolean(data.replacement);
  });
  if(notified)await queueNotification({userId:item.userId,category:"coach_message",title:"Dein Trainer hat geantwortet",body:data.replacement!.slice(0,160),urgent:true});
  return NextResponse.json({ok:true});
 }
 const data=p.data,item=await prisma.aiHandoff.findUnique({where:{id:data.handoffId}});if(!item)return errorJson("Übergabe nicht gefunden.",404);
 if(!await canCoachAccess(coach,item.userId))return errorJson("Keine Berechtigung.",403);
 if(item.status==="RESOLVED")return errorJson("Übergabe bereits abgeschlossen.",409);
 const updated=await prisma.$transaction(async tx=>{
  const claimed=await tx.aiHandoff.updateMany({where:{id:item.id,status:{in:["OPEN","CLAIMED"]},...(coach.role!=="ADMIN"?{OR:[{coachId:null},{coachId:coach.id}]}:{})},data:data.action==="claim"?{status:"CLAIMED",coachId:coach.id}:{status:"RESOLVED",coachId:coach.id,resolution:data.reply,resolvedAt:new Date()}});
  if(!claimed.count)return false;
  if(data.action==="resolve")await tx.message.create({data:{athleteId:item.userId,coachId:coach.id,senderId:coach.id,kind:"TEXT",text:data.reply}});
  return true;
 });
 if(!updated)return errorJson("Übergabe wurde bereits übernommen.",409);
 if(data.action==="resolve")await queueNotification({userId:item.userId,category:"coach_message",title:"Dein Trainer hat geantwortet",body:data.reply.slice(0,160),urgent:true});
 return NextResponse.json({ok:true});
}
