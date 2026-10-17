
import {Copy,LocalizedValue} from "../components/Locale";




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
  const series=scores.slice().reverse();
  const chartPoints=series.map((s,i)=>({
    x:series.length===1?400:40+(i/(series.length-1))*720,
    y:234-Math.max(0,Math.min(100,s.total??0))*1.85,
    value:s.total??0,
    date:s.date
  }));
  const chartPolyline=chartPoints.map(p=>p.x.toFixed(2)+","+p.y.toFixed(2)).join(" ");
  const change=scores.length>=2?(scores[0].total??0)-(scores[scores.length-1].total??0):null;
  return <main className="sub-shell bd-progress">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text="BEGINN"/></Link><Link href="/training">TRAINING</Link><Link className="active" href="/progress"><Copy text="FORTSCHRITT"/></Link><Link href="/coach"><Copy text="TRAINER"/></Link><Link href="/athlete"><Copy text="ATHLET"/></Link></nav></header>
    <section className="bd-progress-hero">
      <div className="bd-progress-hero-main">
        <span className="bd-section-serial">03 / <Copy text="DEINE ENTWICKLUNG"/></span>
        <h1>DEIN GRIND.<br/><em>DEINE SPUREN.</em></h1>
        <p><Copy text="Hier zählt, was du wirklich erreicht hast. Messwerte, Tests und Entwicklung im eigenen Tempo."/></p>
      </div>
      <div className="bd-progress-score">
        <span><Copy text="AKTUELLER LEISTUNGSWERT"/></span>
        <div><strong>{current?.total??"—"}</strong><small>{current?" / 100":""}</small></div>
        <p><Copy text={details?`${scores.length} MESSPUNKTE`:"GESAMTWERT"}/></p>
      </div>
    </section>
    <section className="bd-progress-record">
      <header className="bd-progress-record-head"><div><span className="bd-section-serial">01 / <Copy text="DEIN VERLAUF"/></span><h2><Copy text="NICHT GESCHÄTZT. GEMESSEN."/></h2></div>
        {details&&change!==null&&<div className="bd-progress-delta"><span><Copy text="VERÄNDERUNG"/></span><strong>{change>0?"+":""}{change}</strong></div>}
      </header>
      {details&&series.length>0?<div className="bd-progress-chart">
        <svg viewBox="0 0 800 260" preserveAspectRatio="none" role="img" aria-label="Tatsächlich gemessene Leistungswerte im zeitlichen Verlauf">
          <defs><linearGradient id="bd-progress-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d4ff00" stopOpacity=".23"/><stop offset="1" stopColor="#d4ff00" stopOpacity="0"/></linearGradient></defs>
          {[0,25,50,75,100].map((level)=><g key={level}><line x1="38" y1={234-level*1.85} x2="766" y2={234-level*1.85} stroke="#344039" strokeWidth=".8" strokeDasharray="2 7"/><text x="0" y={238-level*1.85} fill="#8c9e93" fontSize="11">{level}</text></g>)}
          {chartPoints.length>1&&<polygon points={`40,239 ${chartPolyline} 760,239`} fill="url(#bd-progress-fill)"/>}
          {chartPoints.length>1&&<polyline fill="none" stroke="#d4ff00" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={chartPolyline}/>}
          {chartPoints.map((pt,i)=><circle key={i} cx={pt.x} cy={pt.y} r={i===chartPoints.length-1?7:3} fill={i===chartPoints.length-1?"#d4ff00":"#101817"} stroke="#d4ff00" strokeWidth="2"/>)}
        </svg>
        <div className="bd-progress-chart-footer">
          <span>{series[0]?.date.toLocaleDateString("de-DE")}</span><span><Copy text="ECHTE MESSPUNKTE"/></span><span>{series[series.length-1]?.date.toLocaleDateString("de-DE")}</span>
        </div>
      </div>:details?<div className="bd-progress-no-data"><Copy text="Noch keine Messwerte vorhanden. Dein Verlauf startet mit dem ersten gespeicherten Wert."/></div>:<div className="bd-progress-locked">
        <span aria-hidden="true">↗</span><strong><Copy text="DEIN VERLAUF WARTET."/></strong><p><Copy text="Deinen Gesamtwert siehst du bereits. Detailverlauf und Erklärungen gibt es mit PRO."/></p><Link href="/pricing"><Copy text="DETAILS ANSEHEN"/> ↗</Link>
      </div>}
    </section>
    <section className="bd-progress-measurements">
      <div className="bd-progress-section-title"><span className="bd-section-serial">02 / <Copy text="KÖRPERDATEN"/></span><h2>FAKTEN STATT GEFÜHL.</h2></div>
      <div className="bd-progress-facts">
        <div><span><Copy text="GEWICHT"/></span><strong>{metrics[0]?.weightKg??"—"}<small>{metrics[0]?.weightKg==null?"":" kg"}</small></strong><p>{metrics[0]?.date.toLocaleDateString("de-DE")??"Keine Angabe"}</p></div>
        <div><span><Copy text="TAILLE"/></span><strong>{metrics[0]?.waistCm??"—"}<small>{metrics[0]?.waistCm==null?"":" cm"}</small></strong><p><Copy text="LETZTER WERT"/></p></div>
        <div><span><Copy text="FOTOS"/></span><strong>{photos.length.toString().padStart(2,"0")}</strong><p><Copy text={user.subscriptionTier==="FREE"?"MAXIMAL 3":"PRIVAT"}/></p></div>
      </div>
    </section>
    <section className="bd-progress-tests">
      <div className="bd-progress-section-title"><span className="bd-section-serial">03 / BE DIFFERENT TEST</span><h2><Copy text={timeline?"DEINE TESTHISTORIE.":"DEIN STARTPUNKT."}/></h2><Link href="/tests"><Copy text="TESTS ÖFFNEN"/> ↗</Link></div>
      {timeline?<div className="bd-progress-test-list">{tests.length?tests.map((t,i)=><div key={t.id} className="bd-progress-test-row">
        <span className="bd-progress-test-index">{String(tests.length-i).padStart(2,"0")}</span>
        <div><span><Copy text={t.name}/></span><strong><Copy text={t.results[0]?.value??"Keine Angabe"}/>{t.results[0]?.unit?" "+t.results[0].unit:""}</strong><small>{t.results[0]?.metric??<Copy text="LEISTUNGSTEST"/>}</small></div>
        <time><LocalizedValue value={t.completedAt} format="toLocaleDateString"/></time>
      </div>):<p className="bd-progress-no-data"><Copy text="Noch kein Leistungstest gespeichert."/></p>}</div>:<div className="bd-progress-locked compact">
        <strong><Copy text="DEIN ERSTER TEST ZÄHLT."/></strong><p><Copy text={tests[0]?"Dein Starttest ist gespeichert. Weitere Tests und Verlauf sind mit PRO verfügbar.":"Dein Starttest erscheint nach dem Onboarding hier."}/></p><Link href="/pricing"><Copy text="VERLAUF ANSEHEN"/> ↗</Link>
      </div>}
    </section>

    {user.subscriptionTier!=="FREE"&&photos.length>=2&&<BeforeAfter beforeId={photos[photos.length-1].id} afterId={photos[0].id}/>}
    <ProgressClient/>
  </main>;
}
