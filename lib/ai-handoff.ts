import {prisma} from "./db";
import {queueNotification} from "./notifications";
export async function openAiHandoff(userId:string,reason:string,summary:string){
 const result=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
  const open=await tx.aiHandoff.findFirst({where:{userId,status:{in:["OPEN","CLAIMED"]}},orderBy:{createdAt:"desc"}});
  if(open)return {item:open,created:false};
  const assignment=await tx.coachAssignment.findFirst({where:{athleteId:userId,active:true},orderBy:{createdAt:"desc"}});
  const admin=assignment?null:await tx.user.findFirst({where:{role:"ADMIN"},orderBy:{createdAt:"asc"},select:{id:true}});
  const coachId=assignment?.coachId??admin?.id??null;
  const item=await tx.aiHandoff.create({data:{userId,coachId,reason,summary:summary.slice(0,2000)}});
  return {item,created:true};
 });
 if(result.created&&result.item.coachId)await queueNotification({userId:result.item.coachId,category:"coach_message",title:"AI Übergabe an dich",body:summary.slice(0,160),data:{handoffId:result.item.id},urgent:true});
 return result.item;
}
