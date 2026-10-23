import {Copy,LocalizedValue} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
export const dynamic="force-dynamic";

function dayKey(date:Date){
  return new Intl.DateTimeFormat("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).format(date);
}
function dayNumber(date:Date){return String(date.getDate()).padStart(2,"0")}

export default async function TrainingPage(){
  const user=await requireUser();
  const workouts=await prisma.workout.findMany({where:{userId:user.id},include:{exercises:true,sets:true},orderBy:{scheduledAt:"asc"},take:120});
  const now=new Date();
  const cutoff=new Date(now.getTime()-12*60*60*1000);
  const upcoming=workouts.filter(w=>!w.completedAt&&(!w.scheduledAt||w.scheduledAt>=cutoff));
  const historyAll=workouts.filter(w=>w.completedAt).reverse();
  const history=user.subscriptionTier==="FREE"
    ?historyAll.filter(w=>w.completedAt&&w.completedAt>=new Date(Date.now()-30*86400000))
    :historyAll;
  const days=Array.from({length:7},(_,i)=>{
    const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()+i);
    const end=new Date(date);end.setDate(end.getDate()+1);
    return {date,workouts:upcoming.filter(w=>w.scheduledAt&&w.scheduledAt>=date&&w.scheduledAt<end)};
  });
  return <main className="sub-shell bd-train">
    <header className="sub-top">
      <Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link>
      <nav><Link href="/dashboard"><Copy text="BEGINN"/></Link><Link href="/training" className="active">TRAINING</Link><Link href="/progress"><Copy text="FORTSCHRITT"/></Link><Link href="/coach"><Copy text="TRAINER"/></Link><Link href="/athlete"><Copy text="ATHLET"/></Link></nav>
    </header>
    <section className="bd-train-hero">
      <div className="bd-train-hero-main">
        <span className="eyebrow">01 / TRAINING</span>
        <h1>DEIN PLAN.<br/><em>DEIN ANTRIEB.</em></h1>
        <p><Copy text="Jede Einheit bringt dich weiter. Entscheidend sind dein Rhythmus, deine Technik und deine Entwicklung."/></p>
        <div className="bd-train-shortcuts">
          <Link href="/plans"><Copy text="TRAININGSPLÄNE"/> <span aria-hidden="true">↗</span></Link>
          <Link href="/library"><Copy text="ÜBUNGSBIBLIOTHEK"/> <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <div className="bd-train-hero-numbers">
        <div><span><Copy text="BEREIT"/></span><strong>{upcoming.length.toString().padStart(2,"0")}</strong><small><Copy text="Kommende Einheiten"/></small></div>
        <div><span><Copy text="ERLEDIGT"/></span><strong>{history.length.toString().padStart(2,"0")}</strong><small><Copy text={user.subscriptionTier==="FREE"?"Letzte 30 Tage":"Dein Verlauf"}/></small></div>
        <div className="bd-train-hero-mark" aria-hidden="true">BD<span>↗</span></div>
      </div>
    </section>
    <section className="bd-train-week" aria-label="Trainingswoche">
      <div className="bd-train-section-heading"><div><span className="eyebrow"><Copy text="DEINE TRAININGSWOCHE"/></span><h2><Copy text="WOCHE IM FOKUS."/></h2></div><small><Copy text="Die nächsten sieben Tage"/></small></div>
      <div className="bd-train-days">
        {days.map((day,i)=>{
          const first=day.workouts[0];
          const className="bd-train-day"+(i===0?" is-today":"")+(first?" has-workout":"");
          const contents=<><span className="bd-train-day-label">{dayKey(day.date)}</span><strong>{dayNumber(day.date)}</strong><span className="bd-train-day-count">{first?<Copy text={day.workouts.length===1?"1 EINHEIT":day.workouts.length+" EINHEITEN"}/>:<Copy text="PAUSE"/>}</span><small>{first?.title||<Copy text="Erholung zählt"/>}</small>{first&&<b aria-hidden="true">↗</b>}</>;
          return first
            ?<Link href={`/training/${first.id}`} className={className} key={day.date.toISOString()}>{contents}</Link>
            :<div className={className} key={day.date.toISOString()}>{contents}</div>;
        })}
      </div>
    </section>
    <section className="bd-train-grid">
      <article className="bd-train-next">
        <div className="bd-train-section-heading"><div><span className="eyebrow"><Copy text="KOMMENDE EINHEITEN"/></span><h2><Copy text="NÄCHSTE MOVES."/></h2></div><span className="bd-train-count">{upcoming.length} <Copy text="BEREIT"/></span></div>
        <div className="bd-train-workouts">
          {upcoming.length?upcoming.map((w,i)=><Link className="bd-train-workout" href={`/training/${w.id}`} key={w.id}>
            <span className="bd-train-workout-index">{String(i+1).padStart(2,"0")}</span>
            <div className="bd-train-workout-info"><strong><Copy text={w.title}/></strong><small>{w.scheduledAt?<LocalizedValue value={w.scheduledAt}/>:<Copy text="Ohne Termin"/>}</small></div>
            <span className="bd-train-workout-meta">{w.exercises.length} <Copy text="Übungen"/></span>
            <span className="bd-train-workout-state"><Copy text={w.startedAt?"GESTARTET":"BEREIT"}/></span>
            <b aria-hidden="true">↗</b>
          </Link>):<div className="bd-train-empty"><strong><Copy text="NOCH KEINE EINHEIT GEPLANT."/></strong><p><Copy text="Entdecke Trainingspläne oder lass dir von deinem Trainer einen Plan zuweisen."/></p><Link href="/plans"><Copy text="PLÄNE ANSEHEN"/> ↗</Link></div>}
        </div>
      </article>
      <aside className="bd-train-aside">
        <article className="bd-train-history">
          <div className="bd-train-section-heading"><div><span className="eyebrow"><Copy text="DEINE SPUREN"/></span><h2><Copy text="VERLAUF."/></h2></div><span className="bd-train-count"><Copy text={user.subscriptionTier==="FREE"?"30 TAGE":"UNBEGRENZT"}/></span></div>
          {history.length?history.slice(0,user.subscriptionTier==="FREE"?30:100).map((w,i)=><div className="bd-train-history-row" key={w.id}><span>{String(i+1).padStart(2,"0")}</span><div><strong><Copy text={w.title}/></strong><small><LocalizedValue value={w.completedAt} format="toLocaleDateString"/> · RPE {w.rpe??"Keine Angabe"}</small></div></div>):<p className="bd-train-history-empty"><Copy text="Deine abgeschlossenen Einheiten erscheinen hier."/></p>}
        </article>
        <article className="bd-train-recovery"><span className="eyebrow"><Copy text="REGENERATION"/></span><strong>PAUSE IST<br/>FORTSCHRITT.</strong><p><Copy text="Erholung ist Teil deines Plans. Gib deinem Körper die Zeit, die er braucht."/></p></article>
      </aside>
    </section>
  </main>;
}
