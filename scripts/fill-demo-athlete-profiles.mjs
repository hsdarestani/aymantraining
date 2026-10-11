import { PrismaClient } from "@prisma/client";

/**
 * Safe, repeatable presentation fixtures for three synthetic athletes only.
 * Never modify real users, user consents, uploaded media, or existing measurements.
 */
const db = new PrismaClient();
const today = new Date();
const utcDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const date = (days) => new Date(utcDay.getTime() + days * 86400000);
const dateAt = (days, hours = 17) => new Date(utcDay.getTime() + days * 86400000 + hours * 3600000);
const weekStart = (() => {
  const d = date(0);
  const dow = (d.getUTCDay() + 6) % 7;
  return date(-dow);
})();
const fixture = [
  {index:1,email:"demo.athlete.1@example.invalid",date:"1994-04-12",height:180,weight:81.6,waist:86,bodyFat:17.8,days:3,experience:"Fortgeschritten · DEMO",goal:"Muskelaufbau · DEMO",sex:"male",steps:8450,rest:60},
  {index:2,email:"demo.athlete.2@example.invalid",date:"1997-08-23",height:172,weight:67.5,waist:75,bodyFat:20.1,days:4,experience:"Einsteiger · DEMO",goal:"Beweglichkeit · DEMO",sex:"female",steps:9800,rest:58},
  {index:3,email:"demo.athlete.3@example.invalid",date:"1991-01-19",height:185,weight:86.2,waist:91,bodyFat:19.3,days:3,experience:"Fortgeschritten · DEMO",goal:"Ausdauer · DEMO",sex:"male",steps:11100,rest:56}
];

