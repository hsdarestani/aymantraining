import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
const demoEmail=(i)=>"demo.athlete."+i+"@example.invalid";
const dayMs=86400000;
const now=new Date();
const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
const date=(d)=>new Date(today.getTime()+d*dayMs);
const when=(d,h=15)=>new Date(today.getTime()+d*dayMs+h*3600000);
const ids=[1,2,3];
async function main(){
  const admin=await db.user.findUnique({where:{email:"admin@bedifferent.smarbiz.sbs"}});
  if(!admin||admin.name!=="Ayman"||admin.role!=="ADMIN")throw Error("Ayman admin guard failed; nothing changed.");
  const passwordHash=await bcrypt.hash(crypto.randomBytes(32).toString("hex"),12);
  const coach=await db.user.upsert({
    where:{email:"demo.trainer@example.invalid"},
    update:{},
    create:{name:"DEMO · Trainer",email:"demo.trainer@example.invalid",passwordHash,role:"COACH",onboardingCompleted:true}
  });
  const templateIds=["starter-athlete-base","starter-bodyweight","starter-mobility"];
  for(const i of ids){
    const email=demoEmail(i);
    const user=await db.user.upsert({where:{email},update:{},create:{
      name:"DEMO · Athlet "+String(i).padStart(2,"0"),email,passwordHash,role:"ATHLETE",
      onboardingCompleted:true,subscriptionTier:i===1?"FREE":"PRO"
    }});
    const uid=user.id;
    if(!await db.coachAssignment.findFirst({where:{athleteId:uid,coachId:coach.id,active:true}}))
      await db.coachAssignment.create({data:{athleteId:uid,coachId:coach.id}});
    const plan=await db.trainingPlan.findUnique({where:{id:templateIds[i-1]}});
    if(plan&&!await db.planAssignment.findFirst({where:{userId:uid,active:true}}))
      await db.planAssignment.create({data:{userId:uid,planId:plan.id}});
    for(const d of [-7,-1,0]){
      const val=60+i*5+(d===0?8:d===-1?5:0);
      await db.scoreSnapshot.upsert({where:{userId_date:{userId:uid,date:date(d)}},update:{},
        create:{userId:uid,date:date(d),total:val,strength:val+1,endurance:val-3,athleticism:val-2,
          mobility:val+4,recovery:val-4,fuel:val+2,consistency:val+1,completeness:100,
          explanation:[{pillar:"strength",value:val+1,text:"DEMO · Fiktive Leistung"}]}});
    }
    const workoutId="bd-demo-admin-athlete-"+i;
    await db.workout.upsert({where:{id:workoutId},update:{},
      create:{id:workoutId,userId:uid,trainingPlanId:plan?.id,
        title:"DEMO · "+(i===1?"Kraft Basis":i===2?"Mobilität":"Athletik"),
        scheduledAt:when(i===1?-1:1),completedAt:i===1?when(-1,16):null,
        notes:"DEMO · Beispiel für das Trainer Dashboard",rpe:i===1?7:null}});
    const recId="bd-demo-admin-alert-"+i;
    await db.recommendation.upsert({where:{id:recId},update:{},
      create:{id:recId,userId:uid,date:today,coachStatus:"PENDING",
        severity:i===1?"warning":"info",
        title:"DEMO · "+(i===1?"Erholung beobachten":"Plan prüfen"),
        explanation:"Ausschließlich synthetische Demonstrationsdaten.",
        action:"Im Demo Trainer Dashboard einsehen.",sourceRule:"demo_preview"}});
    const athleteMsg="bd-demo-admin-message-athlete-"+i;
    const coachMsg="bd-demo-admin-message-coach-"+i;
    await db.message.upsert({where:{id:athleteMsg},update:{},
      create:{id:athleteMsg,athleteId:uid,coachId:coach.id,senderId:uid,kind:"TEXT",
        text:"DEMO · Kannst du bitte meinen Trainingsplan ansehen?",createdAt:when(-1,12)}});
    await db.message.upsert({where:{id:coachMsg},update:{},
      create:{id:coachMsg,athleteId:uid,coachId:coach.id,senderId:coach.id,kind:"TEXT",
        text:"DEMO · Gerne, wir passen dein Training schrittweise an.",createdAt:when(-1,13)}});
    if(i===1){
      await db.aiHandoff.upsert({where:{id:"bd-demo-admin-ai-handoff"},update:{},
        create:{id:"bd-demo-admin-ai-handoff",userId:uid,coachId:coach.id,
          reason:"DEMO · Trainerentscheidung erforderlich",summary:"DEMO · Beispielhafter AI Handover zur Trainingsanpassung."}});
      await db.aiMessage.upsert({where:{id:"bd-demo-admin-ai-message"},update:{},
        create:{id:"bd-demo-admin-ai-message",userId:uid,role:"assistant",
          content:"DEMO · Achte auf kontrollierte Bewegungen und konsistente Regeneration.",
          sourceContext:{demo:true}}});
    }
  }
  await db.coachBrief.upsert({where:{id:"bd-demo-admin-brief"},update:{},
    create:{id:"bd-demo-admin-brief",coachId:coach.id,title:"DEMO · Morgenübersicht",
      body:"Beispiel einer täglichen Traineransage. Heute Fokus auf saubere Ausführung und aktive Erholung.",
      audienceTier:"PRO",publishAt:when(-1,8)}});
  await db.event.upsert({where:{id:"bd-demo-admin-event"},update:{},
    create:{id:"bd-demo-admin-event",title:"DEMO · Mobility Gruppenstunde",
      description:"Beispiel Event, kein echter Termin und keine buchbare Sitzung.",
      type:"MEETUP",startsAt:when(7,17),endsAt:when(7,18),location:"DEMO · Online",capacity:20,
      minTier:"FREE",active:true}});
  await db.notification.upsert({where:{id:"bd-demo-admin-campaign"},update:{},
    create:{id:"bd-demo-admin-campaign",userId:admin.id,category:"coach_campaign",
      title:"DEMO · Trainingsmotivation",body:"Beispiel einer Push Kampagne. Nicht wirklich versendet.",
      sentAt:now,readAt:now}});
  console.log("ADMIN_DEMO_SUCCEEDED");
  console.log("DEMO_ATHLETES="+await db.user.count({where:{email:{endsWith:"@example.invalid"},role:"ATHLETE"}}));
  console.log("DEMO_COACHES="+await db.user.count({where:{email:{endsWith:"@example.invalid"},role:"COACH"}}));
  console.log("DEMO_MESSAGES="+await db.message.count({where:{id:{startsWith:"bd-demo-admin-message-"}}}));
  console.log("DEMO_EVENTS="+await db.event.count({where:{id:"bd-demo-admin-event"}}));
  console.log("ACTUAL_USERS_UNMODIFIED=YES");
}
main().catch(e=>{console.error("ADMIN_DEMO_FAILED",e.message);process.exitCode=1}).finally(()=>db.$disconnect());
