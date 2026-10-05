import {canCoachAccess} from "../../../../lib/coach-access";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {errorJson,isSameOrigin} from "../../../../lib/http";
import {queueNotification} from "../../../../lib/notifications";

const point=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)});
const schema=z.object({
 athleteId:z.string(),
 mediaId:z.string(),
 timestampSec:z.number().int().min(0).max(7200),
 note:z.string().max(2000).default(""),
 strokes:z.array(z.array(point).max(500)).max(30).default([])
}).refine(x=>x.note.trim()||x.strokes.length,{message:"Feedback fehlt."});

export async function POST(request:Request){
 const coach=await requireRole(["COACH","ADMIN"]);
 if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
 const p=schema.safeParse(await request.json().catch(()=>null));
 if(!p.success)return errorJson("Ungültiges Feedback.",422);
if(!await canCoachAccess(coach,p.data.athleteId))return errorJson("Keine Berechtigung.",403); const asset=await prisma.mediaAsset.findFirst({where:{id:p.data.mediaId,relatedUserId:p.data.athleteId,kind:"TECHNIQUE_VIDEO"}});
 if(!asset)return errorJson("Technikvideo nicht gefunden.",404);
 const annotations={items:[{timestampSec:p.data.timestampSec,note:p.data.note.trim(),strokes:p.data.strokes}]};
 const item=await prisma.videoFeedback.create({data:{athleteId:p.data.athleteId,coachId:coach.id,mediaId:p.data.mediaId,annotations,status:"REVIEWED",reviewedAt:new Date()}});
 const mm=Math.floor(p.data.timestampSec/60),ss=String(p.data.timestampSec%60).padStart(2,"0");
 const summary=p.data.note.trim()||"Zeichnung zur Technik";
 await prisma.message.create({data:{athleteId:p.data.athleteId,coachId:coach.id,senderId:coach.id,kind:"TEXT",text:`Video Feedback bei ${mm}:${ss}: ${summary}`}});
 await queueNotification({userId:p.data.athleteId,category:"coach_message",title:"Neues Technik Feedback",body:`Dein Trainer hat dein Video bei ${mm}:${ss} kommentiert.`,urgent:true});
 return NextResponse.json({ok:true,item});
}
