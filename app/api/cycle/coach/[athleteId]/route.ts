import {NextResponse} from "next/server";
import {prisma} from "../../../../../lib/db";
import {canCoachAccess} from "../../../../../lib/coach-access";
import {errorJson,requireApiUser} from "../../../../../lib/http";
import {cycleFeatureEnabled} from "../../../../../lib/cycle-contract";
import {cyclePrivateHeaders} from "../../../../../lib/cycle-service";
export async function GET(_request:Request,{params}:{params:Promise<{athleteId:string}>}){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(!cycleFeatureEnabled())return errorJson("Nicht verfügbar.",404);
 const {athleteId}=await params;
 if(!["COACH","ADMIN"].includes(user.role)||!await canCoachAccess(user,athleteId))
   return errorJson("Kein Zugriff.",403);
 const consent=await prisma.cyclePrivacy.findUnique({where:{userId:athleteId},
  select:{enabled:true,shareWithCoach:true}});
 if(!consent?.enabled||!consent.shareWithCoach)return errorJson("Keine Freigabe.",403);
 const since=new Date(Date.now()-14*86400000);
 const rows=await prisma.cycleJournalEntry.findMany({where:{userId:athleteId,date:{gte:since}},
  select:{date:true,planChoice:true,energy:true,discomfort:true},orderBy:{date:"desc"},take:14});
 // Share only recent training-related signals, not flow, menstrual symptoms or prediction.
 return NextResponse.json({ok:true,shared:true,entries:rows.map(e=>({...e,date:e.date.toISOString().slice(0,10)}))},
  {headers:cyclePrivateHeaders});
}
