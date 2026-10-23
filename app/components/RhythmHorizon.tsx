"use client";
import {useState} from "react";
import Link from "next/link";
import {Copy,useT} from "./Locale";

export type RhythmDay={
  number:string;
  month:string;
  label:string;
  workouts:Array<{id:string;title:string;time:string;completed:boolean}>;
};

export default function RhythmHorizon({days}:{days:RhythmDay[]}){
  const t=useT();
  const [active,setActive]=useState(1);
  const current=days[active]??days[1]??days[0];
  if(!current)return null;
  const first=current.workouts[0];
  return <section className="bd-rhythm" aria-labelledby="bd-rhythm-heading">
    <div className="bd-rhythm-heading">
      <div className="bd-rhythm-head-copy">
        <span className="bd-section-serial">02 / <Copy text="DEIN TRAININGSFENSTER"/></span>
        <h2 id="bd-rhythm-heading"><Copy text="DEINE LAST."/><br/><em><Copy text="DEIN RHYTHMUS."/></em></h2>
        <p><Copy text="Drei Tage. Ein Rhythmus. Entdecke, was geplant ist und wo Erholung ihren Platz hat."/></p>
      </div>
      <div className="bd-rhythm-monogram" aria-hidden="true"><strong>72</strong><span>H /</span></div>
    </div>
    <div className="bd-rhythm-tape" role="group" aria-label={t("Trainingstag auswählen")}>
      {days.map((day,index)=>{
        const selected=index===active;
        return <button
          key={index}
          type="button"
          onClick={()=>setActive(index)}
          aria-pressed={selected}
          aria-label={t(day.label)+" "+day.number+" "+t(day.month)}
          className={"bd-rhythm-stop"+(selected?" selected":"")+(day.workouts.length?" with-session":"")}
        >
          <span className="bd-rhythm-stop-meta"><span className="bd-rhythm-step">0{index+1} / 03</span><span className="bd-rhythm-stop-name"><Copy text={day.label}/></span></span>
          <span className="bd-rhythm-stop-date">{day.number}</span>
          <span className="bd-rhythm-pin" aria-hidden="true"><span/></span>
          <span className="bd-rhythm-stop-state"><Copy text={day.workouts.length?"EINHEIT":"FREI"}/></span>
        </button>;
      })}
    </div>
    <div className="bd-rhythm-stage" aria-live="polite" aria-atomic="true">
      <div className="bd-rhythm-stage-date">
        <span className="bd-section-serial"><Copy text="AUSGEWÄHLTER TAG"/></span>
        <div className="bd-rhythm-number">{current.number}<span className="bd-rhythm-month"><Copy text={current.month}/></span></div>
      </div>
      <div className="bd-rhythm-stage-info">
        <span className="bd-rhythm-stage-kicker">{current.workouts.length? <Copy text="BEWEGUNG GEPLANT"/>:<Copy text="ERHOLUNG IM PLAN"/>}</span>
        <strong>{first?<Copy text={first.title}/>:<Copy text="KEIN TRAINING. TROTZDEM FORTSCHRITT."/>}</strong>
        <p>{first?<><Copy text={current.workouts.length===1?"1 Trainingseinheit":"Trainingseinheiten"}/>{current.workouts.length>1?" · "+current.workouts.length:""} · {first.time} {first.completed?<>· <Copy text="ERLEDIGT"/></>:""}</>:<Copy text="Regeneration ist Teil deiner Trainingswoche. Kein Belastungswert ohne Messdaten."/>}</p>
        <Link href={first?"/training/"+first.id:"/training"} className="bd-rhythm-action"><Copy text={first?"EINHEIT ANSEHEN":"TRAININGSPLAN ANSEHEN"}/><span aria-hidden="true">↗</span></Link>
      </div>
      <div className="bd-rhythm-stage-glyph" aria-hidden="true">
        <svg viewBox="0 0 176 176" fill="none">
          <circle cx="88" cy="88" r="69" stroke="currentColor" strokeWidth="1"/>
          <circle cx="88" cy="88" r="47" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8"/>
          <path d="M20 88h136M88 20v136" stroke="currentColor" strokeWidth="1"/>
          <path d={first?"M88 19A69 69 0 0 1 157 88":"M88 19A69 69 0 0 0 19 88"} stroke="#d7ff40" strokeWidth="5" strokeLinecap="square"/>
          <circle cx="88" cy="88" r="8" fill="#d7ff40"/>
        </svg>
      </div>
    </div>
    <p className="bd-rhythm-footnote"><span aria-hidden="true">↳</span> <Copy text="Nur echte geplante Trainingseinheiten. Keine geschätzten Belastungswerte."/></p>
  </section>;
}
