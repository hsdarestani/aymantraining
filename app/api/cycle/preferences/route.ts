import {NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "../../../../lib/db";
import {isSameOrigin,errorJson,requireApiUser} from "../../../../lib/http";
import {cycleFeatureEnabled,dateFromKey,preferenceSchema} from "../../../../lib/cycle-contract";
import {privateCycle,cyclePrivateHeaders} from "../../../../lib/cycle-service";
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!cycleFeatureEnabled())return errorJson("Zyklusmodul nicht freigeschaltet.",503);
 const p=preferenceSchema.safeParse(await request.json().catch(()=>null));
 if(!p.success)return errorJson("Ungültige oder unvollständige Zustimmung.",422);
 const data=p.data;
 // Revocation deletes the journal, sharing grant, legacy cycle values, and stale alerts atomically.
 if(data.action==="DISABLE"){
  await prisma.$transaction(async tx=>{
   await tx.cycleJournalEntry.deleteMany({where:{userId:user.id}});
   await tx.cyclePrivacy.deleteMany({where:{userId:user.id}});
   await tx.athleteContext.updateMany({where:{userId:user.id},
    data:{cycleTrackingEnabled:false,cycleStartDate:null,cycleLengthDays:28}});
   await tx.recommendation.deleteMany({where:{userId:user.id,sourceRule:"cycle_context"}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return NextResponse.json({ok:true,...await privateCycle(user.id)},{headers:cyclePrivateHeaders});
 }
 if(data.action==="ENABLE"){
  await prisma.$transaction(async tx=>{
   await tx.cyclePrivacy.upsert({where:{userId:user.id},create:{userId:user.id,enabled:true,
    consentVersion:"cycle-v1-2026-10",consentedAt:new Date(),shareWithCoach:false,remindersEnabled:false},
    update:{enabled:true,consentVersion:"cycle-v1-2026-10",consentedAt:new Date(),
     shareWithCoach:false,remindersEnabled:false}});
   await tx.athleteContext.updateMany({where:{userId:user.id},
    data:{cycleTrackingEnabled:false,cycleStartDate:null,cycleLengthDays:28}});
   await tx.recommendation.deleteMany({where:{userId:user.id,sourceRule:"cycle_context"}});
  });
 }else{
  const current=await prisma.cyclePrivacy.findUnique({where:{userId:user.id}});
  if(!current?.enabled)return errorJson("Bitte zuerst ausdrücklich zustimmen.",409);
  if(data.action==="SHARE"){
   if(data.shareWithCoach&&data.confirmShare!==true)return errorJson("Separate Zustimmung zur Trainerfreigabe erforderlich.",422);
   await prisma.cyclePrivacy.update({where:{userId:user.id},data:{shareWithCoach:data.shareWithCoach}});
  }else if(data.action==="UPDATE"){
   await prisma.cyclePrivacy.update({where:{userId:user.id},data:{
    ...(data.lastPeriodStart!==undefined?{lastPeriodStart:data.lastPeriodStart?dateFromKey(data.lastPeriodStart):null}:{}),
    ...(data.cycleLengthDays!==undefined?{cycleLengthDays:data.cycleLengthDays}:{}),
    ...(data.remindersEnabled!==undefined?{remindersEnabled:data.remindersEnabled}:{})
   }});
  }
 }
 return NextResponse.json({ok:true,...await privateCycle(user.id)},{headers:cyclePrivateHeaders});
}
