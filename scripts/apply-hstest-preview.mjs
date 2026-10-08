import {PrismaClient} from "@prisma/client";

const prisma=new PrismaClient();
const dayMs=86400000;
const reference=new Date("2026-10-08T00:00:00.000Z");
// Intermediate resting-HR points are reconstructed approximately from the client-provided 7-day chart for preview purposes.
const restingHrSeries=[76,64,60,55,61,64,62];

function day(offset){
  return new Date(reference.getTime()+offset*dayMs);
}

async function main(){
  const explicit=(process.env.HSTEST_EMAIL||"").trim().toLowerCase();
  const candidates=explicit
    ? await prisma.user.findMany({where:{email:explicit,role:"ATHLETE"},take:2})
    : await prisma.user.findMany({where:{name:{equals:"HSTEST",mode:"insensitive"},role:"ATHLETE"},take:3});

  if(candidates.length!==1){
    console.log(`HSTEST preview skipped: expected exactly one athlete, found ${candidates.length}`);
    return;
  }

  const user=candidates[0];
  await prisma.user.update({
    where:{id:user.id},
    data:{subscriptionTier:"PRO",onboardingCompleted:true,timezone:"Europe/Berlin"}
  });

  await prisma.athleteContext.upsert({
    where:{userId:user.id},
    update:{bedtimeTarget:"22:30",stepTarget:10000,waterTargetMl:2500,proteinTargetG:130,targetScore:100},
    create:{userId:user.id,bedtimeTarget:"22:30",stepTarget:10000,waterTargetMl:2500,proteinTargetG:130,targetScore:100}
  });

  await prisma.wearableConnection.upsert({
    where:{userId_provider:{userId:user.id,provider:"xiaomi_mi_fitness"}},
    update:{status:"CONNECTED",lastSyncAt:new Date(),metadata:{brand:"Xiaomi",source:"client_screenshots",preview:true}},
    create:{userId:user.id,provider:"xiaomi_mi_fitness",status:"CONNECTED",lastSyncAt:new Date(),metadata:{brand:"Xiaomi",source:"client_screenshots",preview:true}}
  });

  for(let i=0;i<7;i++){
    const date=day(i-6);
    const isLatest=i===6;
    const sleepStages=isLatest?{
      deepPercent:23,
      lightPercent:77,
      awakenings:1,
      averageSleepHr:57,
      currentHeartRate:74,
      sleepTargetMinutes:480,
      providedBy:"client_screenshot",
      capturedAt:"2026-10-08",
      restingHrSeriesApproximate:true
    }:undefined;
    await prisma.wearableDaily.upsert({
      where:{userId_date_source:{userId:user.id,date,source:"manual_import"}},
      update:{
        restingHr:restingHrSeries[i],
        ...(isLatest?{sleepMinutes:246,sleepStages,completeness:50}:{completeness:13})
      },
      create:{
        userId:user.id,
        date,
        source:"manual_import",
        restingHr:restingHrSeries[i],
        ...(isLatest?{sleepMinutes:246,sleepStages,completeness:50}:{completeness:13})
      }
    });
  }

  await prisma.dailyCheck.upsert({
    where:{userId_date:{userId:user.id,date:reference}},
    update:{sleepHours:4.1,restingHr:62},
    create:{userId:user.id,date:reference,sleepHours:4.1,restingHr:62}
  });

  const previewConsent=await prisma.consentRecord.findFirst({where:{userId:user.id,type:"health_data",version:"client-preview-2026-10-08"}});
  if(!previewConsent)await prisma.consentRecord.create({
    data:{userId:user.id,type:"health_data",version:"client-preview-2026-10-08",granted:true}
  });

  console.log(`HSTEST preview applied to ${user.id}: sleep 4h06, target 8h, deep 23%, light 77%, awakenings 1, sleep HR 57, current HR 74, resting HR 62`);
}

main().finally(()=>prisma.$disconnect());
