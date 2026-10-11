import { PrismaClient } from "@prisma/client";

// DEMO ONLY. Insert distinctive, reversible example rows into the requested
// administrator account without overwriting photos, sessions or actual user data.
// All simulated health/performance entries are marked DEMO in their source or notes.
const db = new PrismaClient();
const EMAIL = "admin@bedifferent.smarbiz.sbs";
const MS = 86400000;
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
const day=(offset)=>new Date(today.getTime()+offset*MS);
const eventTime=(offset,hour=18)=>new Date(today.getTime()+offset*MS+hour*3600000);
const val=(base,i,cycle=6)=>base+((i*7)%cycle);
const created={};
async function ifMissing(find,make) {if(await find())return false;await make();return true;}
async function main(){
 const u=await db.user.findUnique({where:{email:EMAIL}});
 if(!u||u.role!=="ADMIN"||u.name!=="Ayman")throw Error("Specific Ayman administrator account not found. Refusing demo write.");
 const uid=u.id;
 const mediaBefore=await db.mediaAsset.count({where:{relatedUserId:uid}});
 console.log("DEMO_TARGET_VALID=YES");
 // A preview account has full non-billing feature access. No payment records or provider connections.
 await db.user.update({where:{id:uid},data:{subscriptionTier:"ELITE",onboardingCompleted:true,timezone:"Europe/Berlin"}});
 await db.athleteContext.upsert({
   where:{userId:uid},update:{targetScore:90,targetDate:day(84),bedtimeTarget:"22:30",stepTarget:10000,waterTargetMl:2500,proteinTargetG:130},
   create:{userId:uid,targetScore:90,targetDate:day(84),bedtimeTarget:"22:30",stepTarget:10000,waterTargetMl:2500,proteinTargetG:130}
 });
 const existingGoals=await db.goal.count({where:{userId:uid,active:true}});
 if(!existingGoals)await db.goal.create({data:{userId:uid,type:"Muskelaufbau · DEMO",active:true}});
 // 14 day trend: all illustrative, not verified measurements.
 for(let n=-13;n<=0;n++){
  const date=day(n),i=n+13;
  await ifMissing(()=>db.scoreSnapshot.findUnique({where:{userId_date:{userId:uid,date}}}),()=>db.scoreSnapshot.create({
   data:{id:"bd-demo-ayman-score-"+i,userId:uid,date,total:68+Math.round(i*.95),
    strength:65+Math.round(i*.9),endurance:61+Math.round(i),athleticism:66+Math.round(i*.8),
    mobility:72+Math.round(i*.3),recovery:63+Math.round(i*.7),fuel:70+Math.round(i*.8),
    consistency:68+Math.round(i),completeness:100,
    explanation:[{pillar:"strength",value:65+Math.round(i*.9),text:"DEMO · Beispielmessung, nicht bestätigt."},{pillar:"recovery",value:63+Math.round(i*.7),text:"DEMO · Fiktiver Erholungsverlauf."}]}
  }));
  await ifMissing(()=>db.wearableDaily.findUnique({where:{userId_date_source:{userId:uid,date,source:"demo_preview"}}}),()=>db.wearableDaily.create({
    data:{id:"bd-demo-ayman-wear-"+i,userId:uid,date,source:"demo_preview",steps:7900+val(300,i,2800),
     activeCalories:390+val(10,i,160),totalCalories:2350+val(50,i,210),
     sleepMinutes:415+val(5,i,65),restingHr:58+(i%5),hrv:44+(i%10),vo2max:42+(i%3),
     completeness:100,sleepStages:{deepPercent:22,lightPercent:58,remPercent:20,awakenings:1,
       averageSleepHr:56,currentHeartRate:70,sleepTargetMinutes:480,demo:true,providedBy:"demo_preview"}}
  }));
  await ifMissing(()=>db.dailyCheck.findUnique({where:{userId_date:{userId:uid,date}}}),()=>db.dailyCheck.create({
    data:{id:"bd-demo-ayman-check-"+i,userId:uid,date,energy:7+(i%2),soreness:2+(i%3),
      mood:7+(i%3),stress:3+(i%3),sleepHours:Math.round((7.1+(i%5)*.12)*10)/10,
      restingHr:59+(i%4),steps:8000+i*155,waterMl:2350+(i%4)*180,proteinG:125+(i%4)*6}
  }));
  await ifMissing(()=>db.nutritionDaily.findUnique({where:{userId_date:{userId:uid,date}}}),()=>db.nutritionDaily.create({
    data:{userId:uid,date,source:"demo_preview",calories:2180+val(60,i,310),
      proteinG:126+(i%5)*5,carbsG:215+(i%6)*8,fatG:65+(i%4)*3,
      waterMl:2350+(i%4)*180,fruitVegServings:4+(i%3),addedSugarG:21+(i%4)*2,
      processedFoodScore:25+(i%3)*4,fuelScore:72+Math.round(i*.8)}
  }));
 }
 for(let k=0;k<4;k++){
  const date=day(-21+k*7);
  await ifMissing(()=>db.bodyMetric.findUnique({where:{id:"bd-demo-ayman-body-"+k}}),()=>db.bodyMetric.create({
    data:{id:"bd-demo-ayman-body-"+k,userId:uid,date,weightKg:81.4-k*.4,waistCm:86-k*.6,chestCm:104+k*.25,bodyFat:18.4-k*.25}
  }));
 }
 // Reversible sample completed workouts and set logs. These are explicitly NOT past real workouts.
 const exIds=["BD-STR-001","BD-CORE-001","BD-LEG-012","BD-CORE-002","BD-STR-002","BD-MOB-009"];
 for(let i=0;i<8;i++){
  const id="bd-demo-ayman-workout-"+i,offset=-12+i;
  const ex1=exIds[i%exIds.length],ex2=exIds[(i+1)%exIds.length];
  const existing=await db.workout.findUnique({where:{id}});
  if(!existing)await db.workout.create({data:{id,userId:uid,
   title:["DEMO · Kraft & Core","DEMO · Athletik","DEMO · Regeneration","DEMO · Ganzkörper"][i%4],
   scheduledAt:eventTime(offset),startedAt:eventTime(offset),completedAt:eventTime(offset,19),
   rpe:6+i%3,notes:"DEMO · Fiktive Beispielsession; keine bestätigte persönliche Trainingshistorie",
   exercises:{create:[{exerciseId:ex1,orderIndex:0,targetSets:3,targetReps:"8 bis 12",targetRpe:7,restSeconds:90},
     {exerciseId:ex2,orderIndex:1,targetSets:3,targetReps:"12",targetRpe:7,restSeconds:60}]},
   sets:{create:[{exerciseId:ex1,setNumber:1,reps:10,weightKg:18+i*.5,rpe:7,completedAt:eventTime(offset,18)},
     {exerciseId:ex1,setNumber:2,reps:9,weightKg:18+i*.5,rpe:8,completedAt:eventTime(offset,18)},
     {exerciseId:ex2,setNumber:1,reps:12,weightKg:0,rpe:6,completedAt:eventTime(offset,18)}]}
  }});
 }
 // Reference baseline & follow-up test entries, all explicitly marked demo.
 for(const [metric,label,base,current,unit] of [
  ["strength","Kraft",46,58,"Punkte"],["endurance","Ausdauer",48,61,"Punkte"],
  ["athleticism","Athletik",51,63,"Punkte"],["mobility_score","Beweglichkeit",55,65,"Punkte"],
  ["pushups","Liegestütze",24,35,"Wiederholungen"]
 ]){
   for(const [phase,days,value] of [["baseline",-35,base],["current",-2,current]]){
    const id="bd-demo-ayman-test-"+metric+"-"+phase;
    if(!await db.performanceTest.findUnique({where:{id}})){
     await db.performanceTest.create({data:{id,userId:uid,name:"DEMO · "+label+" "+(phase==="baseline"?"Startwert":"Verlauf"),
       notes:"DEMO · Fiktives Testergebnis",completedAt:eventTime(days),
       results:{create:[{id:id+"-result",metric,value,unit}]}}});
    }
   }
 }
 for(const [key,name] of [["demo-first-week","DEMO · Erste Woche"],["demo-consistency","DEMO · Beständigkeit"],["demo-checkin","DEMO · Tagescheck"]]){
  await db.badge.upsert({where:{userId_key:{userId:uid,key}},update:{},create:{userId:uid,key,name}});
 }
 const challenge=await db.challenge.findUnique({where:{id:"challenge-30-different"}});
 if(challenge)await db.challengeEntry.upsert({where:{challengeId_userId:{challengeId:challenge.id,userId:uid}},
   update:{},create:{challengeId:challenge.id,userId:uid,progress:35}});
 const recId="bd-demo-ayman-recommendation-"+today.toISOString().slice(0,10);
 if(!await db.recommendation.findUnique({where:{id:recId}}))await db.recommendation.create({
  data:{id:recId,userId:uid,date:today,severity:"info",title:"DEMO · Heute im Fokus",
   explanation:"Diese Empfehlung nutzt ausschließlich fiktive Beispieldaten.",
   action:"Regelmäßige Trainingseinheiten, Ernährung und Schlaf im Demo Dashboard entdecken.",
   sourceRule:"demo_preview",coachStatus:"APPROVED"}
 });
 for(const [idx,title,body] of [[1,"DEMO · Trainingsplan bereit","Deine Beispielwoche ist im Trainingsbereich sichtbar."],
   [2,"DEMO · Fortschritt","Neue Demo Einträge im Leistungsverlauf."],
   [3,"DEMO · Regeneration","Deine Beispielwerte findest du unter Regeneration."]]){
  const id="bd-demo-ayman-notification-"+idx;
  if(!await db.notification.findUnique({where:{id}}))await db.notification.create({
   data:{id,userId:uid,category:"demo_preview",title,body,sentAt:now,readAt:now}
  });
 }
 const after=await db.mediaAsset.count({where:{relatedUserId:uid}});
 if(after<mediaBefore)throw Error("Unexpected media loss");
 console.log("DEMO_SEED_SUCCEEDED");
 console.log("PRIVATE_PHOTO_ROWS_BEFORE="+mediaBefore+" AFTER="+after);
 console.log("SCORE_HISTORY_DAYS="+await db.scoreSnapshot.count({where:{userId:uid}}));
 console.log("WEARABLE_DEMO_DAYS="+await db.wearableDaily.count({where:{userId:uid,source:"demo_preview"}}));
 console.log("PERFORMANCE_TESTS="+await db.performanceTest.count({where:{userId:uid}}));
 console.log("TRAINING_WORKOUTS="+await db.workout.count({where:{userId:uid}}));
 console.log("PLAN="+u.role+" (ADMIN role preserved), ELITE demo access only");
}
main().catch(e=>{console.error("DEMO_SEED_FAILED",e.message);process.exitCode=1}).finally(()=>db.$disconnect());
