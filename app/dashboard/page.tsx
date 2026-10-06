
import {Copy,LocalizedValue} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {levelForScore} from "../../lib/scoring";
import {dateOnly} from "../../lib/http";
import {hasFeature} from "../../lib/entitlements";
export const dynamic="force-dynamic";
function v(x:number|null|undefined){return x==null?"Keine Angabe":Math.round(x)}

export default async function Dashboard(){
  const user=await requireUser();
  const [score,check,wearable,nextWorkout,recs,scoreDetails,radarFull]=await Promise.all([
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:dateOnly()}}}),
    prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*60*60*1000)}},orderBy:{scheduledAt:"asc"}}),
    prisma.recommendation.findMany({where:{userId:user.id,date:dateOnly()},orderBy:{createdAt:"desc"},take:3}),
    hasFeature(user.subscriptionTier,"score_details"),
    hasFeature(user.subscriptionTier,"coach_radar_full")
  ]);
  const total=score?.total??0;
  const pillars=[["KRAFT",score?.strength],["AUSDAUER",score?.endurance],["ATHLETIK",score?.athleticism],["BEWEGLICHKEIT",score?.mobility],["REGENERATION",score?.recovery],["ERNÄHRUNG",score?.fuel],["BESTÄNDIGKEIT",score?.consistency]] as const;
  const rec=recs[0];

  return <main className="shell">
    <header className="topbar"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><div className="top-actions"><Link href="/report" className="ghost"><Copy text={"Wochenbericht"}/></Link><Link href="/settings" className="ghost"><Copy text={"Einstellungen"}/></Link><div className="avatar">{(user.name||"A").slice(0,2).toUpperCase()}</div></div></header>

    <section className="athlete-intro"><div><span className="eyebrow" lang="en">BUILD YOUR ATHLETE</span><h1><Copy text="GUTEN MORGEN,"/> {user.name||"Athlet"}.</h1></div><span className="intro-note"><Copy text="Deine Daten werden zu einer klaren Entscheidung für heute."/></span></section>
    <section className="athlete-cockpit">
      <article className="score-command"><div><span className="eyebrow" lang="en">BE DIFFERENT SCORE</span><h2><Copy text="Dein Athlet."/></h2><span className="level">{levelForScore(total)}</span><p><Copy text="Du trainierst nicht. Du entwickelst dich."/></p><div className="live"><i/><Copy text="DATEN VOLLSTÄNDIG"/> {score?.completeness??0}%</div></div><div className="score-ring" role="img" aria-label={`BE DIFFERENT ${total}%`} style={{background:`conic-gradient(var(--volt) 0 ${total}%, #303b42 ${total}% 100%)`}}><div className="score-inner"><strong>{total}<span className="score-unit">%</span></strong><small>DIFFERENT</small></div></div></article>
      <article className="panel today-command"><div className="command-footer"><span className="eyebrow"><Copy text="HEUTIGES TRAINING"/></span><span><Copy text={nextWorkout?"BEREIT":"PAUSE"}/></span></div><h2><Copy text={nextWorkout?.title||"Regeneration zählt auch"}/></h2><p>{nextWorkout?.scheduledAt?<LocalizedValue value={nextWorkout.scheduledAt}/>:<Copy text="Dein Trainer kann den nächsten Plan zuweisen."/>}</p><Link href={nextWorkout?`/training/${nextWorkout.id}`:"/training"} className="primary"><Copy text={nextWorkout?"TRAINING STARTEN":"TRAINING ÖFFNEN"}/><b aria-hidden="true">↗</b></Link></article>
    </section>
    <section className="dashboard-grid">
      <article className={radarFull?"panel":"panel locked-radar"}>
        <div className="panel-head"><div><span className="eyebrow"><Copy text={"TRAINER RADAR"}/></span><h2><Copy text={radarFull?(rec?.title||"Daten sammeln."):"Dein Tageszustand."}/></h2></div><span className="tag amber"><Copy text={radarFull?`REGENERATION ${v(score?.recovery)}`:"PRO"}/></span></div>
        <div className="radar-wrap">
          <div className="data-completeness"><strong>{score?.completeness??0}%</strong><span><Copy text={"DATEN VOLLSTÄNDIG"}/></span></div>
          <div className={!radarFull?"radar-locked-content":""}><span className="signal"><Copy text={"HEUTIGE EMPFEHLUNG"}/></span><h3><Copy text={radarFull?(rec?.action||"Mach deinen täglichen Tagescheck."):"Persönliche Empfehlung freischalten"}/></h3><p><Copy text={radarFull?(rec?.explanation||"Sobald Training, Wearable oder Tagescheck Daten vorliegen, erklärt der Trainer Radar den Tageszustand."):"KOSTENLOS zeigt den Gesamtzustand. PRO erklärt warum und was du heute konkret tun solltest."}/></p>{radarFull?<Link href="/settings" className="secondary"><Copy text={"TAGESCHECK"}/></Link>:<Link href="/pricing" className="secondary"><Copy text={"PRO TESTEN"}/></Link>}</div>
        </div>
      </article>

      <article className="panel"><div className="panel-head"><div><span className="eyebrow"><Copy text={"HEUTE"}/></span><h2><Copy text={"Tageswerte"}/></h2></div></div><div className="metrics"><div><span><Copy text={"SCHLAF"}/></span><strong><Copy text={wearable?.sleepMinutes?`${Math.floor(wearable.sleepMinutes/60)}:${String(wearable.sleepMinutes%60).padStart(2,"0")}`:check?.sleepHours?`${check.sleepHours}h`:"Keine Angabe"}/></strong><small><Copy text={wearable?.sleepMinutes?"Gerätedaten":"Tagescheck"}/></small></div><div><span><Copy text={"SCHRITTE"}/></span><strong>{(wearable?.steps??check?.steps)==null?<Copy text="Keine Angabe"/>:<LocalizedValue value={wearable?.steps??check?.steps}/>}</strong><small><Copy text={"letzte Aktualisierung"}/></small></div><div><span><Copy text={"WASSER"}/></span><strong><Copy text={check?.waterMl?`${(check.waterMl/1000).toFixed(1)}L`:"Keine Angabe"}/></strong><small><Copy text={"Tagescheck"}/></small></div><div><span>PROTEIN</span><strong><Copy text={check?.proteinG?`${Math.round(check.proteinG)}g`:"Keine Angabe"}/></strong><small><Copy text={"Tagescheck"}/></small></div></div></article>

      <article className="panel coach"><div className="coach-head"><div className="coach-pic">A</div><div><span className="eyebrow"><Copy text={"DEIN TRAINER"}/></span><h2>Ayman</h2></div><span className="online"><Copy text={"TRAINER"}/></span></div><blockquote><Copy text={"“Regeneration gehört zum Training. Sei anders und erhole dich bewusst.”"}/></blockquote><div className="coach-actions"><Link href="/coach" className="secondary"><Copy text={"NACHRICHT"}/></Link><Link href="/report" className="secondary"><Copy text={"WOCHENBERICHT"}/></Link></div></article>
    </section>

    <section className={scoreDetails?"pillars":"pillars locked-score-details"}>
      <div className="section-head"><div><span className="eyebrow"><Copy text={"DEIN ATHLET"}/></span><h2><Copy text={"Du trainierst nicht. Du entwickelst dich."}/></h2></div><span className="week"><Copy text={scoreDetails?(score?"AKTUELLES PROFIL":"AUSGANGSWERT"):"PRO DETAILS"}/></span></div>
      {scoreDetails?<div className="pillar-grid">{pillars.map(([name,p])=><div className="pillar" key={name}><div><span><Copy text={name}/></span><strong><Copy text={p??"Keine Angabe"}/></strong></div><div className="bar"><i style={{width:`${p??0}%`}}/></div><small><Copy text={p==null?"Daten fehlen":"aktuell"}/></small></div>)}</div>:<div className="locked-feature-inline"><div className="blur-pillars">{pillars.slice(0,4).map(([name],i)=><div className="pillar" key={name}><div><span><Copy text={name}/></span><strong>{[78,64,71,58][i]}</strong></div><div className="bar"><i style={{width:`${[78,64,71,58][i]}%`}}/></div></div>)}</div><div><strong><Copy text={"Teilwerte, Verlauf und Erklärungen sind PRO."}/></strong><Link href="/pricing" className="secondary"><Copy text={"PRO FREISCHALTEN"}/></Link></div></div>}
    </section>
  </main>;
}
