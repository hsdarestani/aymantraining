import {NextResponse} from "next/server";
import {requireApiUser,isSameOrigin,errorJson} from "../../../lib/http";
import {prisma} from "../../../lib/db";
import {celebrationsEnabled,eventSchema} from "../../../lib/celebration-contract";
import {getCelebrations,celebrationHeaders} from "../../../lib/celebration-service";
export async function GET(){
 const user=await requireApiUser();
 if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 return NextResponse.json({ok:true,...await getCelebrations(user.id)},{headers:celebrationHeaders});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();
 if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!celebrationsEnabled())return errorJson("Noch nicht freigeschaltet.",503);
 const parsed=eventSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Ungültige Einstellung.",422);
 const value=parsed.data;
 if(value.action==="ACKNOWLEDGE"){
  const changed=await prisma.milestoneAward.updateMany({where:{id:value.awardId,userId:user.id,seenAt:null},
   data:{seenAt:new Date()}});
  // A repeated acknowledgement must remain idempotent, but ownership is required.
  if(!changed.count){
   const owned=await prisma.milestoneAward.findFirst({where:{id:value.awardId,userId:user.id},select:{id:true}});
   if(!owned)return errorJson("Erfolg nicht gefunden.",404);
  }
  return NextResponse.json({ok:true,acknowledged:true},{headers:celebrationHeaders});
 }
 await prisma.celebrationPreference.upsert({where:{userId:user.id},create:{userId:user.id,
  enabled:value.enabled,reduceMotion:value.reduceMotion},update:{
  enabled:value.enabled,reduceMotion:value.reduceMotion}});
 return NextResponse.json({ok:true,preference:{enabled:value.enabled,reduceMotion:value.reduceMotion}},
  {headers:celebrationHeaders});
}
