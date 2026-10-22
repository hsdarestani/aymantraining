import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {getMilestoneSnapshot} from "../../lib/milestone-service";
import {milestonesEnabled} from "../../lib/milestone-contract";
import "./milestones.css";
export const dynamic="force-dynamic";
export default async function Milestones(){
 const user=await requireUser();
 const data=milestonesEnabled()?await getMilestoneSnapshot(user.id):null;
 return <main className="sub-shell bd-milestones">
  <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard">STARTSEITE</Link><Link href="/progress">FORTSCHRITT</Link></nav></header>
  <section className="milestone-hero"><span>DEIN ECHTER FORTSCHRITT</span><h1>JEDER TAG.<br/>EIN SCHRITT.</h1>
   <p>Erfolge entstehen durch dokumentiertes Training, echte Tageschecks und im Voraus geplante Erholung. Das reine Öffnen der Anwendung zählt nicht.</p></section>
  {!data?<article className="milestone-card"><h2>Dein Fortschrittsbereich wird vorbereitet.</h2><p>Deine bisherigen Trainingsdaten bleiben unverändert.</p></article>:<>
   <section className="milestone-grid">
    <article className="milestone-card milestone-highlight"><small>DEINE AKTUELLE SERIE</small><strong>{data.streak}<span> TAGE</span></strong>
      <p>{data.todayStatus==="PLANNED_RECOVERY"?"Heute ist eine zuvor geplante Erholung berücksichtigt.":data.todayStatus==="ACHIEVED"?"Heute hast du einen echten Schritt dokumentiert.":"Heute steht noch kein qualifizierender Schritt fest."}</p></article>
    <article className="milestone-card"><small>DEINE LÄNGSTE SERIE</small><strong>{data.best}<span> TAGE</span></strong><p>Aus überprüften Einträgen der letzten 120 Tage.</p></article>
    <article className="milestone-card"><small>BEENDETE EINHEITEN</small><strong>{data.workoutCount}</strong><p>Tatsächlich abgeschlossene Trainingseinheiten, keine bloßen Planungen.</p></article>
   </section>
   <section className="milestone-card"><h2>DEINE MEILENSTEINE.</h2>
    {data.awards.length===0?<p>Der erste bestätigte Erfolg wartet auf dich.</p>:
    <div className="milestone-awards">{data.awards.map(a=><article key={a.id}><small>{a.visualIntensity==="FULL"?"GROSSER ERFOLG":a.visualIntensity==="MEDIUM"?"MEILENSTEIN":"ERFOLG"}</small>
      <h3>{a.title}</h3><p>{a.message}</p><time>{a.achievedAt.toLocaleDateString("de-DE")}</time></article>)}</div>}
   </section>
   <section className="milestone-card"><h2>DEIN NÄCHSTER SCHRITT.</h2>
    {data.next.length===0?<p>Alle derzeit verfügbaren Ziele erreicht.</p>:<div className="milestone-next">{data.next.map(rule=><div key={rule.key}>
     <div><strong>{rule.title}</strong><span>{Math.min(rule.progress,rule.threshold)} / {rule.threshold}</span></div>
     <div className="milestone-track"><div style={{width:Math.max(0,Math.min(100,rule.progress/rule.threshold*100))+"%"}}/></div></div>)}</div>}
   </section>
  </>}
  <Link href="/training" className="milestone-link">ZUM TRAINING →</Link>
 </main>;
}
