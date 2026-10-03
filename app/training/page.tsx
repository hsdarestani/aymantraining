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
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard">HOME</Link><Link className="active" href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow">TRAINING</span><h1>Dein Plan. Klar. Messbar.</h1><p>Jeder Satz wird gespeichert. RPE, Gewicht und Wiederholungen fließen in deine langfristigen Trends ein.</p><div className="hero-actions"><Link className="secondary" href="/plans">PLÄNE</Link><Link className="secondary" href="/library">ÜBUNGSBIBLIOTHEK</Link></div></div><div className="hero-stat"><span>COMPLETED</span><strong>{history.length}</strong><small>{user.subscriptionTier==="FREE"?"30 TAGE":"HISTORY"}</small></div></section>

    <section className="week-calendar">{days.map((d,i)=><article className={i===0?"day-card today":"day-card"} key={d.date.toISOString()}><span>{dayKey(d.date)}</span><strong>{d.workouts.length?d.workouts.length:"REST"}</strong><small>{d.workouts[0]?.title||"Recovery zählt"}</small></article>)}</section>

    <section className="content-grid" style={{marginTop:22}}><article className="panel big-panel"><div className="panel-head"><div><span className="eyebrow">UPCOMING</span><h2>Nächste Einheiten</h2></div><span className="tag">{upcoming.length} READY</span></div><div className="exercise-list">{upcoming.length?upcoming.map((w,i)=><div className="exercise-row" key={w.id}><span className="exercise-nr">{String(i+1).padStart(2,"0")}</span><div><strong>{w.title}</strong><small>{w.scheduledAt?.toLocaleString("de-DE")||"ohne Termin"}</small></div><span>{w.exercises.length} Übungen</span><span>{w.startedAt?"STARTED":"READY"}</span><Link className="secondary" href={`/training/${w.id}`}>OPEN</Link></div>):<p className="muted">Aktuell ist keine Einheit geplant. Wähle einen Template Plan oder lass dir vom Coach einen persönlichen Plan zuweisen.</p>}</div></article>
      <aside className="stack"><article className="panel"><span className="eyebrow">HISTORY</span><h2>{user.subscriptionTier==="FREE"?"30 Tage":"Unbegrenzt"}</h2>{history.slice(0,user.subscriptionTier==="FREE"?30:100).map(w=><div className="history-row" key={w.id}><strong>{w.title}</strong><span>{w.completedAt?.toLocaleDateString("de-DE")} · RPE {w.rpe??"—"}</span></div>)}</article><article className="panel callout"><span className="signal">RECOVERY COUNTS</span><h2>Pause ist Teil des Plans.</h2><p>Ein geplanter Recovery Tag wird nicht als Versagen gewertet.</p></article></aside>
    </section>
  </main>;
}