import {Copy,LocalizedValue} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {levelForScore} from "../../lib/scoring";
import {dateOnly} from "../../lib/http";
import DigitalTwinHero from "../components/DigitalTwinHero";
import ScoreRadar from "../components/ScoreRadar";
export const dynamic="force-dynamic";

const dayMs=86400000;
function signal(value:number|null|undefined){return value==null?"empty":value<60?"red":value<80?"amber":"green"}
function sameDay(a:Date,b:Date){return dateOnly(a).getTime()===dateOnly(b).getTime()}

export default async function Dashboard(){
  const user=await requireUser();
  const today=dateOnly();
  const timelineStart=new Date(today.getTime()-dayMs);
  const timelineEnd=new Date(today.getTime()+2*dayMs);
  const [score,check,wearable,nextWorkout,recs,nutrition,context,timelineWorkouts,lineSetting,heroPhoto]=await Promise.all([
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*60*60*1000)}},orderBy:{scheduledAt:"asc"}}),
    prisma.recommendation.findMany({where:{userId:user.id,date:today},orderBy:{createdAt:"desc"},take:3}),
    prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.athleteContext.findUnique({where:{userId:user.id}}),
    prisma.workout.findMany({where:{userId:user.id,scheduledAt:{gte:timelineStart,lt:timelineEnd}},select:{id:true,title:true,scheduledAt:true,completedAt:true},orderBy:{scheduledAt:"asc"}}),
    prisma.systemSetting.findUnique({where:{key:"different_lines"}}),
    user.name?.trim().toUpperCase()==="HSTEST"?prisma.mediaAsset.findFirst({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"}}):Promise.resolve(null)
  ]);

  const total=score?.total??0;
  const pillars=[
    {letter:"S",key:"strength",label:"KRAFT",value:score?.strength},
    {letter:"E",key:"endurance",label:"AUSDAUER",value:score?.endurance},
    {letter:"A",key:"athleticism",label:"ATHLETIK",value:score?.athleticism},
    {letter:"M",key:"mobility",label:"BEWEGLICHKEIT",value:score?.mobility},
    {letter:"R",key:"recovery",label:"REGENERATION",value:score?.recovery},
    {letter:"F",key:"fuel",label:"ERNÄHRUNG",value:score?.fuel},
    {letter:"C",key:"consistency",label:"KONSTANZ",value:score?.consistency}
  ];
  const present=pillars.filter(p=>p.value!=null);
  const focus=[...present].sort((a,b)=>(a.value??101)-(b.value??101))[0]??pillars[0];
  const lines=Array.isArray(lineSetting?.value)?lineSetting.value as string[]:[];
  const dailyLine=String(lines[Math.floor(Date.now()/dayMs)%Math.max(1,lines.length)]||"Heute zählt die nächste saubere Entscheidung.");
  const dayStrip=[-1,0,1].map(offset=>{
    const date=new Date(today.getTime()+offset*dayMs);
    const workouts=timelineWorkouts.filter(w=>w.scheduledAt&&sameDay(w.scheduledAt,date));
    return {offset,date,workouts};
  });
  const dayNames=["GESTERN","HEUTE","MORGEN"];
  const sleepHours=wearable?.sleepMinutes!=null?Math.round(wearable.sleepMinutes/6)/10:check?.sleepHours;
  const sleepDisplay=wearable?.sleepMinutes!=null?Math.floor(wearable.sleepMinutes/60)+":"+String(wearable.sleepMinutes%60).padStart(2,"0"):sleepHours==null?null:String(sleepHours);
  const sleepStageObject=wearable?.sleepStages&&typeof wearable.sleepStages==="object"&&!Array.isArray(wearable.sleepStages)?wearable.sleepStages as Record<string,unknown>:null;
  const currentHeartRate=typeof sleepStageObject?.currentHeartRate==="number"?sleepStageObject.currentHeartRate:null;
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

  return <main className="bd-web-home bd-editorial-home">
    <header className="bd-home-top">
      <Link href="/dashboard" className="bd-home-wordmark">BE DIFFERENT</Link>
      <Link href="/athlete" className={"bd-score-chip "+signal(total)}><span><Copy text="BD SCORE"/></span><strong>{total}%</strong></Link>
    </header>

    <section className={"bd-home-hero bd-hero-editorial "+(heroPhoto?"has-photo":"")}>
      {heroPhoto?<div className="bd-athlete-private-photo"><img src={"/api/media/"+heroPhoto.id} alt=""/></div>:<DigitalTwinHero/>}
      <div className="bd-hero-copy">
        <span className="eyebrow"><Copy text="GUTEN MORGEN"/></span>
        <h1>{(user.name||"ATHLET").toUpperCase()}</h1>
        <p><Copy text={dailyLine}/></p>
        <Link href="/focus" className="bd-red-link"><Copy text="BE FOCUSED · 2 MIN ATMUNG →"/></Link>
      </div>
      <div className="bd-hero-index"><span>01</span><b><Copy text="ATHLETE MODE"/></b></div>
    </section>

    {priority&&<Link href="/lifestyle" className="bd-priority bd-priority-line">
      <span><Copy text="HEUTE WICHTIG"/></span><strong><Copy text={priority.title}/></strong><p><Copy text={priority.action}/></p><b>→</b>
    </Link>}

    <section className="bd-score-editorial">
      <div className="bd-score-intro">
        <span className="eyebrow"><Copy text="BE DIFFERENT SCORE"/></span>
        <div className="bd-score-number"><strong>{total}</strong><i>%</i></div>
        <span className={"bd-score-state "+signal(total)}><Copy text={levelForScore(total)}/></span>
        <p><Copy text="DEIN TAGESZIEL: 100%"/></p>
        <small><Copy text="DATEN"/> {score?.completeness??0}%</small>
      </div>
      <div className="bd-radar-stage">
        <ScoreRadar pillars={pillars}/>
        <div className="bd-radar-caption"><span><Copy text="NÄCHSTER FOKUS"/></span><strong><Copy text={focus.label}/></strong><b>{focus.value==null?"—":Math.round(focus.value)}%</b></div>
      </div>
      <div className="bd-pillar-list">
        {pillars.map(p=><Link href="/athlete" key={p.key} className={"bd-pillar-row "+signal(p.value)}>
          <span>{p.letter}</span><strong><Copy text={p.label}/></strong><b>{p.value==null?"—":Math.round(p.value)}</b>
        </Link>)}
        <Link href="/athlete" className="bd-score-open"><Copy text="ATHLETE DIGITAL TWIN ÖFFNEN →"/></Link>
      </div>
    </section>

    <section className="bd-section-title bd-timeline-title"><span className="eyebrow"><Copy text="DEINE 72 STUNDEN"/></span><h2><Copy text="BELASTUNG IM BLICK."/></h2></section>
    <section className="bd-day-line">
      {dayStrip.map((day,i)=>{
        const first=day.workouts[0];
        return <Link href="/training" className={i===1?"bd-day-item active":"bd-day-item"} key={day.date.toISOString()}>
          <span><Copy text={dayNames[i]}/></span>
          <strong><LocalizedValue value={day.date} format="toLocaleDateString"/></strong>
          <p>{first?.title||<Copy text={i===1?"REGENERATION ODER FREI":"NOCH NICHTS GEPLANT"}/>}</p>
          {first?.completedAt&&<small><Copy text="ERLEDIGT"/></small>}
        </Link>
      })}
    </section>

    <section className="bd-performance-stream">
      <Link href="/lifestyle" className="bd-stream-row featured">
        <span className="bd-stream-index">R</span><div><small><Copy text="BE RESTED"/></small><strong>{sleepDisplay==null?<Copy text="Keine Angabe"/>:sleepDisplay+" h"}</strong><p>{wearable?.restingHr!=null?<><Copy text="RUHEPULS"/> {Math.round(wearable.restingHr)} · </>:null}{currentHeartRate!=null?<><Copy text="PULS"/> {currentHeartRate}</>:<Copy text="Schlaf und Erholung"/>}</p></div><b>→</b>
      </Link>
      <Link href="/fuel" className="bd-stream-row">
        <span className="bd-stream-index">F</span><div><small><Copy text="BE FUEL"/></small><strong>{protein} g</strong><p><Copy text="Protein heute"/></p></div><b>→</b>
      </Link>
      <Link href="/focus" className="bd-stream-row accent">
        <span className="bd-stream-index">M</span><div><small><Copy text="BE FOCUSED"/></small><strong>02:00</strong><p><Copy text="Atmung und Tagescheck"/></p></div><b>→</b>
      </Link>
      <Link href="/community" className="bd-stream-row">
        <span className="bd-stream-index">C</span><div><small><Copy text="HERAUSFORDERUNGEN"/></small><strong><Copy text="SERIE & RANGLISTE"/></strong><p><Copy text="Serie · Rangliste · Abzeichen"/></p></div><b>→</b>
      </Link>
    </section>

    {cycle&&<Link href="/context" className="bd-cycle-card bd-cycle-line"><span><Copy text="ZYKLUS KONTEXT"/></span><strong><Copy text="TAG"/> {cycle.day} · <Copy text={cycle.phase}/></strong><p><Copy text="Training und Recovery berücksichtigen deinen freiwilligen Zykluskontext."/></p></Link>}

    <Link href={nextWorkout?"/training/"+nextWorkout.id:"/training"} className="bd-workout-card bd-workout-editorial">
      <div className="bd-workout-index">NEXT</div>
      <span><Copy text="HEUTIGES TRAINING"/></span><h2>{nextWorkout?.title||<Copy text="REGENERATIONSTAG"/>}</h2>
      <p>{nextWorkout?.scheduledAt?<LocalizedValue value={nextWorkout.scheduledAt}/>:<Copy text="Regeneration gehört zum Training."/>}</p>
      <b><Copy text={nextWorkout?"STARTEN →":"TRAINING ÖFFNEN →"}/></b>
    </Link>

    <section className="bd-quick-lines">
      <Link href="/wearables"><span><Copy text="GADGETS"/></span><strong>Apple · Samsung · Xiaomi</strong><b>→</b></Link>
      <Link href="/athlete"><span><Copy text="ATHLETE DIGITAL TWIN"/></span><strong><Copy text="Radar · Ziel · Prognose"/></strong><b>→</b></Link>
      <Link href="/coach"><span><Copy text="COACH"/></span><strong><Copy text="Chat · Überblick · Rückmeldung"/></strong><b>→</b></Link>
    </section>
  </main>;
}
