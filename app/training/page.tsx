
import {Copy,LocalizedValue} from "../components/Locale";


import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
export const dynamic="force-dynamic";

function dayKey(d:Date){return new Intl.DateTimeFormat("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).format(d)}

export default async function TrainingPage(){
  const user=await requireUser();
  const workouts=await prisma.workout.findMany({where:{userId:user.id},include:{exercises:true,sets:true},orderBy:{scheduledAt:"asc"},take:120});
  const now=new Date();const cutoff=new Date(now.getTime()-12*60*60*1000);
  const upcoming=workouts.filter(w=>!w.completedAt&&(!w.scheduledAt||w.scheduledAt>=cutoff));
  const historyAll=workouts.filter(w=>w.completedAt).reverse();
  const history=user.subscriptionTier==="FREE"?historyAll.filter(w=>w.completedAt&&w.completedAt>=new Date(Date.now()-30*86400000)):historyAll;
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);const end=new Date(d);end.setDate(end.getDate()+1);return{date:d,workouts:upcoming.filter(w=>w.scheduledAt&&w.scheduledAt>=d&&w.scheduledAt<end)}});

  return <main className="sub-shell">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text={"BEGINN"}/></Link><Link className="active" href="/training">TRAINING</Link><Link href="/progress"><Copy text={"FORTSCHRITT"}/></Link><Link href="/coach"><Copy text={"TRAINER"}/></Link><Link href="/athlete"><Copy text={"ATHLET"}/></Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow">TRAINING</span><h1><Copy text={"Dein Plan. Klar. Messbar."}/></h1><p><Copy text={"Jeder Satz wird gespeichert. RPE, Gewicht und Wiederholungen fließen in deine langfristigen Trends ein."}/></p><div className="hero-actions"><Link className="secondary" href="/plans"><Copy text={"PLÄNE"}/></Link><Link className="secondary" href="/library"><Copy text={"ÜBUNGSBIBLIOTHEK"}/></Link></div></div><div className="hero-stat"><span><Copy text={"ABGESCHLOSSEN"}/></span><strong>{history.length}</strong><small><Copy text={user.subscriptionTier==="FREE"?"30 TAGE":"VERLAUF"}/></small></div></section>

    <section className="week-calendar">{days.map((d,i)=><article className={i===0?"day-card today":"day-card"} key={d.date.toISOString()}><span>{dayKey(d.date)}</span><strong><Copy text={d.workouts.length?d.workouts.length:"PAUSE"}/></strong><small>{d.workouts[0]?.title||"Regeneration zählt"}</small></article>)}</section>

    <section className="content-grid" style={{marginTop:22}}><article className="panel big-panel"><div className="panel-head"><div><span className="eyebrow"><Copy text={"KOMMENDE EINHEITEN"}/></span><h2><Copy text={"Nächste Einheiten"}/></h2></div><span className="tag">{upcoming.length}<Copy text={"BEREIT"}/></span></div><div className="exercise-list">{upcoming.length?upcoming.map((w,i)=><div className="exercise-row" key={w.id}><span className="exercise-nr">{String(i+1).padStart(2,"0")}</span><div><strong><Copy text={w.title}/></strong><small>{w.scheduledAt?.toLocaleString("de-DE")||"ohne Termin"}</small></div><span>{w.exercises.length}<Copy text={"Übungen"}/></span><span><Copy text={w.startedAt?"GESTARTET":"BEREIT"}/></span><Link className="secondary" href={`/training/${w.id}`}><Copy text={"ÖFFNEN"}/></Link></div>):<p className="muted"><Copy text={"Aktuell ist keine Einheit geplant. Wähle einen Trainingsvorlage oder lass dir vom Trainer einen persönlichen Plan zuweisen."}/></p>}</div></article>
      <aside className="stack"><article className="panel"><span className="eyebrow"><Copy text={"VERLAUF"}/></span><h2><Copy text={user.subscriptionTier==="FREE"?"30 Tage":"Unbegrenzt"}/></h2>{history.slice(0,user.subscriptionTier==="FREE"?30:100).map(w=><div className="history-row" key={w.id}><strong><Copy text={w.title}/></strong><span><LocalizedValue value={w.completedAt} format="toLocaleDateString"/> · RPE {w.rpe??"Keine Angabe"}</span></div>)}</article><article className="panel callout"><span className="signal"><Copy text={"REGENERATION ZÄHLT"}/></span><h2><Copy text={"Pause ist Teil des Plans."}/></h2><p><Copy text={"Ein geplanter Regenerationstag wird nicht als Versagen gewertet."}/></p></article></aside>
    </section>
  </main>;
}