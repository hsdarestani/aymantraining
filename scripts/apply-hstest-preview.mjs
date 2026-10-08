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


  // Non-client measurements below are clearly marked preview data. They exist only to make the HSTEST
  // athlete account exercise all seven BD SCORE pillars until real performance tests are supplied.
  const previewTests=[
    {id:"hstest-preview-strength",metric:"strength",baseline:50,current:57.2,name:"HSTEST Preview Kraft"},
    {id:"hstest-preview-endurance",metric:"endurance",baseline:50,current:55.6,name:"HSTEST Preview Ausdauer"},
    {id:"hstest-preview-athleticism",metric:"athleticism",baseline:50,current:58.8,name:"HSTEST Preview Athletik"},
    {id:"hstest-preview-mobility",metric:"mobility_score",baseline:50,current:54.4,name:"HSTEST Preview Beweglichkeit"}
  ];
  for(const t of previewTests){
    const baselineId=t.id+"-baseline",currentId=t.id+"-current";
    await prisma.performanceTest.upsert({
      where:{id:baselineId},
      update:{name:t.name+" Baseline",completedAt:day(-60),notes:"client_preview"},
      create:{id:baselineId,userId:user.id,name:t.name+" Baseline",completedAt:day(-60),notes:"client_preview"}
    });
    await prisma.performanceTest.upsert({
      where:{id:currentId},
      update:{name:t.name,completedAt:day(-1),notes:"client_preview"},
      create:{id:currentId,userId:user.id,name:t.name,completedAt:day(-1),notes:"client_preview"}
    });
    await prisma.testResult.upsert({
      where:{id:baselineId+"-result"},
      update:{testId:baselineId,metric:t.metric,value:t.baseline,unit:"preview",createdAt:day(-60)},
      create:{id:baselineId+"-result",testId:baselineId,metric:t.metric,value:t.baseline,unit:"preview",createdAt:day(-60)}
    });
    await prisma.testResult.upsert({
      where:{id:currentId+"-result"},
      update:{testId:currentId,metric:t.metric,value:t.current,unit:"preview",createdAt:day(-1)},
      create:{id:currentId+"-result",testId:currentId,metric:t.metric,value:t.current,unit:"preview",createdAt:day(-1)}
    });
  }

  for(let offset=-6;offset<=0;offset++){
    const date=day(offset);
    await prisma.nutritionDaily.upsert({
      where:{userId_date:{userId:user.id,date}},
      update:{proteinG:90,waterMl:2000,fuelScore:70,source:"client_preview"},
      create:{userId:user.id,date,proteinG:90,waterMl:2000,fuelScore:70,source:"client_preview"}
    });
    if(offset>=-4){
      await prisma.dailyCheck.upsert({
        where:{userId_date:{userId:user.id,date}},
        update:{
          energy:offset===0?6:7,mood:7,stress:4,soreness:3,
          ...(offset===0?{sleepHours:4.1,restingHr:62}:{}),
          waterMl:2000,proteinG:90
        },
        create:{
          userId:user.id,date,energy:offset===0?6:7,mood:7,stress:4,soreness:3,
          ...(offset===0?{sleepHours:4.1,restingHr:62}:{}),
          waterMl:2000,proteinG:90
        }
      });
    }
  }

  const previewWorkouts=[
    {id:"hstest-preview-w1",offset:-5,title:"Kraft Basis 01",done:true},
    {id:"hstest-preview-w2",offset:-4,title:"Athletik Basis 01",done:false},
    {id:"hstest-preview-w3",offset:-3,title:"Ausdauer Basis 01",done:true},
    {id:"hstest-preview-w4",offset:-2,title:"Mobility Basis 01",done:false},
    {id:"hstest-preview-w5",offset:-1,title:"Kraft Basis 02",done:true}
  ];
  for(const w of previewWorkouts){
    const scheduledAt=new Date(day(w.offset).getTime()+18*3600000);
    await prisma.workout.upsert({
      where:{id:w.id},
      update:{userId:user.id,title:w.title,scheduledAt,completedAt:w.done?new Date(scheduledAt.getTime()+3600000):null,notes:"client_preview"},
      create:{id:w.id,userId:user.id,title:w.title,scheduledAt,completedAt:w.done?new Date(scheduledAt.getTime()+3600000):null,notes:"client_preview"}
    });
  }

  const previewConsent=await prisma.consentRecord.findFirst({where:{userId:user.id,type:"health_data",version:"client-preview-2026-10-08"}});
  if(!previewConsent)await prisma.consentRecord.create({
    data:{userId:user.id,type:"health_data",version:"client-preview-2026-10-08",granted:true}
  });

  console.log(`HSTEST preview applied to ${user.id}: real wearable snapshot + seven-pillar client_preview dataset`);
}

main().finally(()=>prisma.$disconnect());