const info = {};
async function main() {
  const admin = await db.user.findUnique({where:{email:"admin@bedifferent.smarbiz.sbs"}});
  if (!admin || admin.name !== "Ayman" || admin.role !== "ADMIN") throw new Error("Ayman demo administrator missing; refusing changes");
  const records = await Promise.all(fixture.map(x => db.user.findUnique({where:{email:x.email}})));
  // Verify every fixture belongs to a previously generated synthetic account before *any* write.
  for (let i=0;i<fixture.length;i++){
    if(!records[i] || records[i].role !== "ATHLETE" ||
       !records[i].name?.startsWith("DEMO · Athlet ") ||
       !records[i].email.endsWith("@example.invalid")) throw new Error("Non-demo user guard failed: "+fixture[i].index);
  }
  const photoCountsBefore = await Promise.all(records.map(u=>db.mediaAsset.count({where:{relatedUserId:u.id}})));
  for (let k=0;k<fixture.length;k++){
    const d=fixture[k],u=records[k],userId=u.id;
    // Fill only missing user profile fields. Real values take precedence.
    const update = {};
    if (!u.birthDate) update.birthDate = new Date(d.date+"T12:00:00.000Z");
    if (u.heightCm == null) update.heightCm = d.height;
    if (u.availabilityPerWeek == null) update.availabilityPerWeek = d.days;
    if (!u.trainingExperience) update.trainingExperience = d.experience;
    if (!u.sex) update.sex = d.sex;
    if (Object.keys(update).length) await db.user.update({where:{id:userId},data:update});

    if (await db.goal.count({where:{userId,active:true}})===0)
      await db.goal.create({data:{userId,type:d.goal,active:true}});

    await db.athleteContext.upsert({
      where:{userId},update:{},
      create:{userId,targetScore:86+d.index,targetDate:date(84),bedtimeTarget:"22:45",
        stepTarget:10000,waterTargetMl:2500,proteinTargetG:120+d.index*10}
    });

    // Demonstration body trends; rows have dedicated stable IDs.
    for (let j=0;j<3;j++){
      const id="bd-demo-profile-body-"+d.index+"-"+j;
      await db.bodyMetric.upsert({where:{id},update:{},create:{
        id,userId,date:date(-28+j*14),
        weightKg:Math.round((d.weight+(2-j)*0.4)*10)/10,
        waistCm:d.waist+(2-j)*0.4,chestCm:93+(d.index*3)+j*0.4,
        bodyFat:Math.round((d.bodyFat+(2-j)*0.25)*10)/10
      }});
    }
    // Show latest weight on the detail page, never overwrite an actual latest value.
    if(!await db.bodyMetric.findFirst({where:{userId,date:date(0)}})){
      await db.bodyMetric.create({data:{
        id:"bd-demo-profile-today-"+d.index,userId,date:date(0),
        weightKg:d.weight,waistCm:d.waist,chestCm:94+(d.index*3),bodyFat:d.bodyFat
      }});
    }

    for (let n=-6;n<=0;n++){
      const target=date(n);
      const nutrition=await db.nutritionDaily.findUnique({where:{userId_date:{userId,date:target}}});
      if(!nutrition)await db.nutritionDaily.create({data:{
        userId,date:target,source:"demo_preview",calories:2150+d.index*100+n*8,
        proteinG:124+d.index*8,carbsG:245+d.index*3+n*2,
        fatG:69+d.index,waterMl:2350+((n+6)%3)*150,fruitVegServings:4,
        fuelScore:70+d.index*3
      }});
      const wearable=await db.wearableDaily.findUnique({where:{userId_date_source:{
        userId,date:target,source:"demo_preview"}}});
      if(!wearable)await db.wearableDaily.create({data:{
        userId,date:target,source:"demo_preview",steps:d.steps+(n+6)*135,
        activeCalories:385+d.index*42,restingHr:d.rest,hrv:42+d.index*3,
        sleepMinutes:415+(n+6)*5,vo2max:40+d.index*2,weightKg:d.weight,
        completeness:90,
        sleepStages:{demo:true,deepPercent:23,lightPercent:56,remPercent:21}
      }});
      const check=await db.dailyCheck.findUnique({where:{userId_date:{userId,date:target}}});
      if(!check)await db.dailyCheck.create({data:{
        userId,date:target,energy:7+(d.index%2),soreness:2+d.index%2,mood:8,
        stress:3,sleepHours:7.3,restingHr:d.rest,
        steps:d.steps+(n+6)*135,waterMl:2400,proteinG:124+d.index*8
      }});
    }
    for (let j=0;j<2;j++){
      const start=new Date(weekStart.getTime()-j*7*86400000);
      const prev=await db.weeklyCheckIn.findUnique({where:{userId_weekStart:{userId,weekStart:start}}});
      if(!prev)await db.weeklyCheckIn.create({data:{
        userId,weekStart:start,weightKg:d.weight+j*0.3,energy:7+d.index%2,recovery:7,
        training:d.days,
        note:"DEMO · Beispielhafter Wochenbericht, keine echte Selbstauskunft.",
        questions:"DEMO · Belastung gut vertragen; nächste Woche Fortschritt beobachten."
      }});
    }
    // Use seeded reference exercises for visible, clearly labeled example workouts.
    const exercise=await db.exercise.findFirst({where:{active:true},orderBy:{id:"asc"}});
    if (exercise) {
      for(let n=0;n<2;n++){
        const id="bd-demo-profile-workout-"+d.index+"-"+n;
        const found=await db.workout.findUnique({where:{id}});
        if(!found)await db.workout.create({data:{
          id,userId,title:"DEMO · "+(n===0?"Krafttraining":"Ausdauer & Mobilität"),
          scheduledAt:dateAt(-5-n*4),startedAt:dateAt(-5-n*4),
          completedAt:dateAt(-5-n*4,18),rpe:6+n,
          notes:"DEMO · Beispieltraining, nicht von einer realen Person protokolliert.",
          exercises:{create:[{exerciseId:exercise.id,orderIndex:0,targetSets:3,targetReps:"10",targetRpe:7,restSeconds:90}]},
          sets:{create:[{exerciseId:exercise.id,setNumber:1,reps:10,weightKg:10,rpe:7,completedAt:dateAt(-5-n*4)}]}
        }});
      }
    }
    const testId="bd-demo-profile-test-"+d.index;
    if(!await db.performanceTest.findUnique({where:{id:testId}}))
      await db.performanceTest.create({data:{
        id:testId,userId,name:"DEMO · Basis Fitness Check",
        completedAt:dateAt(-4),notes:"DEMO · Beispieltest ohne reale Messung.",
        results:{create:[{metric:"Mobilität",value:60+d.index*7,unit:"Punkte"},
          {metric:"Ausdauer",value:55+d.index*8,unit:"Punkte"}]}
      }});
    info[d.index]={
      name:d.email,
      goals:await db.goal.count({where:{userId,active:true}}),
      metrics:await db.bodyMetric.count({where:{userId}}),
      weeklies:await db.weeklyCheckIn.count({where:{userId}}),
      workouts:await db.workout.count({where:{userId}}),
      nutrition:await db.nutritionDaily.count({where:{userId}})
    };
  }
  const after=await Promise.all(records.map(u=>db.mediaAsset.count({where:{relatedUserId:u.id}})));
  if(after.some((n,i)=>n!==photoCountsBefore[i]))throw Error("Media count changed unexpectedly");
  console.log("DEMO_PROFILES_FILLED_SUCCESSFULLY");
  console.log("PROFILE_CHECKS="+JSON.stringify(info));
  console.log("PHOTO_COUNTS_UNCHANGED=YES");
  console.log("REAL_ATHLETES_AND_ADMIN_UNCHANGED=YES");
}
main().catch(e=>{console.error("DEMO_PROFILE_FILL_FAILED",e.message);process.exitCode=1}).finally(()=>db.$disconnect());
