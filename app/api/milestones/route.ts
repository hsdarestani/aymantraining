import {NextResponse} from "next/server";
import {z} from "zod";
import {errorJson,requireApiUser,isSameOrigin} from "../../../lib/http";
import {getMilestoneSnapshot,milestoneHeaders} from "../../../lib/milestone-service";
import {milestonesEnabled} from "../../../lib/milestone-contract";
import {prisma} from "../../../lib/db";
export async function GET(){
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!milestonesEnabled())return NextResponse.json({ok:true,enabled:false},{headers:milestoneHeaders});
 return NextResponse.json({ok:true,...await getMilestoneSnapshot(user.id)},{headers:milestoneHeaders});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 if(!milestonesEnabled())return errorJson("Noch nicht freigeschaltet.",503);
 const parsed=z.object({awardId:z.string().min(1)}).strict().safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return errorJson("Ungültiger Eintrag.",422);
 const updated=await prisma.milestoneAward.updateMany({
  where:{id:parsed.data.awardId,userId:user.id,seenAt:null},data:{seenAt:new Date()}
 });
 return NextResponse.json({ok:true,updated:updated.count>0},{headers:milestoneHeaders});
}
