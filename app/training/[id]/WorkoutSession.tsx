"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
type Ex={id:string;exerciseId:string;targetSets:number;targetReps:string|null;targetRpe:number|null;restSeconds:number;exercise:{id:string;nameDe:string;equipment:string|null;coachCue1:string|null;coachCue2:string|null;coachCue3:string|null;imageStart:string|null;imageMiddle:string|null;imageEnd:string|null;videoUrl:string|null}};
type S={exerciseId:string;setNumber:number;reps:number|null;weightKg:number|null;rpe:number|null};
function queueOffline(url:string,body:unknown){const key="bd_outbox";const list=JSON.parse(localStorage.getItem(key)||"[]");list.push({url,body,createdAt:Date.now()});localStorage.setItem(key,JSON.stringify(list));}
async function flushOffline(){const key="bd_outbox";const list=JSON.parse(localStorage.getItem(key)||"[]");const remaining=[];for(const item of list){try{const r=await fetch(item.url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(item.body)});if(!r.ok)remaining.push(item);}catch{remaining.push(item);}}localStorage.setItem(key,JSON.stringify(remaining));}
export default function WorkoutSession({workoutId,exercises,existing,previous}:{workoutId:string;exercises:Ex[];existing:S[];previous:S[]}){
  const initial=useMemo(()=>new Map(existing.map(s=>[`${s.exerciseId}:${s.setNumber}`,s])),[existing]);
  const previousMap=useMemo(()=>new Map(previous.map(s=>[`${s.exerciseId}:${s.setNumber}`,s])),[previous]);
  const [saved,setSaved]=useState(initial);const [busy,setBusy]=useState("");const [completeBusy,setCompleteBusy]=useState(false);
  const [rest,setRest]=useState<{seconds:number;total:number}|null>(null);

  useEffect(()=>{fetch(`/api/workouts/${workoutId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"start"})}).catch(()=>undefined);const online=()=>flushOffline();window.addEventListener("online",online);flushOffline();return()=>window.removeEventListener("online",online)},[workoutId]);
  useEffect(()=>{if(!rest||rest.seconds<=0)return;const timer=window.setInterval(()=>setRest(x=>x?{...x,seconds:Math.max(0,x.seconds-1)}:x),1000);return()=>clearInterval(timer)},[rest]);

  async function saveSet(exerciseId:string,setNumber:number,restSeconds:number,form:HTMLFormElement){
    const data=new FormData(form);const key=`${exerciseId}:${setNumber}`;setBusy(key);
    const payload={exerciseId,setNumber,reps:Number(data.get("reps"))||undefined,weightKg:Number(data.get("weightKg"))||undefined,rpe:Number(data.get("rpe"))||undefined};
    try{const response=await fetch(`/api/workouts/${workoutId}/sets`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});if(!response.ok)throw new Error();const json=await response.json();const next=new Map(saved);next.set(key,json.set);setSaved(next)}
    catch{queueOffline(`/api/workouts/${workoutId}/sets`,payload);const next=new Map(saved);next.set(key,payload as S);setSaved(next)}
    if(navigator.vibrate)navigator.vibrate(35);setBusy("");setRest({seconds:restSeconds,total:restSeconds});
  }
  async function finish(){const value=window.prompt("Wie hart war die Einheit? RPE von 1 bis 10","8");const rpe=Number(value);if(!rpe||rpe<1||rpe>10)return;setCompleteBusy(true);await flushOffline();const response=await fetch(`/api/workouts/${workoutId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"complete",rpe})});if(response.ok){if(navigator.vibrate)navigator.vibrate([70,50,120]);window.location.href="/dashboard"}else setCompleteBusy(false)}
  return <>
    {rest&&rest.seconds>0&&<div className="rest-timer"><span>PAUSE</span><strong>{Math.floor(rest.seconds/60)}:{String(rest.seconds%60).padStart(2,"0")}</strong><button onClick={()=>setRest(null)}>ÜBERSPRINGEN</button></div>}
    <div className="session-list">{exercises.map(we=><article className="panel session-exercise" key={we.id}>
      <div className="panel-head"><div><span className="eyebrow">{we.exercise.id.replace(/[-\u2010-\u2015]/g," ")}</span><h2>{we.exercise.nameDe}</h2><p className="muted">{we.exercise.equipment||"Kein Equipment"} · Ziel {we.targetReps||"frei"} · RPE {we.targetRpe||"Keine Angabe"}</p></div><Link className="tag" href={`/exercise/${we.exercise.id}`}>TECHNIK ↗</Link></div>
      <div className="workout-media-mini">{[we.exercise.imageStart,we.exercise.imageMiddle,we.exercise.imageEnd].map((src,i)=>src?<img key={src} src={src} alt={["Start","Mitte","Ende"][i]}/>:<div key={i}>{["BEGINNEN","MITTE","ENDE"][i]}</div>)}</div>
      <div className="cue-row">{[we.exercise.coachCue1,we.exercise.coachCue2,we.exercise.coachCue3].filter(Boolean).map(c=><span key={c!}>{c}</span>)}</div>
      <div className="set-grid">{Array.from({length:we.targetSets},(_,index)=>{const n=index+1,key=`${we.exerciseId}:${n}`;const current=saved.get(key);const prior=previousMap.get(key);return <form key={key} onSubmit={ev=>{ev.preventDefault();saveSet(we.exerciseId,n,we.restSeconds,ev.currentTarget)}}><strong>SATZ {n}</strong><input name="weightKg" type="number" step="0.5" min="0" placeholder={prior?.weightKg!=null?`${prior.weightKg} kg`:"kg"} defaultValue={current?.weightKg??""}/><input name="reps" type="number" min="0" placeholder={prior?.reps!=null?`${prior.reps} Wdh.`:"Wdh."} defaultValue={current?.reps??""}/><input name="rpe" type="number" min="1" max="10" placeholder={prior?.rpe!=null?`RPE ${prior.rpe}`:"RPE"} defaultValue={current?.rpe??""}/><button className={current?"set-done":""}>{busy===key?"…":current?"✓":"SPEICHERN"}</button></form>})}</div><small className="rest-copy">PAUSE · {we.restSeconds} SEKUNDEN</small>
    </article>)}
    <button className="primary finish-workout" onClick={finish} disabled={completeBusy}>{completeBusy?"SPEICHERN…":"TRAINING ABSCHLIESSEN →"}</button></div>
  </>;
}