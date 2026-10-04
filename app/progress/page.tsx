import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import ProgressClient from "./ProgressClient";
import BeforeAfter from "./BeforeAfter";
export const dynamic="force-dynamic";

export default async function ProgressPage(){
  const user=await requireUser();
  const [scores,metrics,tests,photos,details,timeline]=await Promise.all([
    prisma.scoreSnapshot.findMany({where:{userId:user.id},orderBy:{date:"desc"},take:30}),
    prisma.bodyMetric.findMany({where:{userId:user.id},orderBy:{date:"desc"},take:30}),
    prisma.performanceTest.findMany({where:{userId:user.id},include:{results:true},orderBy:{completedAt:"desc"},take:30}),
    prisma.mediaAsset.findMany({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"},take:user.subscriptionTier==="FREE"?3:60}),
    hasFeature(user.subscriptionTier,"score_details"),
    hasFeature(user.subscriptionTier,"performance_timeline")
  ]);
  const current=scores[0];

  return <main className="sub-shell">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard">START</Link><Link href="/training">TRAINING</Link><Link className="active" href="/progress">FORTSCHRITT</Link><Link href="/coach">TRAINER</Link><Link href="/athlete">ATHLET</Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow">FORTSCHRITT</span><h1>Leistung wird sichtbar.</h1><p>Leistungswert, Tests und Körperdaten zeigen die Entwicklung über Zeit. Keine Prognose wird als Garantie dargestellt.</p></div><div className="hero-stat"><span>LEISTUNGSWERT</span><strong>{current?.total??0}</strong><small>{details?`${scores.length} MESSPUNKTE`:"KOSTENLOSER GESAMTWERT"}</small></div></section>

    <section className="progress-cards">
      <article className={details?"panel chart-panel":"panel chart-panel locked-chart"}>
        <div className="panel-head"><div><span className="eyebrow">VERLAUF</span><h2>{details?"Letzte Messpunkte":"PRO Verlauf"}</h2></div></div>
        {details?<div className="fake-chart">{scores.slice().reverse().map(s=><i key={s.id} style={{height:`${Math.max(4,s.total)}%`}}/>)}</div>:<div className="locked-copy"><p className="muted">KOSTENLOS zeigt den aktuellen Gesamtwert. Verlauf und Erklärungen sind PRO.</p><Link href="/pricing" className="secondary">PRO TESTEN</Link></div>}
      </article>
      <article className="panel"><span className="eyebrow">KÖRPER</span><h2>Aktuell</h2><div className="body-stats"><div><span>GEWICHT</span><strong>{metrics[0]?.weightKg??"—"} kg</strong><small>{metrics[0]?.date.toLocaleDateString("de-DE")??"keine Daten"}</small></div><div><span>TAILLE</span><strong>{metrics[0]?.waistCm??"—"} cm</strong><small>letzter Wert</small></div><div><span>FOTOS</span><strong>{photos.length}</strong><small>{user.subscriptionTier==="FREE"?"max. 3":"privat"}</small></div></div></article>
    </section>

    <article className="panel timeline-panel">
      <div className="panel-head"><div><span className="eyebrow">BE DIFFERENT TEST</span><h2>{timeline?"Leistungsverlauf":"Starttest"}</h2></div><Link className="secondary" href="/tests">TESTS ÖFFNEN</Link></div>
      {timeline?<div className="test-timeline">{tests.length?tests.map((t,i)=><div className="test-card" key={t.id}><span>TEST {String(tests.length-i).padStart(2,"0")}</span><strong>{t.results[0]?.value??"—"}</strong><small>{t.results[0]?.metric??t.name} {t.results[0]?.unit??""}</small><b>{t.completedAt?.toLocaleDateString("de-DE")}</b></div>):<p className="muted">Noch kein Leistungstest gespeichert.</p>}</div>:<div className="locked-copy"><p className="muted">{tests[0]?"Dein Starttest ist gespeichert. Wiederholungstests und Verlauf sind PRO.":"Dein Starttest erscheint nach dem Onboarding hier."}</p><Link href="/pricing" className="secondary">VERLAUF FREISCHALTEN</Link></div>}
    </article>

    {user.subscriptionTier!=="FREE"&&photos.length>=2&&<BeforeAfter beforeId={photos[photos.length-1].id} afterId={photos[0].id}/>}
    <ProgressClient/>
  </main>;
}
