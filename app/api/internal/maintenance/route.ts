import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {purgeExpiredSessions} from "../../../../lib/auth";
import {recomputeScoreForUser} from "../../../../lib/scoring";
import {evaluateRecommendations} from "../../../../lib/recommendations";
import {queueNotification} from "../../../../lib/notifications";
import {dispatchPendingPushes} from "../../../../lib/push";

export async function POST(request:Request){
  if(!process.env.CRON_SECRET||request.headers.get("x-cron-secret")!==process.env.CRON_SECRET)return NextResponse.json({ok:false},{status:401});
  const now=new Date();
  await purgeExpiredSessions();
  await prisma.authThrottle.deleteMany({where:{updatedAt:{lt:new Date(Date.now()-86400000)}}});
  await prisma.passwordResetToken.deleteMany({where:{expiresAt:{lt:new Date(Date.now()-86400000)}}});

  const expired=await prisma.subscription.findMany({where:{provider:"internal_trial",status:"active",trialEndsAt:{lte:now}}});
  for(const s of expired){
    await prisma.$transaction([
      prisma.subscription.update({where:{id:s.id},data:{status:"expired"}}),
      prisma.user.update({where:{id:s.userId},data:{subscriptionTier:"FREE"}})
    ]).catch(()=>undefined);
  }

  const users=await prisma.user.findMany({where:{role:"ATHLETE"},select:{id:true,name:true}});
  let processed=0;
  for(const user of users){
    await recomputeScoreForUser(user.id).catch(()=>undefined);
    await evaluateRecommendations(user.id).catch(()=>undefined);
    const start=new Date(now);start.setUTCHours(0,0,0,0);
    const hasMorning=await prisma.notification.findFirst({where:{userId:user.id,category:"morning_brief",createdAt:{gte:start}}});
    if(!hasMorning){
      const score=await prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}});
      const next=await prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:now}},orderBy:{scheduledAt:"asc"}});
      await queueNotification({userId:user.id,category:"morning_brief",title:`Guten Morgen${user.name?", "+user.name:""}`,body:`Score ${score?.total??"—"} %. ${next?"Heute: "+next.title:"Recovery zählt heute auch."}`});
    }
    processed++;
  }
  const push=await dispatchPendingPushes();
  return NextResponse.json({ok:true,processed,expiredTrials:expired.length,push,at:now.toISOString()});
}
