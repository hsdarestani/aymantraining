import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireApiUser,errorJson,isSameOrigin} from "../../../../lib/http";
import {hasFeature} from "../../../../lib/entitlements";
import {queueNotification} from "../../../../lib/notifications";
const input=z.object({mediaId:z.string().min(5),message:z.string().trim().max(1000).default("")}).strict();
export async function GET(){
 if(process.env.JOURNEY_DAILY_ENABLED!=="true")return errorJson("Noch nicht freigegeben.",503);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE")return errorJson("Nur für Athleten.",403);
 const rows=await prisma.videoFeedback.findMany({where:{athleteId:user.id},
  select:{id:true,status:true,createdAt:true,reviewedAt:true,annotations:true},
  orderBy:{createdAt:"desc"},take:50});
 return NextResponse.json({ok:true,videos:rows},{headers:{"cache-control":"private, no-store"}});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 if(process.env.JOURNEY_DAILY_ENABLED!=="true")return errorJson("Noch nicht freigegeben.",503);
 const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
 if(user.role!=="ATHLETE"||!await hasFeature(user.subscriptionTier,"coach_chat"))return errorJson("Technikvideo benötigt PRO.",403);
 const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorJson("Ungültiger Videoauftrag.",422);
 const [asset,assignment]=await Promise.all([
  prisma.mediaAsset.findFirst({where:{id:parsed.data.mediaId,ownerId:user.id,relatedUserId:user.id,kind:"TECHNIQUE_VIDEO"}}),
  prisma.coachAssignment.findFirst({where:{athleteId:user.id,active:true,OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},orderBy:{createdAt:"desc"}})
 ]);
 if(!asset)return errorJson("Video nicht gefunden.",404);
 if(!assignment)return errorJson("Bitte zuerst einen Trainer zuweisen.",409);
 const existing=await prisma.videoFeedback.findFirst({where:{athleteId:user.id,mediaId:asset.id},select:{id:true}});
 if(existing)return errorJson("Dieses Video wurde bereits eingereicht.",409);
 const row=await prisma.videoFeedback.create({data:{
  athleteId:user.id,coachId:assignment.coachId,mediaId:asset.id,status:"OPEN",
  annotations:{athleteNote:parsed.data.message}
 }});
 await queueNotification({userId:assignment.coachId,category:"technique_review",title:"Neues Technikvideo",
  body:"Ein Athlet hat ein Video zur persönlichen Prüfung eingereicht.",
  data:{route:"/admin/journey-videos"}}).catch(()=>null);
 return NextResponse.json({ok:true,id:row.id,status:"OPEN"},{status:201});
}
