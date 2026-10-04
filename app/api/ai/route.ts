import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser,dateOnly} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";

const schema=z.object({message:z.string().trim().min(1).max(2000)});
function outputText(data:any){
 for(const item of data?.output||[])for(const part of item?.content||[])if(part?.type==="output_text"&&part.text)return String(part.text);
 return "";
}
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"different_ai"))return errorJson("Different AI ist PRO.",403);
 const items=await prisma.aiMessage.findMany({where:{userId:user.id},orderBy:{createdAt:"asc"},take:100});
 return NextResponse.json({ok:true,items,provider:Boolean(process.env.OPENAI_API_KEY)});
}
export async function POST(request:Request){
 if(!isSameOrigin(request)&&request.headers.get("x-bd-client")!=="mobile")return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!await hasFeature(user.subscriptionTier,"different_ai"))return errorJson("Different AI ist PRO.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Nachricht.",422);
 const [score,recs,workout,goal,history]=await Promise.all([
  prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
  prisma.recommendation.findMany({where:{userId:user.id,date:dateOnly()},orderBy:{createdAt:"desc"},take:3}),
  prisma.workout.findFirst({where:{userId:user.id,completedAt:null},orderBy:{scheduledAt:"asc"}}),
  prisma.goal.findFirst({where:{userId:user.id,active:true}}),
  prisma.aiMessage.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:12})
 ]);
 await prisma.aiMessage.create({data:{userId:user.id,role:"user",content:p.data.message}});
 const context=`Nutzerziel: ${goal?.type||"nicht angegeben"}. Score: ${score?.total??"unvollständig"}. Recovery: ${score?.recovery??"unvollständig"}. Nächstes Training: ${workout?.title||"kein Training geplant"}. Trainerhinweise: ${recs.map(r=>r.title+": "+r.action).join(" | ")||"keine"}.`;
 let answer="";
 if(process.env.OPENAI_API_KEY){
  const input=[...history.reverse().map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content})),{role:"user",content:p.data.message}];
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({
   model:process.env.OPENAI_MODEL||"gpt-6-luna",
   instructions:`Du bist Different AI, der nächtliche Lern und Trainingsassistent von BE DIFFERENT. Antworte auf Deutsch, kurz und konkret. Nutze ausschließlich Trainings und Lifestyle Sprache, stelle keine Diagnosen und ändere keinen Trainingsplan eigenmächtig. Bei Warnzeichen oder gesundheitlichen Beschwerden empfehle professionelle Abklärung. Der echte Trainer hat immer die letzte Entscheidung. Kontext: ${context}`,
   input,max_output_tokens:450
  })});
  if(response.ok)answer=outputText(await response.json());
 }
 if(!answer){
  const lead=recs[0];
  answer=lead?`${lead.action} Das ist eine automatisierte Empfehlung aus deinen aktuellen Daten. Dein Trainer entscheidet final über Planänderungen.`:`Deine Daten geben gerade keinen klaren Warnhinweis. Bleib bei deinem Plan, erfasse dein Training sauber und nutze den Tagescheck. Dein Trainer entscheidet final über Anpassungen.`;
 }
 const item=await prisma.aiMessage.create({data:{userId:user.id,role:"assistant",content:answer,sourceContext:{score:score?.total??null,recommendations:recs.map(r=>r.id),workoutId:workout?.id??null}}});
 return NextResponse.json({ok:true,item});
}
