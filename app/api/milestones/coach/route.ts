import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {errorJson,requireApiUser,isSameOrigin} from "../../../../lib/http";
import {localDateKey} from "../../../../lib/daily-profile";
import {milestonesEnabled,recoverySchema,ruleSchema,validDay,addDays,toDayDate} from "../../../../lib/milestone-contract";
import {milestoneHeaders} from "../../../../lib/milestone-service";
import {canManageMilestoneAthlete} from "../../../../lib/milestone-coach";
const input=z.discriminatedUnion("action",[
 z.object({action:z.literal("UPSERT_RULE"),rule:ruleSchema}).strict(),
 z.object({action:z.literal("DISABLE_RULE"),athleteId:z.string().min(1),key:z.string().min(3)}).strict(),
 z.object({action:z.literal("PLAN_RECOVERY"),plan:recoverySchema}).strict(),
 z.object({action:z.literal("REMOVE_RECOVERY"),athleteId:z.string().min(1),day:z.string().refine(validDay)}).strict()
]);
export async function GET(request:Request){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!["COACH","ADMIN"].includes(user.role))return errorJson("Nur für Trainer.",403);
 if(!milestonesEnabled())return NextResponse.json({ok:true,enabled:false},{headers:milestoneHeaders});
 const id=new URL(request.url).searchParams.get("athleteId");
 if(!id)return errorJson("Athlet fehlt.",422);
 if(!await canManageMilestoneAthlete(user,id))return errorJson("Keine Berechtigung.",403);
 const [athlete,rules,rest]=await Promise.all([
  prisma.user.findUnique({where:{id},select:{id:true,name:true,timezone:true}}),
  prisma.milestoneRule.findMany({where:{athleteId:id},orderBy:{createdAt:"desc"},take:100}),
  prisma.plannedRecoveryDay.findMany({where:{athleteId:id,day:{gte:new Date(Date.now()-120*86400000)}},
   orderBy:{day:"desc"},take:130})
 ]);
 return NextResponse.json({ok:true,enabled:true,athlete,rules,rest},{headers:milestoneHeaders});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!["COACH","ADMIN"].includes(user.role))return errorJson("Nur für Trainer.",403);
 if(!milestonesEnabled())return errorJson("Noch nicht freigeschaltet.",503);
 const parsed=input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Ungültige Konfiguration.",422);
 const data=parsed.data,athleteId=data.action==="UPSERT_RULE"?data.rule.athleteId:
  data.action==="PLAN_RECOVERY"?data.plan.athleteId:data.athleteId;
 if(!await canManageMilestoneAthlete(user,athleteId))return errorJson("Keine Berechtigung.",403);
 if(data.action==="UPSERT_RULE"){
  // Namespaced IDs prevent retroactively changing official starter awards or another trainer's events.
  if(!data.rule.key.startsWith("coach_"))return errorJson("Regelschlüssel muss mit coach_ beginnen.",422);
  const {athleteId:_,...fields}=data.rule;
  const existing=await prisma.milestoneRule.findUnique({where:{athleteId_key:{athleteId,key:fields.key}}});
  if(existing&&existing.coachId!==user.id&&user.role!=="ADMIN")return errorJson("Fremde Regel.",403);
  const rule=await prisma.milestoneRule.upsert({
   where:{athleteId_key:{athleteId,key:fields.key}},
   update:{...fields},create:{athleteId,coachId:user.id,...fields}
  });
  return NextResponse.json({ok:true,rule},{headers:milestoneHeaders});
 }
 if(data.action==="DISABLE_RULE"){
  const existing=await prisma.milestoneRule.findUnique({where:{athleteId_key:{athleteId,key:data.key}}});
  if(!existing)return errorJson("Regel fehlt.",404);
  if(existing.coachId!==user.id&&user.role!=="ADMIN")return errorJson("Fremde Regel.",403);
  await prisma.milestoneRule.update({where:{id:existing.id},data:{enabled:false}});
  return NextResponse.json({ok:true},{headers:milestoneHeaders});
 }
 const athlete=await prisma.user.findUnique({where:{id:athleteId},select:{timezone:true}});
 const zone=athlete?.timezone||"Europe/Berlin",today=localDateKey(new Date(),zone);
 if(data.action==="PLAN_RECOVERY"){
  const {day,reason}=data.plan;
  // Only the future can be scheduled; no retrospective streak farming.
  if(day<=today||day>addDays(today,90))return errorJson("Erholung nur 1 bis 90 Tage im Voraus planen.",422);
  const scheduled=await prisma.workout.findMany({where:{userId:athleteId,scheduledAt:{
   gte:new Date(toDayDate(day).getTime()-86400000),lte:new Date(toDayDate(day).getTime()+2*86400000)
  }},select:{scheduledAt:true}});
  if(scheduled.some(w=>w.scheduledAt&&localDateKey(w.scheduledAt,zone)===day))
   return errorJson("An diesem Tag ist bereits Training geplant.",409);
  const existing=await prisma.plannedRecoveryDay.findUnique({where:{athleteId_day:{athleteId,day:toDayDate(day)}}});
  if(existing&&existing.coachId!==user.id&&user.role!=="ADMIN")return errorJson("Von anderem Trainer geplant.",403);
  const plan=await prisma.plannedRecoveryDay.upsert({
   where:{athleteId_day:{athleteId,day:toDayDate(day)}},
   update:{reason:reason||null},create:{athleteId,coachId:user.id,day:toDayDate(day),reason:reason||null}
  });
  return NextResponse.json({ok:true,plan},{headers:milestoneHeaders});
 }
 const existing=await prisma.plannedRecoveryDay.findUnique({
  where:{athleteId_day:{athleteId,day:toDayDate(data.day)}}
 });
 if(existing&&existing.coachId!==user.id&&user.role!=="ADMIN")return errorJson("Fremde Planung.",403);
 if(existing)await prisma.plannedRecoveryDay.delete({where:{id:existing.id}});
 return NextResponse.json({ok:true},{headers:milestoneHeaders});
}
