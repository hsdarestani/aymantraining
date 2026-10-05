
import {LocalizedValue} from "../../components/Locale";

import {Copy} from "../../components/Locale";
import Link from "next/link";
import {requireRole} from "../../../lib/auth";
import {coachAthleteFilter} from "../../../lib/coach-access";
import {prisma} from "../../../lib/db";
export const dynamic="force-dynamic";

export default async function Inbox(){
 const actor=await requireRole(["COACH","ADMIN"]),filter=await coachAthleteFilter(actor);
 const messages=await prisma.message.findMany({where:filter.userId?{athleteId:filter.userId}:{},orderBy:{createdAt:"desc"},take:500});
 const athleteIds=[...new Set(messages.map(m=>m.athleteId))];
 const [users,recs]=await Promise.all([
  prisma.user.findMany({where:{id:{in:athleteIds}},select:{id:true,name:true,email:true}}),
  prisma.recommendation.findMany({where:{userId:{in:athleteIds},coachStatus:"PENDING"},orderBy:{createdAt:"desc"}})
 ]);
 const names=new Map(users.map(u=>[u.id,u.name||u.email]));
 const risk=new Map<string,string>();
 for(const x of recs)if(!risk.has(x.userId)||x.severity==="critical")risk.set(x.userId,x.severity);
 const threads=athleteIds.map(id=>{
  const list=messages.filter(m=>m.athleteId===id);
  const latest=list[0];
  const unread=list.filter(m=>m.senderId===id&&!m.readAt).length;
  return {id,name:names.get(id)||"Athlet",latest,unread,severity:risk.get(id)||"good"};
 }).sort((a,b)=>{
  const rank=(x:string)=>x==="critical"?3:x==="warning"?2:x==="info"?1:0;
  return rank(b.severity)-rank(a.severity)||b.unread-a.unread||(b.latest?.createdAt.getTime()||0)-(a.latest?.createdAt.getTime()||0);
 });
 return <main className="admin-content" style={{margin:"0 auto"}}>
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINERBEREICH"}/></span><h1><Copy text={"Nachrichten"}/></h1></div><Link href="/admin" className="ghost"><Copy text={"← ÜBERSICHT"}/></Link></header>
  <article className="panel"><div className="panel-head"><div><span className="eyebrow"><Copy text={"PRIORISIERT"}/></span><h2><Copy text={"Trainer Postfach"}/></h2></div><span className="tag">{threads.length}</span></div>
   <div className="athlete-table">{threads.map(t=><div className="athlete-row" key={t.id}><i className={"risk "+(t.severity==="critical"?"critical":t.severity==="warning"?"warning":"good")}/><strong>{t.name}</strong><span>{t.unread?t.unread+" NEU":"GELESEN"}</span><span><LocalizedValue value={t.latest?.createdAt} format="toLocaleString"/></span><small>{t.latest?.text||t.latest?.kind||"Keine Nachricht"}</small><Link href={`/admin/inbox/${t.id}`} className="secondary"><Copy text={"ÖFFNEN"}/></Link></div>)}</div>
  </article>
 </main>;
}
