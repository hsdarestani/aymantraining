"use client";
import {Copy,useT} from "../components/Locale";

import {FormEvent,useState} from "react";
type Pref={category:string;enabled:boolean;quietFrom:string|null;quietTo:string|null};
const categories=[
 ["morning_brief","Morgenübersicht"],["training_reminder","Trainingserinnerung"],["recovery_warning","Regenerationshinweis"],["sleep","Schlaf"],["nutrition","Wasser & Ernährung"],["weekly_report","Wochenreport"],["achievement","Erfolge"],["coach_message","Trainer Nachrichten"]
] as const;
export default function SettingsClient({initialPrefs}:{initialPrefs:Pref[]}){
 const t=useT();
 const map=new Map(initialPrefs.map(p=>[p.category,p]));
 const [prefs,setPrefs]=useState(categories.map(([category])=>map.get(category)||{category,enabled:true,quietFrom:"22:00",quietTo:"07:00"}));
 const [status,setStatus]=useState("");

 async function checkin(e:FormEvent<HTMLFormElement>){
   e.preventDefault();const f=new FormData(e.currentTarget);
   const num=(k:string)=>{const x=Number(f.get(k));return x||undefined};
   const body={energy:num("energy"),soreness:num("soreness"),mood:num("mood"),stress:num("stress"),sleepHours:num("sleepHours"),steps:num("steps"),waterMl:num("waterMl"),proteinG:num("proteinG")};
   const r=await fetch("/api/daily-check",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   setStatus(r.ok?"Tagescheck gespeichert und Leistungswert neu berechnet.":"Tagescheck fehlgeschlagen.");
 }
 async function persist(i:number,nextPref:Pref){
   const next=[...prefs];next[i]=nextPref;setPrefs(next);
   const r=await fetch("/api/push-preferences",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(nextPref)});
   setStatus(r.ok?"Mitteilungseinstellungen gespeichert.":"Mitteilungseinstellung konnte nicht gespeichert werden.");
 }
 async function toggle(i:number){await persist(i,{...prefs[i],enabled:!prefs[i].enabled})}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}
 async function deleteAccount(){if(!confirm(t("Konto und persönliche Daten endgültig löschen?")))return;const r=await fetch("/api/privacy/delete",{method:"DELETE"});if(r.ok)location.href="/register"}

 return <div className="settings-stack">
  <form className="panel mini-form wide" onSubmit={checkin}>
   <span className="eyebrow"><Copy text={"10 SEKUNDEN TAGESCHECK"}/></span><h2><Copy text={"Wie fühlst du dich heute?"}/></h2>
   <div className="input-grid compact-inputs">
    <label><Copy text={"Energie 1 bis 10"}/><input name="energy" type="number" min="1" max="10"/></label>
    <label><Copy text={"Muskelkater 1 bis 10"}/><input name="soreness" type="number" min="1" max="10"/></label>
    <label><Copy text={"Stimmung 1 bis 10"}/><input name="mood" type="number" min="1" max="10"/></label>
    <label><Copy text={"Stress 1 bis 10"}/><input name="stress" type="number" min="1" max="10"/></label>
    <label><Copy text={"Schlaf Stunden"}/><input name="sleepHours" type="number" step=".1" min="0" max="24"/></label>
    <label><Copy text={"Schritte"}/><input name="steps" type="number" min="0"/></label>
    <label><Copy text={"Wasser ml"}/><input name="waterMl" type="number" min="0"/></label>
    <label><Copy text="Protein g"/><input name="proteinG" type="number" min="0"/></label>
   </div><button className="primary"><Copy text={"TAGESCHECK SPEICHERN →"}/></button>
  </form>
  <article className="panel"><span className="eyebrow"><Copy text={"MITTEILUNGEN"}/></span><h2><Copy text={"Begleitung ohne Spam"}/></h2><p className="muted"><Copy text={"Maximal drei nicht dringende Mitteilungen in 24 Stunden. Deine Ruhezeit gilt für jede Kategorie."}/></p>
   {prefs.map((p,i)=>{const label=categories.find(x=>x[0]===p.category)?.[1]||p.category;return <div className="setting-row push-setting-row" key={p.category}>
    <div><strong><Copy text={label}/></strong><div className="quiet-editor"><label><Copy text={"VON"}/><input type="time" value={p.quietFrom||"22:00"} onChange={e=>setPrefs(current=>current.map((x,j)=>j===i?{...x,quietFrom:e.target.value}:x))} onBlur={()=>persist(i,prefs[i])}/></label><label><Copy text={"BIS"}/><input type="time" value={p.quietTo||"07:00"} onChange={e=>setPrefs(current=>current.map((x,j)=>j===i?{...x,quietTo:e.target.value}:x))} onBlur={()=>persist(i,prefs[i])}/></label></div></div>
    <button type="button" className={p.enabled?"toggle on":"toggle"} onClick={()=>toggle(i)}><Copy text={p.enabled?"AN":"AUS"}/></button>
   </div>})}
  </article>
  <article className="panel privacy-box"><span className="eyebrow"><Copy text={"DATENSCHUTZ"}/></span><h2><Copy text={"Deine Daten"}/></h2><p className="muted"><Copy text={"Du kannst deine gespeicherten Daten als JSON exportieren oder dein Konto endgültig löschen."}/></p><div className="privacy-actions"><a className="secondary" href="/api/privacy/export"><Copy text={"DATEN EXPORTIEREN"}/></a><button className="danger-button" onClick={deleteAccount}><Copy text={"KONTO LÖSCHEN"}/></button><button className="secondary" onClick={logout}><Copy text={"ABMELDEN"}/></button></div></article>
  {status&&<div className="save-toast"><Copy text={status}/></div>}
 </div>;
}