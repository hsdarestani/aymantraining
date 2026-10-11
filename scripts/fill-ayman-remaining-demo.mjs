import { PrismaClient } from "@prisma/client";

const db=new PrismaClient();
const dayMs=86400000;
const now=new Date();
const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
const monday=new Date(today.getTime()-((today.getUTCDay()+6)%7)*dayMs);
const date=(offset)=>new Date(today.getTime()+offset*dayMs);
const week=(offset)=>new Date(monday.getTime()-offset*7*dayMs);

async function main(){
 const admin=await db.user.findUnique({where:{email:"admin@bedifferent.smarbiz.sbs"}});
 const coach=await db.user.findUnique({where:{email:"demo.trainer@example.invalid"}});
 if(!admin||admin.name!=="Ayman"||admin.role!=="ADMIN"||
    !coach||coach.name!=="DEMO · Trainer"||coach.role!=="COACH"||
    !coach.email.endsWith("@example.invalid")){
   throw Error("Expected Ayman administrator and dedicated DEMO trainer must exist; refusing changes");
 }
 const userId=admin.id;
 const photosBefore=await db.mediaAsset.count({where:{relatedUserId:userId}});
 const userCountBefore=await db.user.count();

 // Illustrative, local-only history. Not a real chat, AI response, or scheduled notification.
 const messages=[
  ["bd-demo-ayman-chat-1",userId,"DEMO · Hallo Ayman, können wir meinen Plan für die neue Woche besprechen?",-4,11],
  ["bd-demo-ayman-chat-2",coach.id,"DEMO · Natürlich! Achte heute vor allem auf die saubere Technik und die Erholung.",-4,12],
  ["bd-demo-ayman-chat-3",userId,"DEMO · Perfekt, wie sieht mein aktueller Fortschritt aus?",-2,10],
  ["bd-demo-ayman-chat-4",coach.id,"DEMO · Im Beispielverlauf steigt dein Leistungswert. Die Zahlen sind nur Demo.",-2,11],
 ];
 for(const [id,senderId,text,days,hour] of messages){
  await db.message.upsert({where:{id},update:{},create:{
   id,athleteId:userId,coachId:coach.id,senderId,kind:"TEXT",text,
   createdAt:new Date(date(days).getTime()+hour*3600000),
   readAt:now
  }});
 }
 for(const [i,role,content] of [
   [1,"user","DEMO · Wie kann ich meine Regeneration nach dem Krafttraining verbessern?"],
   [2,"assistant","DEMO · Beispielantwort: Plane Pausen ein, schlafe möglichst regelmäßig und steigere die Belastung schrittweise. Diese Antwort wurde nicht von einer aktiven KI Verbindung erzeugt."],
   [3,"user","DEMO · Was steht diese Woche im Fokus?"],
   [4,"assistant","DEMO · Beispielantwort: Im Demo Trainingsplan stehen Kraft, Mobilität und aktive Regeneration. Dein Trainer sollte echte Anpassungen freigeben."]
 ]){
  const id="bd-demo-ayman-ai-"+i;
  await db.aiMessage.upsert({where:{id},update:{},create:{
   id,userId,role,content,
   sourceContext:{demo:true,previewOnly:true,noExternalAIGeneration:true},
   createdAt:new Date(now.getTime()-(5-i)*150000)
  }});
 }
 for(let k=0;k<3;k++){
  const w=week(k);
  const existing=await db.weeklyCheckIn.findUnique({where:{userId_weekStart:{userId,weekStart:w}}});
  if(!existing)await db.weeklyCheckIn.create({data:{
   userId,weekStart:w,
   weightKg:80.1+k*.35,energy:7+(k%2),recovery:7+(k%2),training:3,
   note:"DEMO · Beispielbericht. Keine bestätigte echte Trainingsleistung oder Gesundheitsmessung.",
   questions:"DEMO · Worauf sollte ich nächste Woche beim Training achten?"
  }});
 }
 // Fill non-medical training configuration only when absent; do not invent a real DOB.
 const edit={};
 if(admin.availabilityPerWeek==null) edit.availabilityPerWeek=3;
 if(!admin.trainingExperience) edit.trainingExperience="Fortgeschritten · DEMO";
 if(Object.keys(edit).length) await db.user.update({where:{id:userId},data:edit});

 const photosAfter=await db.mediaAsset.count({where:{relatedUserId:userId}});
 const userCountAfter=await db.user.count();
 if(photosAfter!==photosBefore||userCountAfter!==userCountBefore)
   throw Error("Guard: user or photo count changed unexpectedly");
 console.log("DEMO_AYMAN_MISSING_SECTIONS_FILLED=YES");
 console.log("DEMO_AYMAN_COACH_MESSAGES="+await db.message.count({where:{athleteId:userId}}));
 console.log("DEMO_AYMAN_AI_MESSAGES="+await db.aiMessage.count({where:{userId}}));
 console.log("DEMO_AYMAN_WEEKLY_CHECKINS="+await db.weeklyCheckIn.count({where:{userId}}));
 console.log("AYMAN_PHOTOS_PRESERVED="+photosAfter);
 console.log("REAL_ACCOUNT_DATA_AND_PROVIDER_INTEGRATIONS_UNCHANGED=YES");
}
main().catch(e=>{console.error("MISSING_DEMO_SEED_FAILED",e.message);process.exitCode=1}).finally(()=>db.$disconnect());
