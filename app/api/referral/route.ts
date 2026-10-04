import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {queueNotification} from "../../../lib/notifications";

export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 let item=await prisma.referral.findFirst({where:{referrerUserId:user.id,referredUserId:null,status:"OPEN"}});
 if(!item){const code=crypto.randomBytes(5).toString("hex").toUpperCase();item=await prisma.referral.create({data:{referrerUserId:user.id,code}})}
 const successful=await prisma.referral.count({where:{referrerUserId:user.id,status:"REWARDED"}});
 return NextResponse.json({ok:true,code:item.code,successful});
}

const schema=z.object({code:z.string().min(4).max(30).transform(v=>v.trim().toUpperCase())});
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültiger Code.",422);
 const ref=await prisma.referral.findUnique({where:{code:p.data.code}});
 if(!ref||ref.referrerUserId===user.id||ref.referredUserId)return errorJson("Einladungscode nicht verfügbar.",409);
 const now=new Date(),month=30*86400000;
 await prisma.$transaction(async tx=>{
  const active=await tx.subscription.findFirst({where:{userId:ref.referrerUserId,status:"active",renewsAt:{gt:now}},orderBy:{renewsAt:"desc"}});
  const base=active?.renewsAt&&active.renewsAt>now?active.renewsAt:now;
  const renewsAt=new Date(base.getTime()+month);
  await tx.subscription.create({data:{userId:ref.referrerUserId,tier:"PRO",provider:"referral_reward",externalId:`referral:${ref.id}`,status:"active",renewsAt}});
  await tx.user.update({where:{id:ref.referrerUserId},data:{subscriptionTier:"PRO"}});
  await tx.referral.update({where:{id:ref.id},data:{referredUserId:user.id,status:"REWARDED",rewardGrantedAt:now}});
 });
 await queueNotification({userId:ref.referrerUserId,category:"achievement",title:"Ein Monat PRO geschenkt",body:"Deine Einladung wurde eingelöst. Dein PRO Zugang wurde um 30 Tage verlängert.",urgent:true});
 return NextResponse.json({ok:true});
}
