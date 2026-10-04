import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import LifestyleClient from "./LifestyleClient";
export const dynamic="force-dynamic";
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;

export default async function Lifestyle(){
  const user=await requireUser();
  const advanced=await hasFeature(user.subscriptionTier,"sleep_advanced");
  const since30=new Date(Date.now()-30*86400000);
  const since7=new Date(Date.now()-7*86400000);
  const [wearables,checks,nextWorkout,score]=await Promise.all([
    prisma.wearableDaily.findMany({where:{userId:user.id,date:{gte:since30}},orderBy:{date:"desc"}}),
    prisma.dailyCheck.findMany({where:{userId:user.id,date:{gte:since30}},orderBy:{date:"desc"}}),
    prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date()}},orderBy:{scheduledAt:"asc"}}),
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}})
  ]);
  const latest=wearables[0];
  const sleep7=wearables.filter(x=>x.date>=since7).map(x=>x.sleepMinutes).filter((v):v is number=>v!=null).map(v=>v/60);
  const sleep30=wearables.map(x=>x.sleepMinutes).filter((v):v is number=>v!=null).map(v=>v/60);
  const s7=avg(sleep7),s30=avg(sleep30);
  const sleepScore=s7==null?null:Math.max(0,Math.min(100,Math.round(s7/8*100)));
  const steps=latest?.steps??checks[0]?.steps??0;
  const stepPct=Math.min(100,Math.round(steps/10000*100));
  const sleepText=latest?.sleepMinutes
    ? Math.floor(latest.sleepMinutes/60)+":"+String(latest.sleepMinutes%60).padStart(2,"0")
    : checks[0]?.sleepHours
      ? String(checks[0].sleepHours)+" h"
      : "—";
  const line=(score?.recovery??100)<60
    ? "Regeneration gehört zum Training. Erhole dich bewusst."
    : nextWorkout
      ? "Den Plan für heute erfüllen. Das macht den Unterschied."
      : "Beständigkeit schlägt Motivation.";
  const ringBackground="conic-gradient(var(--volt) 0 "+stepPct+"%,rgba(255,255,255,.07) "+stepPct+"% 100%)";

  return <main className="sub-shell">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link></header>
    <section className="page-hero compact-hero">
      <div><span className="eyebrow">REGENERATION</span><h1>Regeneration ist Teil der Leistung.</h1><p>Schlaf, Aktivität und Fokus ergänzen das Training, ohne daraus medizinische Diagnosen abzuleiten.</p></div>
      <div className="hero-stat"><span>REGENERATION</span><strong>{score?.recovery??"—"}</strong><small>TRAININGSSIGNAL</small></div>
    </section>
    <section className="lifestyle-grid">
      <article className="panel rested-card">
        <span className="eyebrow">SCHLAF</span><h2>Schlaf</h2>
        <div className="sleep-number"><strong>{sleepText}</strong><span>LETZTE NACHT</span></div>
        {advanced?<><div className="body-stats">
          <div><span>SCHLAFWERT</span><strong>{sleepScore??"—"}</strong><small>0 bis 100</small></div>
          <div><span>7 TAGE</span><strong>{s7?.toFixed(1)??"—"} h</strong><small>Durchschnitt</small></div>
          <div><span>30 TAGE</span><strong>{s30?.toFixed(1)??"—"} h</strong><small>persönlicher Trend</small></div>
        </div><p className="muted">{s7!=null&&s7<7?"Schlaf liegt aktuell unter deinem Ziel. Heute Abend früher runterfahren und die nächste Belastung im Kontext deiner Regeneration betrachten.":"Dein Schlaftrend ist stabil. Regelmäßigkeit beibehalten."}</p></>:<div className="locked-copy"><p className="muted">KOSTENLOS zeigt die Schlafdauer. Qualität, Trend und persönliche Tipps sind PRO.</p><Link href="/pricing" className="secondary">PRO TESTEN</Link></div>}
      </article>
      <article className="panel active-card">
        <span className="eyebrow">AKTIVITÄT</span><h2>Heute bewegen.</h2>
        <div className="activity-ring" style={{background:ringBackground}}><div><strong>{steps.toLocaleString("de-DE")}</strong><small>SCHRITTE</small></div></div>
        <div className="body-stats"><div><span>AKTIVE KCAL</span><strong>{Math.round(latest?.activeCalories??0)||"—"}</strong></div><div><span>VO2MAX</span><strong>{advanced?latest?.vo2max??"—":"PRO"}</strong></div></div>
      </article>
      <LifestyleClient/>
      <article className="panel different-line"><span className="eyebrow">TAGESIMPULS</span><blockquote>“{line}”</blockquote><Link className="secondary" href="/settings">TAGESCHECK</Link></article>
    </section>
  </main>;
}
