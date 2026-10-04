import {NextResponse} from "next/server";
import {prisma} from "../../../lib/db";
import {errorJson,requireApiUser} from "../../../lib/http";
const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const now=new Date();
 const items=await prisma.event.findMany({where:{active:true,startsAt:{gte:new Date(now.getTime()-6*3600000)}},include:{registrations:{where:{userId:user.id}}},orderBy:{startsAt:"asc"},take:50});
 return NextResponse.json({ok:true,items:items.filter(x=>(rank[user.subscriptionTier]??0)>=(rank[x.minTier]??0)).map(x=>({...x,registered:Boolean(x.registrations.length),meetingUrl:x.type==="VIDEO_CALL"&&x.registrations.length?x.meetingUrl:null,registrations:undefined}))});
}
