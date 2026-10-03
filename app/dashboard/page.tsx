import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {levelForScore} from "../../lib/scoring";
import {dateOnly} from "../../lib/http";
import {hasFeature} from "../../lib/entitlements";
export const dynamic="force-dynamic";
function v(x:number|null|undefined){return x==null?"—":Math.round(x)}

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
  const pillars=[["STRENGTH",score?.strength],["ENDURANCE",score?.endurance],["ATHLETICISM",score?.athleticism],["MOBILITY",score?.mobility],["RECOVERY",score?.recovery],["FUEL",score?.fuel],["CONSISTENCY",score?.consistency]] as const;
  const rec=recs[0];

  return <main className="shell">
    <header className="topbar"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><div className="top-actions"><Link href="/report" className="ghost">Weekly Report</Link><Link href="/settings" className="ghost">Settings</Link><div className="avatar">{(user.name||"A").slice(0,2).toUpperCase()}</div></div></header>

    <section className="hero">
      <div><span className="eyebrow">GOOD MORNING, {(user.name||"ATHLETE").toUpperCase()}</span><h1>BUILD YOUR<br/><em>ATHLETE.</em></h1><p>Deine Daten werden zu einer klaren Entscheidung für heute. Fehlende Quellen werden sichtbar markiert und nicht erfunden.</p><div className="live"><i/> DATA COMPLETENESS {score?.completeness??0}%</div></div>
      <div className="score-ring" style={{background:`conic-gradient(var(--volt) 0 ${total}%, rgba(255,255,255,.07) ${total}% 100%)`}}><div className="score-inner"><span className="eyebrow">BE DIFFERENT SCORE</span><strong>{total}%</strong><span className="level">{levelForScore(total)}</span></div></div>
    </section>

    <section className="grid">
      <article className={radarFull?"panel":"panel locked-radar"}>
        <div className="panel-head"><div><span className="eyebrow">COACH RADAR</span><h2>{radarFull?(rec?.title||"Daten sammeln."):"Dein Tageszustand."}</h2></div><span className="tag amber">{radarFull?`RECOVERY ${v(score?.recovery)}`:"PRO"}</span></div>
        <div className="radar-wrap">
          <div className="data-completeness"><strong>{score?.completeness??0}%</strong><span>DATEN VOLLSTÄNDIG</span></div>
          <div className={!radarFull?"radar-locked-content":""}><span className="signal">TODAY'S CALL</span><h3>{radarFull?(rec?.action||"Mach deinen täglichen Check-in."):"Persönliche Empfehlung freischalten"}</h3><p>{radarFull?(rec?.explanation||"Sobald Training, Wearable oder Check-in Daten vorliegen, erklärt der Coach Radar den Tageszustand."):"FREE zeigt den Gesamtzustand. PRO erklärt warum und was du heute konkret tun solltest."}</p>{radarFull?<Link href="/settings" className="secondary">DAILY CHECK</Link>:<Link href="/pricing" className="secondary">PRO TESTEN</Link>}</div>
        </div>
      </article>

      <article className="panel workout"><div className="panel-head"><div><span className="eyebrow">TODAY'S WORKOUT</span><h2>{nextWorkout?.title||"Kein Workout geplant"}</h2></div><span className="tag">{nextWorkout?"READY":"REST"}</span></div><div className="workout-visual"><span className="number">01</span><div><span className="signal">NEXT</span><h3>{nextWorkout?"Plan öffnen":"Recovery zählt auch"}</h3><p>{nextWorkout?.scheduledAt?nextWorkout.scheduledAt.toLocaleString("de-DE"):"Dein Coach kann den nächsten Plan zuweisen."}</p></div></div><Link href={nextWorkout?`/training/${nextWorkout.id}`:"/training"} className="primary">{nextWorkout?"START WORKOUT":"TRAINING ÖFFNEN"} <b>→</b></Link></article>

      <article className="panel"><div className="panel-head"><div><span className="eyebrow">TODAY</span><h2>Daily Signals</h2></div></div><div className="metrics"><div><span>SLEEP</span><strong>{wearable?.sleepMinutes?`${Math.floor(wearable.sleepMinutes/60)}:${String(wearable.sleepMinutes%60).padStart(2,"0")}`:check?.sleepHours?`${check.sleepHours}h`:"—"}</strong><small>{wearable?.sleepMinutes?"Wearable":"Daily Check"}</small></div><div><span>STEPS</span><strong>{wearable?.steps?.toLocaleString("de-DE")??check?.steps?.toLocaleString("de-DE")??"—"}</strong><small>letzter Sync</small></div><div><span>WATER</span><strong>{check?.waterMl?`${(check.waterMl/1000).toFixed(1)}L`:"—"}</strong><small>Daily Check</small></div><div><span>PROTEIN</span><strong>{check?.proteinG?`${Math.round(check.proteinG)}g`:"—"}</strong><small>Daily Check</small></div></div></article>

      <article className="panel coach"><div className="coach-head"><div className="coach-pic">A</div><div><span className="eyebrow">YOUR COACH</span><h2>Ayman</h2></div><span className="online">COACH</span></div><blockquote>“Recovery is training too. Be different – rest smart.”</blockquote><div className="coach-actions"><Link href="/coach" className="secondary">MESSAGE</Link><Link href="/report" className="secondary">WEEKLY REPORT</Link></div></article>
    </section>

    <section className={scoreDetails?"pillars":"pillars locked-score-details"}>
      <div className="section-head"><div><span className="eyebrow">YOUR ATHLETE</span><h2>Du trainierst nicht. Du entwickelst dich.</h2></div><span className="week">{scoreDetails?(score?"CURRENT PROFILE":"START BASELINE"):"PRO DETAILS"}</span></div>
      {scoreDetails?<div className="pillar-grid">{pillars.map(([name,p])=><div className="pillar" key={name}><div><span>{name}</span><strong>{p??"—"}</strong></div><div className="bar"><i style={{width:`${p??0}%`}}/></div><small>{p==null?"Daten fehlen":"aktuell"}</small></div>)}</div>:<div className="locked-feature-inline"><div className="blur-pillars">{pillars.slice(0,4).map(([name],i)=><div className="pillar" key={name}><div><span>{name}</span><strong>{[78,64,71,58][i]}</strong></div><div className="bar"><i style={{width:`${[78,64,71,58][i]}%`}}/></div></div>)}</div><div><strong>Teil Scores, Verlauf und Erklärungen sind PRO.</strong><Link href="/pricing" className="secondary">PRO FREISCHALTEN</Link></div></div>}
    </section>
  </main>;
}
