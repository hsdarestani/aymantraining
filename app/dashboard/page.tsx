import {Copy,LocalizedValue} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {getDailyProfile} from "../../lib/daily-profile-service";
import {dateOnly} from "../../lib/http";
import DigitalTwinHero from "../components/DigitalTwinHero";
import ScoreRadar from "../components/ScoreRadar";
import RhythmHorizon from "../components/RhythmHorizon";
import WomenDashboard from "../components/WomenDashboard";
import CelebrationOverlay from "../components/CelebrationOverlay";
import {getDashboardPreference} from "../../lib/women-dashboard";
import {privateCycle} from "../../lib/cycle-service";
import "../women-dashboard.css";
export const dynamic="force-dynamic";

const dayMs=86400000;
function signal(value:number|null|undefined){return value==null?"empty":value<60?"red":value<80?"amber":"green"}
function sameDay(a:Date,b:Date){return dateOnly(a).getTime()===dateOnly(b).getTime()}

export default async function Dashboard(){
  const user=await requireUser();
  const dailyProfile=await getDailyProfile(user.id);
  const dashboardPreference=await getDashboardPreference(user.id);
  const cycleOverview=await privateCycle(user.id,{includeEntries:false});
  const womenGoals=dashboardPreference.mode==="WOMEN"?await prisma.goal.findMany({where:{userId:user.id,active:true},select:{type:true},take:12}):[];
  const today=dateOnly();
  const timelineStart=new Date(today.getTime()-dayMs);
  const timelineEnd=new Date(today.getTime()+2*dayMs);
  const [score,check,wearable,nextWorkout,recs,nutrition,context,timelineWorkouts,lineSetting,heroPhoto]=await Promise.all([
    prisma.scoreSnapshot.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"}}),
    prisma.workout.findFirst({where:{userId:user.id,completedAt:null,scheduledAt:{gte:new Date(Date.now()-12*60*60*1000)}},orderBy:{scheduledAt:"asc"}}),
    prisma.recommendation.findMany({where:{userId:user.id,date:today,sourceRule:{not:"cycle_context"}},orderBy:{createdAt:"desc"},take:3}),
    prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}}}),
    prisma.athleteContext.findUnique({where:{userId:user.id}}),
    prisma.workout.findMany({where:{userId:user.id,scheduledAt:{gte:timelineStart,lt:timelineEnd}},select:{id:true,title:true,scheduledAt:true,completedAt:true},orderBy:{scheduledAt:"asc"}}),
    prisma.systemSetting.findUnique({where:{key:"different_lines"}}),
    prisma.mediaAsset.findFirst({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"}})
  ]);

  const total=dailyProfile.profile.value;
  const day=dailyProfile.plan;
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
  const focus=[...present].sort((a,b)=>(a.value??101)-(b.value??101))[0]??null;
  const lines=Array.isArray(lineSetting?.value)?lineSetting.value as string[]:[];
  const dailyLine=String(lines[Math.floor(Date.now()/dayMs)%Math.max(1,lines.length)]||"Heute zählt die nächste saubere Entscheidung.");
  const dayStrip=[-1,0,1].map(offset=>{
    const date=new Date(today.getTime()+offset*dayMs);
    const workouts=timelineWorkouts.filter(w=>w.scheduledAt&&sameDay(w.scheduledAt,date));
    return {offset,date,workouts};
  });
  const dayNames=["GESTERN","HEUTE","MORGEN"];
  const sleepHours=dailyProfile.today.sleepHours;
  const sleepDisplay=sleepHours==null?null:String(sleepHours);
  const sleepStageObject=wearable?.sleepStages&&typeof wearable.sleepStages==="object"&&!Array.isArray(wearable.sleepStages)?wearable.sleepStages as Record<string,unknown>:null;
  const currentHeartRate=typeof sleepStageObject?.currentHeartRate==="number"?sleepStageObject.currentHeartRate:null;
  const protein=nutrition?.proteinG??check?.proteinG??null;
  const cycle=cycleOverview.enabled?cycleOverview.forecast:null;
  const priority=recs[0];

  return <main className="bd-web-home bd-editorial-home">
    {process.env.CELEBRATIONS_ENABLED==="true"&&<CelebrationOverlay/>}
    <header className="bd-home-top">
      <Link href="/dashboard" className="bd-home-wordmark">BE DIFFERENT</Link>
      <Link href="/athlete" className={"bd-score-chip "+signal(total)}><span><Copy text="BD SCORE"/></span><strong>{total==null?"?":total+"%"}</strong></Link>
    </header>

    <section className={"bd-home-hero bd-hero-editorial "+(heroPhoto?"has-photo":"")}>
      {heroPhoto?<div className="bd-athlete-private-photo"><img src={"/api/media/"+heroPhoto.id} alt=""/></div>:<DigitalTwinHero/>}
      <div className="bd-hero-copy">
        <span className="eyebrow"><Copy text="DEIN ATHLETEN DASHBOARD"/></span>
        <h1>{(user.name||"ATHLET").toUpperCase()}</h1>
        <p><Copy text={dailyLine}/></p>
        <Link href="/focus" className="bd-red-link"><Copy text="BE FOCUSED · 2 MIN ATMUNG →"/></Link>
      </div>
      <div className="bd-hero-index"><span>01</span><b><Copy text="ATHLETENMODUS"/></b></div>
    </section>

    <WomenDashboard preference={dashboardPreference} journeyEnabled={process.env.JOURNEY_OVERVIEW_ENABLED==="true"} confirmedLevel={dailyProfile.journey.confirmedLevel}
      completed={dailyProfile.plan.completed} scheduled={dailyProfile.plan.scheduled}
      energy={dailyProfile.today.energy} sleepHours={dailyProfile.today.sleepHours}
      goals={womenGoals.map(g=>g.type)}/>
    {priority&&<Link href="/lifestyle" className="bd-priority bd-priority-line">
      <span><Copy text="HEUTE WICHTIG"/></span><strong><Copy text={priority.title}/></strong><p><Copy text={priority.action}/></p><b>→</b>
    </Link>}

    <section className="bd-workout-card" aria-label="Dein Tag und dein bestätigter Stand">
      <span>HEUTE · {dailyProfile.date}</span>
      <h2><Copy text={day.status==="NOT_SCHEDULED"?"Kein Training eingetragen":day.status==="DONE"?"Alle geplanten Einheiten erledigt":day.status==="PARTIAL"?"Training teilweise erledigt":"Training geplant"}/></h2>
      <p>{day.scheduled?<>{day.completed} <Copy text="von"/> {day.scheduled} <Copy text="Einheiten"/> · <Copy text="ERLEDIGT"/></>:<Copy text="Ohne Trainingsplan ist dies nicht automatisch ein Erholungstag."/>}</p>
      <p><Copy text="ENERGIE:"/> {dailyProfile.today.energy??<Copy text="Keine Angabe"/>} · <Copy text="SCHLAF:"/> {dailyProfile.today.sleepHours==null?<Copy text="Keine Angabe"/>:dailyProfile.today.sleepHours+" h"}</p>
      <p><Copy text="BESTÄTIGTE STUFE:"/> {dailyProfile.journey.confirmedLevel??<Copy text="Noch nicht bestätigt"/>}</p>
      <Link href={process.env.JOURNEY_DAILY_ENABLED==="true"?"/journey/today":"/training"}><Copy text="DEINEN PLAN ANSEHEN →"/></Link>
    </section>
    {process.env.MILESTONES_ENABLED==="true"&&<Link href="/milestones" className="bd-workout-card" style={{display:"block",padding:22,borderTop:"3px solid #d4ff00"}}><span><Copy text="DEINE MEILENSTEINE"/></span><h2><Copy text="DEINE TAGE ZÄHLEN."/></h2><p><Copy text="Deine echte Serie, geplante Erholung und verdiente Erfolge."/></p><b><Copy text="ERFOLGE ANSEHEN →"/></b></Link>}
    <section className="bd-score-editorial">
      <div className="bd-score-intro">
        <span className="eyebrow"><Copy text="BE DIFFERENT SCORE"/></span>
        <div className="bd-score-number"><strong>{total??"—"}</strong><i>{total==null?"":"%"}</i></div>
        <span className={"bd-score-state "+signal(total)}><Copy text="LEISTUNGSPROFIL · KEINE STUFE"/></span>
        <p><Copy text="MESSSTAND:"/> {dailyProfile.profile.recordedDate??<Copy text="KEIN MESSWERT"/>} · <Copy text={dailyProfile.profile.freshness==="OLD"?"ÄLTERER MESSWERT":"DATENBASIS"}/></p>
        <small><Copy text="DATENABDECKUNG"/> {dailyProfile.profile.completeness}% · <Copy text="UNABHÄNGIG VOM HEUTIGEN TRAINING"/></small>
      </div>
      <div className="bd-radar-stage">
        <ScoreRadar pillars={pillars}/>
        <div className="bd-radar-caption"><span><Copy text="NÄCHSTER FOKUS"/></span><strong><Copy text={focus?.label??"NOCH KEINE DATEN"}/></strong><b>{focus?.value==null?<Copy text="Keine Angabe"/>:Math.round(focus.value)+"%"}</b></div>
      </div>
      <div className="bd-pillar-list">
        {pillars.map(p=><Link href="/athlete" key={p.key} className={"bd-pillar-row "+signal(p.value)}>
          <span>{p.letter}</span><strong><Copy text={p.label}/></strong><b>{p.value==null?"—":Math.round(p.value)}</b>
        </Link>)}
        <Link href="/athlete" className="bd-score-open"><Copy text="ATHLETE DIGITAL TWIN ÖFFNEN →"/></Link>
      </div>
    </section>

    <RhythmHorizon days={dayStrip.map((day,i)=>({
      number:String(day.date.getUTCDate()).padStart(2,"0"),
      month:new Intl.DateTimeFormat("de-DE",{month:"long",timeZone:"UTC"}).format(day.date).toUpperCase(),
      label:dayNames[i],
      workouts:day.workouts.map(workout=>({
        id:workout.id,
        title:workout.title,
        time:workout.scheduledAt?new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(workout.scheduledAt):"",
        completed:Boolean(workout.completedAt)
      }))
    }))}/>

    <section className="bd-performance-stream">
      <Link href="/lifestyle" className="bd-stream-row featured">
        <span className="bd-stream-index">R</span><div><small><Copy text="BE RESTED"/></small><strong>{sleepDisplay==null?<Copy text="Keine Angabe"/>:sleepDisplay+" h"}</strong><p>{wearable?.restingHr!=null?<><Copy text="RUHEPULS"/> {Math.round(wearable.restingHr)} · </>:null}{currentHeartRate!=null?<><Copy text="PULS"/> {currentHeartRate}</>:<Copy text="Schlaf und Erholung"/>}</p></div><b>→</b>
      </Link>
      <Link href="/fuel" className="bd-stream-row">
        <span className="bd-stream-index">F</span><div><small><Copy text="BE FUEL"/></small><strong>{protein==null?<Copy text="Keine Angabe"/>:Math.round(protein)+" g"}</strong><p><Copy text="Protein heute"/></p></div><b>→</b>
      </Link>
      <Link href="/focus" className="bd-stream-row accent">
        <span className="bd-stream-index">M</span><div><small><Copy text="BE FOCUSED"/></small><strong>02:00</strong><p><Copy text="Atmung und Tagescheck"/></p></div><b>→</b>
      </Link>
      <Link href="/community" className="bd-stream-row">
        <span className="bd-stream-index">C</span><div><small><Copy text="HERAUSFORDERUNGEN"/></small><strong><Copy text="SERIE & RANGLISTE"/></strong><p><Copy text="Serie · Rangliste · Abzeichen"/></p></div><b>→</b>
      </Link>
    </section>

    {cycleOverview.enabled&&<Link href="/cycle" className="bd-cycle-card bd-cycle-line"><span><Copy text="PRIVATER ZYKLUSKALENDER"/></span><strong>{cycle?<><Copy text="TAG"/> {cycle.day} · <Copy text="NUR SCHÄTZUNG"/></>:<Copy text="DEINE AUFZEICHNUNGEN"/>}</strong><p><Copy text="Nur du entscheidest, welche Daten du speicherst und mit deinem Trainer teilst."/></p></Link>}

    <Link href={nextWorkout?"/training/"+nextWorkout.id:"/training"} className="bd-workout-card bd-workout-editorial">
      <div className="bd-workout-index"><Copy text="NÄCHSTE EINHEIT"/></div>
      <span><Copy text="HEUTIGES TRAINING"/></span><h2>{nextWorkout?.title||<Copy text="KEIN TRAINING EINGETRAGEN"/>}</h2>
      <p>{nextWorkout?.scheduledAt?<LocalizedValue value={nextWorkout.scheduledAt}/>:<Copy text="Ohne Planung ist kein Erholungstag bestätigt."/>}</p>
      <b><Copy text={nextWorkout?"STARTEN →":"TRAINING ÖFFNEN →"}/></b>
    </Link>

    {process.env.JOURNEY_OVERVIEW_ENABLED==="true"&&<Link href="/journey" className="bd-workout-card"><span><Copy text="DEIN WEG"/></span><h2><Copy text="LEVEL & KAPITEL"/></h2><p><Copy text="Dein bestätigter Fortschritt und dein nächster Trainingsschritt."/></p><b><Copy text="ANSEHEN →"/></b></Link>}
    {process.env.JOURNEY_DAILY_ENABLED==="true"&&<Link href="/journey/today" className="bd-workout-card"><span><Copy text="DEIN TAG"/></span><h2><Copy text="TRAINING · ERHOLUNG · TRAINER"/></h2><p><Copy text="Was heute wirklich ansteht und welches persönliche Feedback vorliegt."/></p><b><Copy text="HEUTE ANSEHEN →"/></b></Link>}
    {process.env.JOURNEY_TESTS_ENABLED==="true"&&<Link href="/journey/tests" className="bd-workout-card">
      <span><Copy text="DEIN TRAININGSWEG"/></span><h2><Copy text="KAPITEL & AUFSTIEGSTESTS"/></h2>
      <p><Copy text="Dein bestätigter Trainingsstand, deine Prüfungen und die nächsten Schritte."/></p><b><Copy text="ANSEHEN →"/></b>
    </Link>}
    <section className="bd-quick-lines">
      <Link href="/awake"><span><Copy text="BE AWAKE"/></span><strong><Copy text="Morgenroutine · Tagesstart"/></strong><b>→</b></Link>
      <Link href="/wearables"><span><Copy text="GADGETS"/></span><strong>Apple · Samsung · Xiaomi</strong><b>→</b></Link>
      <Link href="/athlete"><span><Copy text="ATHLETE DIGITAL TWIN"/></span><strong><Copy text="Radar · Ziel · Prognose"/></strong><b>→</b></Link>
      <Link href="/coach"><span><Copy text="COACH"/></span><strong><Copy text="Chat · Überblick · Rückmeldung"/></strong><b>→</b></Link>
    </section>
  </main>;
}
