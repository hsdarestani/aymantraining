"use client";
import {Copy} from "../../components/Locale";

import {useEffect,useState} from "react";
type Athlete={id:string;name:string|null};
type Rule={id:string;key:string;title:string;message:string;metric:string;threshold:number;visualIntensity:string;enabled:boolean};
type Rest={id:string;day:string;reason:string|null};
type Details={athlete:{id:string;name:string|null;timezone:string};rules:Rule[];rest:Rest[]};
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
export default function MilestoneCoachClient(){
 const [athletes,setAthletes]=useState<Athlete[]>([]),[athleteId,setAthleteId]=useState("");
 const [details,setDetails]=useState<Details|null>(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const [key,setKey]=useState("coach_persoenlicher_erfolg"),[title,setTitle]=useState("MEIN NÄCHSTER SCHRITT"),
 [message,setMessage]=useState("Dein Fortschritt ist dokumentiert."),[metric,setMetric]=useState("STREAK_DAYS"),[threshold,setThreshold]=useState("14"),
 [intensity,setIntensity]=useState("SMALL"),[date,setDate]=useState(today),[reason,setReason]=useState("");
 async function get(path:string){
  const r=await fetch(path,{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Laden fehlgeschlagen");return j;
 }
 async function reload(id=athleteId){if(!id)return;const r=await get("/api/milestones/coach?athleteId="+encodeURIComponent(id));setDetails(r)}
 useEffect(()=>{get("/api/milestones/coach").then(d=>{setAthletes(d.athletes||[]);setAthleteId(d.athletes?.[0]?.id||"")}).catch(e=>setMsg(e.message))},[]);
 useEffect(()=>{reload(athleteId).catch(e=>setMsg(e.message))},[athleteId]);
 async function submit(body:unknown){
  setBusy(true);setMsg("");
  try{
   const r=await fetch("/api/milestones/coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Aktion fehlgeschlagen");
   await reload();setMsg("Gespeichert.");
  }catch(e){setMsg(e instanceof Error?e.message:"Fehler")}
  finally{setBusy(false)}
 }
 if(athletes.length===0)return <p role="status"><Copy text={msg||"Noch keine zugeordneten Athleten."}/></p>;
 return <div style={{display:"grid",gap:20}}>
  <label><Copy text={"Athlet auswählen"}/><select style={{display:"block",width:"100%",padding:11,marginTop:6}} value={athleteId} onChange={e=>setAthleteId(e.target.value)}>
   {athletes.map(a=><option key={a.id} value={a.id}>{a.name||a.id}</option>)}</select></label>
  {msg&&<p role="status"><Copy text={msg}/></p>}
  <fieldset style={{padding:18,display:"grid",gap:10}}><legend><Copy text={"MEILENSTEIN FESTLEGEN"}/></legend>
   <label><Copy text={"Eindeutiger Regelschlüssel"}/><input value={key} onChange={e=>setKey(e.target.value)} maxLength={40}/></label>
   <label><Copy text={"Titel"}/><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={70}/></label>
   <label><Copy text={"Persönliche Botschaft"}/><textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={250} rows={3}/></label>
   <label><Copy text={"Kriterium"}/><select value={metric} onChange={e=>setMetric(e.target.value)}>
    <option value="STREAK_DAYS"><Copy text={"Nachgewiesene Tage in Folge"}/></option>
    <option value="WORKOUT_COUNT"><Copy text={"Abgeschlossene Einheiten"}/></option>
    <option value="EARNED_LEVELS"><Copy text={"Bestätigte Stufen nach Trainertest"}/></option>
    <option value="NUTRITION_DAYS"><Copy text="Dokumentierte Ernährungstage"/></option>
    <option value="RECOVERY_DAYS"><Copy text="Geplante Erholungstage"/></option>
    <option value="CHAPTER_COUNT"><Copy text="Abgeschlossene Kapitel"/></option>
    <option value="PASSED_TESTS"><Copy text="Bestätigte bestandene Tests"/></option>
    <option value="LEVEL_UPS"><Copy text="Erarbeitete Levelaufstiege"/></option>
    <option value="TRULY_DIFFERENT">TRULY DIFFERENT</option></select></label>
   <label><Copy text={"Schwelle"}/><input type="number" min={1} max={1000} value={threshold} onChange={e=>setThreshold(e.target.value)}/></label>
   <label><Copy text={"Intensität der späteren Erfolgsdarstellung"}/><select value={intensity} onChange={e=>setIntensity(e.target.value)}>
    <option value="SMALL"><Copy text={"Klein"}/></option><option value="MEDIUM"><Copy text={"Mittel"}/></option><option value="FULL"><Copy text={"Groß"}/></option></select></label>
   <button type="button" className="primary compact" disabled={busy||!athleteId} onClick={()=>submit({action:"UPSERT_RULE",rule:{
    athleteId,key,title,message,metric,threshold:Number(threshold),visualIntensity:intensity,enabled:true}})}><Copy text={"MEILENSTEIN SPEICHERN"}/></button>
  </fieldset>
  <fieldset style={{padding:18,display:"grid",gap:10}}><legend><Copy text={"ERHOLUNG IM VORAUS PLANEN"}/></legend>
   <p><Copy text={"Erholung zählt nur, wenn sie vor dem Tag gespeichert wurde und keine Trainingseinheit für diesen Tag geplant ist."}/></p>
   <label><Copy text={"Tag"}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label><Copy text={"Begründung (optional)"}/><input value={reason} onChange={e=>setReason(e.target.value)} maxLength={200}/></label>
   <button className="primary compact" type="button" disabled={busy||!athleteId} onClick={()=>submit({action:"PLAN_RECOVERY",plan:{athleteId,day:date,reason}})}><Copy text={"ERHOLUNG PLANEN"}/></button>
  </fieldset>
  <section><h2><Copy text={"Konfigurierte Meilensteine"}/></h2>{details?.rules.length?details.rules.map(r=><article key={r.id} style={{padding:"12px 0",borderTop:"1px solid #486"}}>
   <strong>{r.title}</strong><p>{r.message}</p><small>{r.metric} · {r.threshold} · {r.visualIntensity} · {r.enabled?"Aktiv":"Inaktiv"}</small>
   {r.enabled&&<button type="button" disabled={busy} onClick={()=>submit({action:"DISABLE_RULE",athleteId,key:r.key})}><Copy text={"DEAKTIVIEREN"}/></button>}
  </article>):<p><Copy text={"Keine eigenen Regeln."}/></p>}</section>
  <section><h2><Copy text={"Geplante Erholung"}/></h2>{details?.rest.length?details.rest.map(r=><div key={r.id} style={{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}>
   <span>{String(r.day).slice(0,10)} · {r.reason||"Erholung"}</span>
   <button type="button" disabled={busy} onClick={()=>submit({action:"REMOVE_RECOVERY",athleteId,day:String(r.day).slice(0,10)})}><Copy text={"ENTFERNEN"}/></button>
  </div>):<p><Copy text={"Keine Erholung eingetragen."}/></p>}</section>
 </div>;
}
