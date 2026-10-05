
import {Copy} from "../../components/Locale";


import Link from "next/link";
import {prisma} from "../../../lib/db";
export const dynamic="force-dynamic";

function pct(n:number,d:number){return d?Math.round(n/d*1000)/10:0}
function metric(label:string,value:string,target:string,ok:boolean){return <div className="kpi-card"><span><Copy text={label}/></span><strong>{value}</strong><small>{target}</small><i className={ok?"risk good":"risk warning"}/></div>}

export default async function Kpi(){
 const now=new Date(),d7=new Date(Date.now()-7*86400000),d30=new Date(Date.now()-30*86400000);
 const athletes=await prisma.user.findMany({where:{role:"ATHLETE"},select:{id:true,createdAt:true,onboardingCompleted:true,subscriptionTier:true,sessions:{select:{lastSeenAt:true}},wearableConnections:{where:{status:"CONNECTED"},select:{id:true}}}});
 const total=athletes.length,onboard=athletes.filter(x=>x.onboardingCompleted).length,wear=athletes.filter(x=>x.wearableConnections.length).length,pro=athletes.filter(x=>x.subscriptionTier!=="FREE").length;
 const eligible7=athletes.filter(x=>x.createdAt<=d7),ret7=eligible7.filter(x=>x.sessions.some(s=>s.lastSeenAt>=new Date(x.createdAt.getTime()+7*86400000))).length;
 const eligible30=athletes.filter(x=>x.createdAt<=d30),ret30=eligible30.filter(x=>x.sessions.some(s=>s.lastSeenAt>=new Date(x.createdAt.getTime()+30*86400000))).length;
 const messages=await prisma.message.findMany({orderBy:{createdAt:"asc"},take:5000});
 const athleteSent=messages.filter(m=>m.senderId===m.athleteId);
 const responseHours:number[]=[];
 for(const m of athleteSent){const r=messages.find(x=>x.athleteId===m.athleteId&&x.senderId!==x.athleteId&&x.createdAt>m.createdAt);if(r)responseHours.push((r.createdAt.getTime()-m.createdAt.getTime())/3600000)}
 const avgResponse=responseHours.length?responseHours.reduce((a,b)=>a+b,0)/responseHours.length:null;
 return <main className="admin-content" style={{margin:"0 auto"}}>
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"ERFOLGSKENNZAHLEN"}/></span><h1><Copy text={"Produkt KPI"}/></h1></div><Link className="ghost" href="/admin"><Copy text={"← ÜBERSICHT"}/></Link></header>
  <div className="kpis">
   {metric("ONBOARDING",pct(onboard,total)+"%","Ziel über 70 %",pct(onboard,total)>70)}
   {metric("GERÄT VERBUNDEN",pct(wear,total)+"%","Ziel über 50 %",pct(wear,total)>50)}
   {metric("BINDUNG NACH 7 TAGEN",pct(ret7,eligible7.length)+"%","Ziel über 35 %",pct(ret7,eligible7.length)>35)}
   {metric("BINDUNG NACH 30 TAGEN",pct(ret30,eligible30.length)+"%","Ziel über 20 %",pct(ret30,eligible30.length)>20)}
  </div>
  <div className="kpis">
   {metric("KOSTENLOS ZU PRO",pct(pro,total)+"%","Ziel 3 bis 8 %",pct(pro,total)>=3&&pct(pro,total)<=8)}
   {metric("TRAINER ANTWORTZEIT",avgResponse==null?"Keine Daten":(Math.round(avgResponse*10)/10)+" h","Ziel unter 24 h",avgResponse!=null&&avgResponse<24)}
   {metric("ATHLETEN",String(total),"Aktive Produktbasis",total>0)}
   {metric("PRO UND ELITE",String(pro),"Kapazität beobachten",true)}
  </div>
  <section className="admin-cols"><article className="panel"><span className="eyebrow"><Copy text={"ZAHLUNGSMETRIKEN"}/></span><h2><Copy text={"Bewusst ausgenommen"}/></h2><p className="muted"><Copy text={"Testphase zu Bezahlabo und Kündigungsrate werden erst aktiviert, wenn die Store Zahlung final angeschlossen ist. Alle anderen KPI werden aus echten Produktdaten berechnet."}/></p></article><article className="panel"><span className="eyebrow"><Copy text={"MESSUNG"}/></span><h2><Copy text={"Keine erfundenen Zahlen"}/></h2><p className="muted"><Copy text={"Bindung basiert auf realer Sitzungsaktivität. Die Quote verbundener Geräte basiert auf aktiven Verbindungen. Die Antwortzeit des Trainers basiert auf echten Nachrichtenpaaren."}/></p></article></section>
 </main>;
}
