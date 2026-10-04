import Link from "next/link";
import {prisma} from "../../../lib/db";
export const dynamic="force-dynamic";
const pct=(n:number,d:number)=>d?Math.round(n/d*1000)/10:0;

export default async function Subscriptions(){
 const now=new Date(),d7=new Date(Date.now()-7*86400000),d30=new Date(Date.now()-30*86400000),d60=new Date(Date.now()-60*86400000);
 const [users,subs,wearableUsers,waitlist,messages,settingsRow]=await Promise.all([
   prisma.user.findMany({where:{role:"ATHLETE"},select:{id:true,createdAt:true,onboardingCompleted:true,subscriptionTier:true,sessions:{select:{lastSeenAt:true}}}}),
   prisma.subscription.findMany({orderBy:{updatedAt:"desc"},take:500}),
   prisma.wearableDaily.groupBy({by:["userId"],_count:true}),
   prisma.waitlistEntry.count({where:{status:"WAITING"}}),
   prisma.message.findMany({where:{createdAt:{gte:d30}},orderBy:{createdAt:"asc"},take:5000}),
   prisma.systemSetting.findUnique({where:{key:"app_settings"}})
 ]);
 const total=users.length,onboarding=users.filter(x=>x.onboardingCompleted).length,wearables=new Set(wearableUsers.map(x=>x.userId)).size;
 const eligible7=users.filter(x=>x.createdAt<=d7),retained7=eligible7.filter(x=>x.sessions.some(s=>s.lastSeenAt>=new Date(x.createdAt.getTime()+7*86400000))).length;
 const eligible30=users.filter(x=>x.createdAt<=d30),retained30=eligible30.filter(x=>x.sessions.some(s=>s.lastSeenAt>=new Date(x.createdAt.getTime()+30*86400000))).length;
 const pro=users.filter(x=>x.subscriptionTier==="PRO"||x.subscriptionTier==="ELITE").length;
 const trialUsers=new Set(subs.filter(s=>s.provider==="internal_trial").map(s=>s.userId));
 const storeSubs=subs.filter(s=>["app_store","google_play"].includes(s.provider));
 const paidUsers=new Set(storeSubs.filter(s=>["active","canceled"].includes(s.status)&&(!s.renewsAt||s.renewsAt>now)).map(s=>s.userId));
 const trialPaid=[...trialUsers].filter(id=>paidUsers.has(id)).length;
 const expired30=storeSubs.filter(s=>["expired","revoked"].includes(s.status)&&s.updatedAt>=d30).length;
 const activePaid=paidUsers.size;
 const athleteMessages=messages.filter(m=>m.senderId===m.athleteId);
 const coachMessages=messages.filter(m=>m.senderId!==m.athleteId);
 const responseHours:number[]=[];
 for(const a of athleteMessages){const reply=coachMessages.find(c=>c.athleteId===a.athleteId&&c.createdAt>a.createdAt);if(reply)responseHours.push((reply.createdAt.getTime()-a.createdAt.getTime())/3600000)}
 const avgResponse=responseHours.length?responseHours.reduce((a,b)=>a+b,0)/responseHours.length:null;
 const under24=responseHours.length?pct(responseHours.filter(x=>x<=24).length,responseHours.length):0;
 const settings={proCapacity:50,proMonthly:39.99,...((settingsRow?.value as any)||{})};
 const estimatedMrr=Math.round(activePaid*Number(settings.proMonthly)*100)/100;
 const latest=subs.slice(0,50);
 return <main className="admin-content" style={{margin:"0 auto"}}>
   <header className="admin-header"><div><span className="eyebrow">TRAINERBEREICH</span><h1>Subscriptions & KPIs</h1></div><Link href="/admin" className="ghost">← Dashboard</Link></header>
   <div className="kpis"><div><span>ATHLETS</span><strong>{total}</strong><small>gesamt</small></div><div><span>PRO</span><strong>{pro}</strong><small>{pct(pro,total)} %</small></div><div><span>WAITLIST</span><strong>{waitlist}</strong><small>Kapazität {settings.proCapacity}</small></div><div><span>EST. MRR</span><strong>{estimatedMrr.toLocaleString("de-DE")} €</strong><small>vor Store Gebühren</small></div></div>
   <section className="kpi-target-grid">
     {[
       ["ONBOARDING",pct(onboarding,total),70],
       ["WEARABLE",pct(wearables,total),50],
       ["D7 RETENTION",pct(retained7,eligible7.length),35],
       ["D30 RETENTION",pct(retained30,eligible30.length),20],
       ["FREE TO PRO",pct(pro,total),3],
       ["TRIAL TO PAID",pct(trialPaid,trialUsers.size),40],
       ["MONTHLY CHURN",pct(expired30,Math.max(1,activePaid+expired30)),8],
       ["TRAINER ≤ 24H",under24,100]
     ].map(([label,value,target])=><article className="panel kpi-target" key={String(label)}><span className="eyebrow">{label}</span><strong>{Number(value).toFixed(1)}%</strong><div className="kpi-track"><i style={{width:`${Math.min(100,Number(value))}%`}}/></div><small>Ziel {label==="MONTHLY CHURN"?"<":"≥"} {target}%</small></article>)}
   </section>
   <article className="panel"><div className="panel-head"><div><span className="eyebrow">TRAINERBETREUUNG</span><h2>Antwortzeit</h2></div><span className="tag">{avgResponse==null?"KEINE DATEN":`${avgResponse.toFixed(1)} H AVG`}</span></div><p className="muted">Gemessen von der Nachricht des Athleten bis zur nächsten Antwort des Trainers innerhalb der letzten 30 Tage.</p></article>
   <article className="panel"><span className="eyebrow">BILLING EVENTS</span><h2>ANBIETERÜBERSICHT</h2>{latest.length?latest.map(s=><div className="history-row" key={s.id}><strong>{s.provider} · {s.tier}</strong><span>{s.status} · {s.renewsAt?.toLocaleDateString("de-DE")||"—"}</span></div>):<p className="muted">Noch keine Store Subscription Events.</p>}</article>
 </main>;
}