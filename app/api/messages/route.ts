import {canCoachAccess} from "../../../lib/coach-access";
import {Prisma} from "@prisma/client";
import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../lib/db";
import {errorJson,isSameOrigin,requireApiUser} from "../../../lib/http";
import {hasFeature} from "../../../lib/entitlements";
import {queueNotification} from "../../../lib/notifications";
const schema=z.object({clientId:z.string().regex(/^[a-z0-9-]{8,64}$/).optional(),athleteId:z.string().optional(),text:z.string().trim().min(1).max(4000).optional(),mediaId:z.string().optional(),kind:z.enum(["TEXT","VOICE","VIDEO"]).default("TEXT"),durationSec:z.number().int().min(0).max(3600).optional()}).refine(v=>v.text||v.mediaId,{message:"Inhalt fehlt."});
export async function GET(request:Request){
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  if(user.role==="ATHLETE"&&!await hasFeature(user.subscriptionTier,"coach_chat"))return errorJson("Coach Chat ist PRO.",403);
  const requested=new URL(request.url).searchParams.get("athleteId");const athleteId=user.role==="ATHLETE"?user.id:requested;if(!athleteId)return errorJson("Athlet fehlt.",422);
  if(user.role!=="ATHLETE"&&!await canCoachAccess(user,athleteId))return errorJson("Keine Berechtigung.",403);
  const query=new URL(request.url).searchParams;
  if(query.get("recent")==="1"){
    const before=query.get("before");
    const cursor=before?await prisma.message.findFirst({where:{id:before,athleteId},select:{id:true,createdAt:true}}):null;
    if(before&&!cursor)return errorJson("Dieser Ausschnitt der Unterhaltung ist nicht verfügbar.",404);
    const rows=await prisma.message.findMany({
      where:{athleteId,...(cursor&&{OR:[{createdAt:{lt:cursor.createdAt}},{createdAt:cursor.createdAt,id:{lt:cursor.id}}]})},
      orderBy:[{createdAt:"desc"},{id:"desc"}],take:41
    });
    const page=rows.slice(0,40);
    const nextCursor=rows.length>40?page[page.length-1].id:null;
    return NextResponse.json({ok:true,items:page.reverse(),nextCursor},{headers:{"Cache-Control":"private, no-store"}});
  }
  const items=await prisma.message.findMany({where:{athleteId},orderBy:{createdAt:"asc"},take:300});return NextResponse.json({ok:true,items});
}
export async function POST(request:Request){
  if(!isSameOrigin(request))return errorJson("Ungültige Anfrage.",403);
  const user=await requireApiUser();if(!user)return errorJson("Nicht angemeldet.",401);
  if(user.role==="ATHLETE"&&!await hasFeature(user.subscriptionTier,"coach_chat"))return errorJson("Coach Chat ist PRO.",403);
  const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return errorJson("Ungültige Nachricht.",422);
  const athleteId=user.role==="ATHLETE"?user.id:p.data.athleteId;if(!athleteId)return errorJson("Athlet fehlt.",422);
  if(user.role!=="ATHLETE"&&!await canCoachAccess(user,athleteId))return errorJson("Keine Berechtigung.",403);
  const athlete=await prisma.user.findFirst({where:{id:athleteId,role:"ATHLETE"}});if(!athlete)return errorJson("Athlet nicht gefunden.",404);
  if(p.data.mediaId){const asset=await prisma.mediaAsset.findUnique({where:{id:p.data.mediaId}});if(!asset||asset.ownerId!==user.id)return errorJson("Keine Berechtigung.",403);if((p.data.kind==="VOICE"&&asset.kind!=="VOICE_MESSAGE")||(p.data.kind==="VIDEO"&&asset.kind!=="TECHNIQUE_VIDEO"))return errorJson("Ungültiger Medientyp.",422);}
  let coachId=user.role==="ATHLETE"?"unassigned":user.id;if(user.role==="ATHLETE"){const assignment=await prisma.coachAssignment.findFirst({where:{athleteId:user.id,active:true},orderBy:{createdAt:"desc"}});if(assignment)coachId=assignment.coachId;else{const coach=await prisma.user.findFirst({where:{role:{in:["COACH","ADMIN"]}},orderBy:{createdAt:"asc"}});coachId=coach?.id??"unassigned";}}
  const clientId=user.role==="ATHLETE"&&p.data.clientId?"native:"+user.id+":"+p.data.clientId:undefined;
  let message;
  try{
    message=await prisma.message.create({data:{id:clientId,athleteId,coachId,senderId:user.id,text:p.data.text,mediaId:p.data.mediaId,kind:p.data.kind,durationSec:p.data.durationSec}});
  }catch(error){
    if(!clientId||!(error instanceof Prisma.PrismaClientKnownRequestError)||error.code!=="P2002")throw error;
    message=await prisma.message.findUniqueOrThrow({where:{id:clientId}});
    if(message.senderId!==user.id||message.athleteId!==athleteId)return errorJson("Keine Berechtigung.",403);
  }
  if(user.role!=="ATHLETE")await queueNotification({userId:athleteId,category:"coach_message",title:"Dein Coach hat dir geschrieben",body:p.data.kind==="VOICE"?"Neue Sprachnachricht":p.data.kind==="VIDEO"?"Neues Technikfeedback":"Öffne die App, um deine Nachricht zu lesen.",urgent:true});
  return NextResponse.json({ok:true,message});
}
