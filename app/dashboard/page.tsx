import {Copy,LocalizedValue} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {levelForScore} from "../../lib/scoring";
import {dateOnly} from "../../lib/http";
import DigitalTwinHero from "../components/DigitalTwinHero";
export const dynamic="force-dynamic";

const dayMs=86400000;
function signal(value:number|null|undefined){return value==null?"empty":value<60?"red":value<80?"amber":"green"}
function sameDay(a:Date,b:Date){return dateOnly(a).getTime()===dateOnly(b).getTime()}

export default async function Dashboard(){
  const user=await requireUser();
  const today=dateOnly();
  const timelineStart=new Date(today.getTime()-dayMs);
  const timelineEnd=new Date(today.getTime()+2*dayMs);
  const [score,check,wearable,nextWorkout,recs,nutrition,context,timelineWorkouts,lineSetting]=await Promise.all([
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*60*60*1000)}},orderBy:{scheduledAt:"asc"}}),
    prisma.recommendation.findMany({where:{userId:user.id,date:today},orderBy:{createdAt:"desc"},take:3}),
    prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.athleteContext.findUnique({where:{userId:user.id}}),
    prisma.workout.findMany({where:{userId:user.id,scheduledAt:{gte:timelineStart,lt:timelineEnd}},select:{id:true,title:true,scheduledAt:true,completedAt:true},orderBy:{scheduledAt:"asc"}}),
    prisma.systemSetting.findUnique({where:{key:"different_lines"}})
  ]);

  const total=score?.total??0;
  const pillars=[
    ["S","KRAFT",score?.strength],["E","AUSDAUER",score?.endurance],["A","ATHLETIK",score?.athleticism],
    ["M","MOBILITY",score?.mobility],["R","RECOVERY",score?.recovery],["F","FUEL",score?.fuel],["C","KONSTANZ",score?.consistency]
  ] as const;
  const lines=Array.isArray(lineSetting?.value)?lineSetting.value as string[]:[];
  const dailyLine=String(lines[Math.floor(Date.now()/dayMs)%Math.max(1,lines.length)]||"Heute zählt die nächste saubere Entscheidung.");
  const dayStrip=[-1,0,1].map(offset=>{
    const date=new Date(today.getTime()+offset*dayMs);
    const workouts=timelineWorkouts.filter(w=>w.scheduledAt&&sameDay(w.scheduledAt,date));
    return {offset,date,workouts};
  });
  const dayNames=["GESTERN","HEUTE","MORGEN"];
  const sleepHours=wearable?.sleepMinutes!=null?Math.round(wearable.sleepMinutes/6)/10:check?.sleepHours;
  const protein=Math.round(nutrition?.proteinG??check?.proteinG??0);
  const cycle=(()=>{
    if(!context?.cycleTrackingEnabled||!context.cycleStartDate)return null;
    const length=Math.max(20,Math.min(45,context.cycleLengthDays||28));
    const days=Math.max(0,Math.floor((today.getTime()-dateOnly(context.cycleStartDate).getTime())/dayMs));
    const day=days%length+1;
    const ovulation=Math.max(10,Math.round(length-14));
    const phase=day<=5?"MENSTRUATION":day<ovulation-1?"FOLLIKELPHASE":day<=ovulation+1?"OVULATIONSFENSTER":"LUTEALPHASE";
    return {day,phase};
  })();
  const priority=recs[0];

  return <main className="bd-web-home">
    <header className="bd-home-top">
      <Link href="/dashboard" className="bd-home-wordmark">BE DIFFERENT</Link>
      <Link href="/athlete" className={"bd-score-chip "+signal(total)}><span><Copy text="BD SCORE"/></span><strong>{total}%</strong></Link>
    </header>

    <section className="bd-home-hero">
      <DigitalTwinHero/>
      <span className="eyebrow"><Copy text="GUTEN MORGEN"/></span>
      <h1>{(user.name||"ATHLET").toUpperCase()}</h1>
      <p><Copy text={dailyLine}/></p>
      <Link href="/focus" className="bd-red-link"><Copy text="BE FOCUSED · 2 MIN ATMUNG →"/></Link>
    </section>

    {priority&&<Link href="/lifestyle" className="bd-priority">
      <span><Copy text="HEUTE WICHTIG"/></span><strong><Copy text={priority.title}/></strong><p><Copy text={priority.action}/></p>
    </Link>}

    <section className="bd-score-panel">
      <div className="bd-score-head">
        <div><span className="eyebrow"><Copy text="BE DIFFERENT SCORE"/></span><h2><Copy text="DEIN TAGESZIEL: 100%"/></h2><small><Copy text="DATEN"/> {score?.completeness??0}%</small></div>
        <div className={"bd-score-ring "+signal(total)} style={{"--score":`${total}%`} as React.CSSProperties}>
          <div><strong>{total}<small>%</small></strong><span><Copy text={levelForScore(total)}/></span></div>
        </div>
      </div>
      <div className="bd-pillar-strip">
        {pillars.map(([letter,label,value])=><Link href="/athlete" className="bd-pillar-mini" key={letter}>
          <div className="bd-pillar-rail"><i className={signal(value)} style={{height:`${Math.max(6,value??0)}%`}}/></div>
          <b>{letter}</b><strong>{value==null?<Copy text="Keine Angabe"/>:Math.round(value)}</strong><span><Copy text={label}/></span>
        </Link>)}
      </div>
      <Link href="/athlete" className="bd-volt-link"><Copy text="ATHLETE DIGITAL TWIN ÖFFNEN →"/></Link>
    </section>

    <section className="bd-section-title"><span className="eyebrow"><Copy text="DEINE 72 STUNDEN"/></span><h2><Copy text="BELASTUNG IM BLICK."/></h2></section>
    <section className="bd-day-strip">
      {dayStrip.map((day,i)=>{
        const first=day.workouts[0];
        return <Link href="/training" className={i===1?"bd-day-card active":"bd-day-card"} key={day.date.toISOString()}>
          <span><Copy text={dayNames[i]}/></span>
          <strong><LocalizedValue value={day.date} format="toLocaleDateString"/></strong>
          <p>{first?.title||<Copy text={i===1?"REGENERATION ODER FREI":"NOCH NICHTS GEPLANT"}/>}</p>
          {first?.completedAt&&<small><Copy text="ERLEDIGT"/></small>}
        </Link>
      })}
    </section>

    <section className="bd-module-grid">
      <Link href="/lifestyle" className="bd-module-card"><span><Copy text="BE RESTED"/></span><strong>{sleepHours==null?<Copy text="Keine Angabe"/>:sleepHours+" h"}</strong><p><Copy text="Schlaf und Erholung"/></p></Link>
      <Link href="/fuel" className="bd-module-card"><span><Copy text="BE FUEL"/></span><strong>{protein} g</strong><p><Copy text="Protein heute"/></p></Link>
      <Link href="/focus" className="bd-module-card red"><span><Copy text="BE FOCUSED"/></span><strong>02:00</strong><p><Copy text="Atmung und Tagescheck"/></p></Link>
      <Link href="/community" className="bd-module-card red"><span><Copy text="CHALLENGES"/></span><strong>→</strong><p><Copy text="Streak · Leaderboard · Badges"/></p></Link>
    </section>

    {cycle&&<Link href="/context" className="bd-cycle-card"><span><Copy text="CYCLE CONTEXT"/></span><strong><Copy text="TAG"/> {cycle.day} · <Copy text={cycle.phase}/></strong><p><Copy text="Training und Recovery berücksichtigen deinen freiwilligen Zykluskontext."/></p></Link>}

    <Link href={nextWorkout?`/training/${nextWorkout.id}`:"/training"} className="bd-workout-card">
      <span><Copy text="HEUTIGES TRAINING"/></span><h2>{nextWorkout?.title||<Copy text="REGENERATIONSTAG"/>}</h2>
      <p>{nextWorkout?.scheduledAt?<LocalizedValue value={nextWorkout.scheduledAt}/>:<Copy text="Regeneration gehört zum Training."/>}</p>
      <b><Copy text={nextWorkout?"STARTEN →":"TRAINING ÖFFNEN →"}/></b>
    </Link>

    <section className="bd-quick-links">
      <Link href="/wearables"><span><Copy text="GADGETS"/></span><strong>Apple · Samsung · Xiaomi</strong></Link>
      <Link href="/athlete"><span><Copy text="ATHLETE DIGITAL TWIN"/></span><strong><Copy text="Radar · Ziel · Prognose"/></strong></Link>
      <Link href="/coach"><span><Copy text="COACH"/></span><strong><Copy text="Chat · Briefing · Feedback"/></strong></Link>
    </section>
  </main>;
}
