
import {Copy} from "../../../components/Locale";
import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {canCoachAccess} from "../../../../lib/coach-access";
import ThreadClient from "./ThreadClient";
export const dynamic="force-dynamic";

export default async function Thread({params}:{params:Promise<{athleteId:string}>}){
 const {athleteId}=await params;const actor=await requireRole(["COACH","ADMIN"]);if(!await canCoachAccess(actor,athleteId))notFound();
 const athlete=await prisma.user.findFirst({where:{id:athleteId,role:"ATHLETE"},select:{id:true,name:true,email:true}});
 if(!athlete)notFound();
 const messages=await prisma.message.findMany({where:{athleteId},orderBy:{createdAt:"asc"},take:300});
 await prisma.message.updateMany({where:{athleteId,senderId:athleteId,readAt:null},data:{readAt:new Date()}});
 const mediaIds=[...new Set(messages.map(m=>m.mediaId).filter((x):x is string=>Boolean(x)))];
 const [media,feedback]=await Promise.all([
  prisma.mediaAsset.findMany({where:{id:{in:mediaIds}},select:{id:true,kind:true,originalName:true,mimeType:true}}),
  prisma.videoFeedback.findMany({where:{athleteId},orderBy:{createdAt:"desc"},take:100})
 ]);
 return <main className="admin-content" style={{margin:"0 auto"}}>
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINER POSTFACH"}/></span><h1>{athlete.name||athlete.email}</h1></div><div className="row-actions"><Link href={`/admin/customers/${athleteId}`} className="ghost"><Copy text={"ATHLETENPROFIL"}/></Link><Link href="/admin/inbox" className="ghost"><Copy text={"← NACHRICHTEN"}/></Link></div></header>
  <ThreadClient athleteId={athleteId} messages={messages.map(m=>({id:m.id,senderId:m.senderId,athleteId:m.athleteId,kind:m.kind,text:m.text,mediaId:m.mediaId,durationSec:m.durationSec,createdAt:m.createdAt.toISOString()}))} media={media} feedback={feedback.map(f=>({id:f.id,mediaId:f.mediaId,annotations:f.annotations,createdAt:f.createdAt.toISOString()}))}/>
 </main>;
}
