import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../../lib/http";
const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const {id}=await params;
 const result=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${id} FOR UPDATE`;
  const event=await tx.event.findUnique({where:{id},include:{registrations:true}});
  if(!event||!event.active)return {error:"Event nicht gefunden.",status:404};
  if((rank[user.subscriptionTier]??0)<(rank[event.minTier]??0))return {error:"Deine Mitgliedschaft reicht für dieses Event nicht aus.",status:403};
  const existing=event.registrations.find(x=>x.userId===user.id&&x.status==="REGISTERED");
  if(!existing&&event.capacity&&event.registrations.filter(x=>x.status==="REGISTERED").length>=event.capacity)return {error:"Dieses Event ist ausgebucht.",status:409};
  const item=existing??await tx.eventRegistration.upsert({where:{eventId_userId:{eventId:id,userId:user.id}},update:{status:"REGISTERED"},create:{eventId:id,userId:user.id,status:"REGISTERED"}});
  return {item,meetingUrl:event.type==="VIDEO_CALL"?event.meetingUrl:null};
 });
 if('error' in result)return errorJson(result.error!,result.status);
 return NextResponse.json({ok:true,...result});
}
