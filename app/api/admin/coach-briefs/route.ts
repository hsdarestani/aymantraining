import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {queueNotification} from "../../../../lib/notifications";
const schema=z.object({title:z.string().min(2).max(120),body:z.string().max(1000).optional(),mediaId:z.string().optional().nullable(),audienceTier:z.enum(["FREE","PRO","ELITE"]).default("PRO"),publishAt:z.string().datetime().optional(),expiresAt:z.string().datetime().optional().nullable()});
const rank:Record<string,number>={FREE:0,PRO:1,ELITE:2};
export async function GET(){await requireRole(["COACH","ADMIN"]);const items=await prisma.coachBrief.findMany({orderBy:{publishAt:"desc"},take:50});return NextResponse.json({ok:true,items})}
export async function POST(request:Request){
 const coach=await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Morgenübersicht.",422);
 if(p.data.mediaId){const media=await prisma.mediaAsset.findFirst({where:{id:p.data.mediaId,ownerId:coach.id,kind:"VOICE_MESSAGE"}});if(!media)return errorJson("Audiodatei nicht gefunden.",404)}
 const item=await prisma.coachBrief.create({data:{coachId:coach.id,title:p.data.title,body:p.data.body,mediaId:p.data.mediaId||null,audienceTier:p.data.audienceTier,publishAt:p.data.publishAt?new Date(p.data.publishAt):new Date(),expiresAt:p.data.expiresAt?new Date(p.data.expiresAt):null}});
 const users=await prisma.user.findMany({where:{role:"ATHLETE"},select:{id:true,subscriptionTier:true}});
 await Promise.all(users.filter(x=>(rank[x.subscriptionTier]??0)>=(rank[p.data.audienceTier]??0)).map(x=>queueNotification({userId:x.id,category:"morning_brief",title:p.data.title,body:p.data.body||"Neue persönliche Morgenübersicht von deinem Trainer.",data:{route:"/coach-brief"},urgent:false})));
 return NextResponse.json({ok:true,item});
}
