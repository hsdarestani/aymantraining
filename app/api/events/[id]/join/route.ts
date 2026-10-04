import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../../../lib/http";
const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const {id}=await params;const event=await prisma.event.findUnique({where:{id},include:{registrations:true}});
 if(!event||!event.active)return errorJson("Event nicht gefunden.",404);
 if((rank[user.subscriptionTier]??0)<(rank[event.minTier]??0))return errorJson("Deine Mitgliedschaft reicht für dieses Event nicht aus.",403);
 if(event.capacity&&event.registrations.filter(x=>x.status==="REGISTERED").length>=event.capacity)return errorJson("Dieses Event ist ausgebucht.",409);
 const item=await prisma.eventRegistration.upsert({where:{eventId_userId:{eventId:id,userId:user.id}},update:{status:"REGISTERED"},create:{eventId:id,userId:user.id,status:"REGISTERED"}});
 return NextResponse.json({ok:true,item,meetingUrl:event.type==="VIDEO_CALL"?event.meetingUrl:null});
}
