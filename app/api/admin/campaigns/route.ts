import {coachAthleteFilter} from "../../../../lib/coach-access";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {queueNotification} from "../../../../lib/notifications";
const schema=z.object({title:z.string().min(2).max(120),body:z.string().min(2).max(500),category:z.string().min(1).max(60).default("coach"),tier:z.enum(["ALL","FREE","PRO"]).default("ALL")});
export async function POST(request:Request){
  const coach=await requireRole(["COACH","ADMIN"]);if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Kampagne.",422);
  const filter=await coachAthleteFilter(coach);
 const users=await prisma.user.findMany({where:{role:"ATHLETE",...(filter.userId?{id:filter.userId}:{}),...(p.data.tier==="ALL"?{}:{subscriptionTier:p.data.tier})},select:{id:true}});
  let queued=0;for(const user of users){if(await queueNotification({userId:user.id,title:p.data.title,body:p.data.body,category:p.data.category}))queued++;}
  return NextResponse.json({ok:true,queued});
}
