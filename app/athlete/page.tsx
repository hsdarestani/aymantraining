
import {Copy,LocalizedElement} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import {levelForScore} from "../../lib/scoring";
export const dynamic="force-dynamic";

function radarPoints(values:number[]){
  const cx=150,cy=150,r=112,n=values.length;
  return values.map((v,i)=>{const angle=-Math.PI/2+i*2*Math.PI/n;const rr=r*Math.max(0,Math.min(100,v))/100;return `${(cx+Math.cos(angle)*rr).toFixed(1)},${(cy+Math.sin(angle)*rr).toFixed(1)}`}).join(" ");
}
function gridPoints(scale:number,n=7){const cx=150,cy=150,r=112*scale;return Array.from({length:n},(_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/n;return `${(cx+Math.cos(angle)*r).toFixed(1)},${(cy+Math.sin(angle)*r).toFixed(1)}`}).join(" ")}

export default async function AthletePage(){
  const user=await requireUser();
  const [score,oldest,details,digital,badges]=await Promise.all([
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.scoreSnapshot.findFirst({where:{userId:user.id,date:{gte:new Date(Date.now()-90*86400000)}},orderBy:{date:"asc"}}),
    hasFeature(user.subscriptionTier,"score_details"),
    hasFeature(user.subscriptionTier,"digital_twin"),
    prisma.badge.findMany({where:{userId:user.id},orderBy:{unlockedAt:"desc"},take:8})
  ]);
  const rows=[["KRAFT",score?.strength],["AUSDAUER",score?.endurance],["ATHLETIK",score?.athleticism],["BEWEGLICHKEIT",score?.mobility],["REGENERATION",score?.recovery],["ERNÄHRUNG",score?.fuel],["BESTÄNDIGKEIT",score?.consistency]] as const;
  const values=rows.map(([,v])=>v??0);
  const days=oldest&&score?Math.max(1,(score.date.getTime()-oldest.date.getTime())/86400000):0;
  const daily=days?((score?.total??0)-(oldest?.total??0))/days:0;
  const hasTrend=Boolean(oldest&&score&&oldest.date.getTime()<score.date.getTime());
  const projection=Math.max(0,Math.min(100,Math.round((score?.total??0)+daily*84)));

  return <main className="sub-shell">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text={"BEGINN"}/></Link><Link href="/training">TRAINING</Link><Link href="/progress"><Copy text={"FORTSCHRITT"}/></Link><Link href="/coach"><Copy text={"TRAINER"}/></Link><Link className="active" href="/athlete"><Copy text={"ATHLET"}/></Link></nav></header>
    <section className="page-hero"><div><span className="eyebrow"><Copy text={"ATHLETENPROFIL"}/></span><h1><Copy text={"Von Training zu Identität."}/></h1><p><Copy text={"Deine Entwicklung über alle Säulen. Prognosen werden als Trend und nie als Garantie dargestellt."}/></p></div><div className="hero-stat"><span><Copy text={"STUFE"}/></span><strong>{score?.total??0}%</strong><small>{levelForScore(score?.total??0)}</small></div></section>

    <section className="athlete-grid">
      <article className={digital?"panel twin-panel":"panel twin-panel twin-preview"}>
        <span className="tag"><Copy text={digital?"DIGITALES ABBILD":"PRO VORSCHAU"}/></span>
        <div className="digital-radar">
          <LocalizedElement as="svg" viewBox="0 0 300 300" role="img" aria-label="Radar des digitalen Athletenabbilds">
            {[.25,.5,.75,1].map(s=><polygon key={s} points={gridPoints(s)} className="radar-grid"/> )}
            {digital&&<polygon points={radarPoints(values)} className="radar-shape"/>}
          </LocalizedElement>
          {!digital&&<div className="radar-lock">PRO</div>}
        </div>
        <h2><Copy text={"DIGITALES ATHLETENABBILD"}/></h2>
        <p className="muted"><Copy text={digital?(hasTrend?`Wenn dein aktueller Trend stabil bleibt, liegt die 12 Wochen Projektion bei ca. ${projection} %. Das ist eine Trendanzeige, keine Garantie.`:"Für eine Trend Projektion fehlen noch Messpunkte an unterschiedlichen Tagen."):"Radar, Verlauf, Zielprofil und Trend Projektion sind PRO."}/></p>
        {!digital&&<Link href="/pricing" className="secondary"><Copy text={"PRO TESTEN"}/></Link>}
      </article>

      <article className="panel"><span className="eyebrow"><Copy text={"DEINE LEISTUNGSBEREICHE"}/></span><h2><Copy text={"Leistungsprofil"}/></h2>
        {details?<div className="athlete-bars">{rows.map(([name,val])=><div key={name}><span>{name}</span><div className="weight-track"><i style={{width:`${val??0}%`}}/></div><strong><Copy text={val??"Keine Angabe"}/></strong></div>)}</div>:<div className="locked-copy"><p className="muted"><Copy text={"KOSTENLOS zeigt deinen Gesamtwert. Teilwerte und Erklärungen werden mit PRO freigeschaltet."}/></p><Link href="/pricing" className="secondary"><Copy text={"DETAILS FREISCHALTEN"}/></Link></div>}
      </article>
    </section>

    <section className="panel badge-panel"><div><span className="eyebrow"><Copy text={"ABZEICHEN"}/></span><h2><Copy text={"Deine Meilensteine"}/></h2></div><div className="badge-strip">{badges.length?badges.map(b=><span key={b.id}><b>◆</b>{b.name}</span>):<span className="muted"><Copy text={"Dein erstes Abzeichen wartet auf dich."}/></span>}</div></section>
    <section className="share-card panel"><div><span className="eyebrow"><Copy text={"GEMEINSCHAFT UND TEILEN"}/></span><h2><Copy text={"Aufgaben, Fortschrittsbild und Einladung"}/></h2></div><div className="share-actions"><Link className="secondary" href="/athlete/photos"><Copy text={"ATHLETENFOTOS"}/></Link><Link className="secondary" href="/api/story" target="_blank"><Copy text={"FORTSCHRITTSBILD"}/></Link><Link className="primary compact" href="/community"><Copy text={"ÖFFNEN"}/></Link></div></section>
  </main>;
}
