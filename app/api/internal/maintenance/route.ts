import {handOffNightConversations} from "../../../../lib/ai-shift";
import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {purgeExpiredSessions} from "../../../../lib/auth";
import {recomputeScoreForUser} from "../../../../lib/scoring";
import {evaluateRecommendations} from "../../../../lib/recommendations";
import {queueNotification} from "../../../../lib/notifications";
import {dispatchPendingPushes} from "../../../../lib/push";
import {zonedParts} from "../../../../lib/timezone";
import {hasFeature} from "../../../../lib/entitlements";
import {gamificationSnapshot} from "../../../../lib/gamification";
import {syncStorePurchase} from "../../../../lib/store-billing";
import {encryptPrivateObjectIfNeeded} from "../../../../lib/storage";

async function alreadyQueued(userId:string,category:string,since:Date){
  return Boolean(await prisma.notification.findFirst({where:{userId,category,createdAt:{gte:since}},select:{id:true}}));
}
function sameLocalDate(a:Date,b:Date,timeZone:string){
  return zonedParts(a,timeZone).dateKey===zonedParts(b,timeZone).dateKey;
}

export async function POST(request:Request){
  if(!process.env.CRON_SECRET||request.headers.get("x-cron-secret")!==process.env.CRON_SECRET)return NextResponse.json({ok:false},{status:401});
  const now=new Date();

  let encryptedLegacyMedia=0;
  const migrationKey="private_media_encryption_v1";
  const migration=await prisma.systemSetting.findUnique({where:{key:migrationKey}});
  if(!migration){
    const privateMedia=await prisma.mediaAsset.findMany({
      where:{kind:{in:["PROGRESS_PHOTO","TECHNIQUE_VIDEO","TEST_VIDEO","VOICE_MESSAGE"]}},
      select:{storageKey:true}
    });
    let migrationFailed=false;
    for(const media of privateMedia){
      try{
        if(await encryptPrivateObjectIfNeeded(media.storageKey))encryptedLegacyMedia++;
      }catch{
        migrationFailed=true;
      }
    }
    if(!migrationFailed){
      await prisma.systemSetting.upsert({
        where:{key:migrationKey},
        update:{value:{completedAt:now.toISOString(),encrypted:encryptedLegacyMedia}},
        create:{key:migrationKey,value:{completedAt:now.toISOString(),encrypted:encryptedLegacyMedia}}
      });
    }
  }

  await purgeExpiredSessions();
  await prisma.authThrottle.deleteMany({where:{updatedAt:{lt:new Date(Date.now()-86400000)}}});
  await prisma.passwordResetToken.deleteMany({where:{expiresAt:{lt:new Date(Date.now()-86400000)}}});

  const expired=await prisma.subscription.findMany({where:{provider:{in:["internal_trial","referral_reward"]},status:"active",renewsAt:{lte:now}}});
  for(const s of expired){
    await prisma.subscription.update({where:{id:s.id},data:{status:"expired"}}).catch(()=>undefined);
    const other=await prisma.subscription.findFirst({where:{userId:s.userId,status:"active",OR:[{renewsAt:null},{renewsAt:{gt:now}}]}});
    if(!other)await prisma.user.update({where:{id:s.userId},data:{subscriptionTier:"FREE"}}).catch(()=>undefined);
  }

  const storeRows=await prisma.subscription.findMany({
    where:{
      provider:{in:["app_store","google_play"]},
      status:{in:["active","canceled","billing_retry"]},
      updatedAt:{lt:new Date(now.getTime()-45*60000)}
    },
    orderBy:{updatedAt:"asc"},
    take:100
  });
  const storeSyncResults=await Promise.allSettled(
    storeRows.filter(row=>Boolean(row.externalId)).map(row=>syncStorePurchase(row.provider as "app_store"|"google_play",row.externalId!))
  );
  const storeSync={
    checked:storeSyncResults.length,
    ok:storeSyncResults.filter(x=>x.status==="fulfilled").length,
    failed:storeSyncResults.filter(x=>x.status==="rejected").length
  };

  const users=await prisma.user.findMany({where:{role:"ATHLETE",onboardingCompleted:true},select:{id:true,name:true,timezone:true,subscriptionTier:true}});
  let processed=0,queued=0;

  for(const user of users){
    const tz=user.timezone||"Europe/Berlin";
    const local=zonedParts(now,tz);
    const last24h=new Date(now.getTime()-86400000);
    const last2h=new Date(now.getTime()-2*3600000);

    const [score,recommendations,gamification,nextWorkout,todayCheck,todayNutrition,recentBadge,athleteContext]=await Promise.all([
      recomputeScoreForUser(user.id).catch(()=>null),
      evaluateRecommendations(user.id).catch(()=>[]),
      gamificationSnapshot(user.id).catch(()=>null),
      prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(now.getTime()-15*60000)}},orderBy:{scheduledAt:"asc"}}),
      prisma.dailyCheck.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
      prisma.nutritionDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
      prisma.badge.findFirst({where:{userId:user.id,unlockedAt:{gte:last2h}},orderBy:{unlockedAt:"desc"}}),
      prisma.athleteContext.findUnique({where:{userId:user.id}})
    ]);

    const morningHour=Math.max(4,Math.min(12,athleteContext?.preferredMorningHour??8));
    if(local.hour===morningHour&&!await alreadyQueued(user.id,"morning_brief",last24h)){
      const recovery=score?.recovery;
      const body=recovery!=null?`Regeneration ${recovery} Prozent. `:"";
      const plan=nextWorkout&&sameLocalDate(nextWorkout.scheduledAt??now,now,tz)?`Heute: ${nextWorkout.title}.`:"Heute: Regeneration und Beständigkeit.";
      if(await queueNotification({userId:user.id,category:"morning_brief",title:`Guten Morgen${user.name?", "+user.name:""}`,body:`${body}${plan}`,data:{route:"/dashboard"}}))queued++;
    }

    if(nextWorkout?.scheduledAt){
      const minutes=(nextWorkout.scheduledAt.getTime()-now.getTime())/60000;
      if(minutes>=45&&minutes<=75&&!await alreadyQueued(user.id,"training_reminder",last2h)){
        if(await queueNotification({userId:user.id,category:"training_reminder",title:"Dein Workout startet bald",body:`In etwa 1 Stunde: ${nextWorkout.title}. Deine Konkurrenz trainiert schon.`,data:{route:`/training/${nextWorkout.id}`,workoutId:nextWorkout.id}}))queued++;
      }
    }

    const warningAllowed=await hasFeature(user.subscriptionTier,"recovery_warnings");
    const critical=recommendations.find((r:any)=>["critical","warning"].includes(String(r.severity)));
    if(warningAllowed&&critical&&!await alreadyQueued(user.id,"recovery_warning",last2h)){
      if(await queueNotification({userId:user.id,category:"recovery_warning",title:critical.title,body:critical.action,data:{route:"/dashboard"}}))queued++;
    }

    if(local.hour===15&&!await alreadyQueued(user.id,"nutrition",last24h)){
      const checkSame=todayCheck&&sameLocalDate(todayCheck.date,now,tz);
      const nutritionSame=todayNutrition&&sameLocalDate(todayNutrition.date,now,tz);
      const water=nutritionSame?todayNutrition?.waterMl:checkSame?todayCheck?.waterMl:null;
      const waterTarget=athleteContext?.waterTargetMl??2500;
      if(water!=null&&water<waterTarget*.72){
        const missing=Math.max(0,waterTarget-water);
        if(await queueNotification({userId:user.id,category:"nutrition",title:"Wasser Ziel",body:`Du liegst ungefähr ${(missing/1000).toFixed(1).replace(".",",")} l unter deinem Tagesziel.`,data:{route:"/fuel"}}))queued++;
      }
    }

    const bedtimeHour=Number(String(athleteContext?.bedtimeTarget||"22:30").split(":")[0]||22);
    const reminderHour=(bedtimeHour+23)%24;
    if(local.hour===reminderHour&&!await alreadyQueued(user.id,"sleep",last24h)){
      const tomorrowStart=new Date(now.getTime()+3*3600000);
      const tomorrowEnd=new Date(now.getTime()+36*3600000);
      const tomorrowWorkout=await prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:tomorrowStart,lte:tomorrowEnd}},orderBy:{scheduledAt:"asc"}});
      if(tomorrowWorkout){
        if(await queueNotification({userId:user.id,category:"sleep",title:"Zeit für Regeneration",body:`Morgen steht ${tomorrowWorkout.title} an. Heute bewusst früher runterfahren.`,data:{route:"/lifestyle"}}))queued++;
      }
    }

    if(local.weekday==="Sun"&&local.hour===19&&!await alreadyQueued(user.id,"weekly_report",last24h)){
      const weekAgo=new Date(now.getTime()-7*86400000);
      const old=await prisma.scoreSnapshot.findFirst({where:{userId:user.id,date:{lte:weekAgo}},orderBy:{date:"desc"}});
      const delta=(score?.total??0)-(old?.total??score?.total??0);
      if(await queueNotification({userId:user.id,category:"weekly_report",title:"Deine BE DIFFERENT Woche",body:`Score ${delta>=0?"+":""}${delta} %. Öffne deinen Wochenreport.`,data:{route:"/report"}}))queued++;
    }

    if(recentBadge&&!await alreadyQueued(user.id,"achievement",last2h)){
      if(await queueNotification({userId:user.id,category:"achievement",title:"Neuer Erfolg",body:`Neues Abzeichen: ${recentBadge.name}.`,data:{route:"/community"}}))queued++;
    }

    processed++;
  }

  const aiHandoffs=await handOffNightConversations(now);
  const push=await dispatchPendingPushes();
  return NextResponse.json({ok:true,processed,queued,aiHandoffs,encryptedLegacyMedia,expiredSubscriptions:expired.length,storeSync,push,at:now.toISOString()});
}
