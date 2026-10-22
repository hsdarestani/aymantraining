import {NextResponse} from "next/server";
import {prisma} from "../../../../lib/db";
import {isSameOrigin,errorJson,requireApiUser} from "../../../../lib/http";
import {cycleFeatureEnabled,entrySchema,dateFromKey,validDateKey} from "../../../../lib/cycle-contract";
import {privateCycle,cyclePrivateHeaders} from "../../../../lib/cycle-service";
export async function PUT(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!cycleFeatureEnabled())return errorJson("Zyklusmodul nicht freigeschaltet.",503);
 const parsed=entrySchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Ungültige Tagesdaten.",422);
 const day=parsed.data.date;
 const today=new Date();
 const max=new Date(today.getTime()+86400000),min=new Date(today.getTime()-366*86400000);
 const date=dateFromKey(day);
 if(date<new Date(Date.UTC(min.getUTCFullYear(),min.getUTCMonth(),min.getUTCDate()))||date>max)
  return errorJson("Eintrag außerhalb des zulässigen Zeitraums.",422);
 const {date:_,...fields}=parsed.data;
 // Serial transaction prevents a late concurrent write after consent was revoked.
 const saved=await prisma.$transaction(async tx=>{
  const consent=await tx.cyclePrivacy.findUnique({where:{userId:user.id},select:{enabled:true}});
  if(!consent?.enabled)throw Error("CYCLE_CONSENT_REQUIRED");
  return tx.cycleJournalEntry.upsert({where:{userId_date:{userId:user.id,date}},
   update:fields,create:{userId:user.id,date,...fields}});
 }).catch(e=>{if(e instanceof Error&&e.message==="CYCLE_CONSENT_REQUIRED")return null;throw e});
 if(!saved)return errorJson("Zustimmung erforderlich.",409);
 return NextResponse.json({ok:true,entry:{...saved,date:day}},{headers:cyclePrivateHeaders});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!cycleFeatureEnabled())return errorJson("Zyklusmodul nicht freigeschaltet.",503);
 const data=await request.json().catch(()=>null);
 if(!data||typeof data!=="object"||Object.keys(data).join(",")!=="date"||typeof data.date!=="string"||!validDateKey(data.date))
  return errorJson("Ungültiges Datum.",422);
 await prisma.cycleJournalEntry.deleteMany({where:{userId:user.id,date:dateFromKey(data.date)}});
 return NextResponse.json({ok:true},{headers:cyclePrivateHeaders});
}
