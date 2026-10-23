"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {useT,Copy} from "../components/Locale";
type Entry={date:string;flow:string|null;symptoms:string[];energy:number|null;mood:number|null;discomfort:number|null;planChoice:"AS_PLANNED"|"EASIER"|"REST"};
type Data={available:boolean;enabled:boolean;shareWithCoach:boolean;remindersEnabled:boolean;lastPeriodStart:string|null;cycleLengthDays:number|null;consentedAt:string|null;
 forecast:null|{day:number;estimatedNextStarts:string[];approximate:boolean;notForContraception:boolean};entries:Entry[];reminder:null|{text:string}};
const flows=[["NONE","Keine Blutung"],["LIGHT","Leicht"],["MEDIUM","Mittel"],["HEAVY","Stark"]] as const;
const symptoms=[["CRAMPS","Krämpfe"],["HEADACHE","Kopfschmerzen"],["FATIGUE","Müdigkeit"],["BLOATING","Blähungen"],["BACK_PAIN","Rückenschmerzen"],["OTHER","Sonstiges"]] as const;
const choices=[["AS_PLANNED","Wie geplant"],["EASIER","Leichtere Einheit wünschen"],["REST","Ruhe wünschen"]] as const;
function localDate(){const n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")}
const initial=():Entry=>({date:localDate(),flow:null,symptoms:[],energy:null,mood:null,discomfort:null,planChoice:"AS_PLANNED"});
async function send(path:string,method:string,body:unknown){
 const response=await fetch(path,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body),credentials:"same-origin",cache:"no-store"});
 const data=await response.json().catch(()=>({error:"Verbindungsfehler."}));
 if(!response.ok)throw new Error(data.error||"Speichern nicht möglich.");
 return data;
}
export default function CycleClient(){
 const t=useT();
 const [data,setData]=useState<Data|null>(null),[entry,setEntry]=useState<Entry>(initial);
 const [consent,setConsent]=useState(false),[coachConsent,setCoachConsent]=useState(false);
 const [period,setPeriod]=useState(""),[length,setLength]=useState("28");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  const response=await fetch("/api/cycle",{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error("Private Daten konnten nicht geladen werden.");
  const result=await response.json() as Data;setData(result);
  setPeriod(result.lastPeriodStart||"");setLength(String(result.cycleLengthDays??28));
 },[]);
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[load]);
 async function action(path:string,method:string,body:unknown,message:string){
  setBusy(true);setError("");setNotice("");
  try{await send(path,method,body);await load();setNotice(message)}
  catch(e){setError(e instanceof Error?e.message:"Fehler beim Speichern.")}
  finally{setBusy(false)}
 }
 function selectDate(date:string){setEntry({...initial(),...(data?.entries.find(e=>e.date===date)||{}),date});setNotice("")}
 if(loading)return <p role="status"><Copy text={"Privater Bereich wird geladen …"}/></p>;
 return <section className="cycle-stack">
  <header className="cycle-intro"><span><Copy text={"FREIWILLIG · PRIVAT"}/></span><h1><Copy text={"DEIN ZYKLUS. DEINE DATEN."}/></h1>
   <p><Copy text={"Ein persönliches Tagebuch für dein Befinden und flexible Trainingswünsche. Nur du entscheidest, ob du etwas einträgst oder mit deinem Trainer teilst."}/></p>
   <p><Copy text={"Schätzungen sind ungenau und weder zur Verhütung noch zur Feststellung einer Schwangerschaft geeignet. Es gibt keine automatische Änderung deines Trainings oder deiner Stufe."}/></p></header>
  {error&&<p role="alert" className="cycle-error"><Copy text={error}/></p>}{notice&&<p role="status" className="cycle-success"><Copy text={notice}/></p>}
  {!data?.available?<article className="cycle-panel"><h2><Copy text={"Diese Funktion ist noch nicht freigeschaltet."}/></h2><p><Copy text={"Dein Training funktioniert unverändert weiter."}/></p></article>:
   !data.enabled?<article className="cycle-panel"><h2><Copy text={"Nur mit deiner Einwilligung."}/></h2>
     <p><Copy text={"Du kannst freiwillig Daten zu Blutung, Beschwerden, Energie und Stimmung speichern. Sie bleiben privat und erscheinen nicht in deiner Leistungsbewertung. Dein Trainer erhält keinen Zugriff ohne eine weitere ausdrückliche Freigabe."}/></p>
     <p><Copy text={"Du kannst einzelne Tage entfernen oder das gesamte Tagebuch und alle Einstellungen jederzeit unwiderruflich löschen. Es werden keine Erinnerungen mit intimen Details per Push verschickt."}/></p>
     <label className="cycle-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><Copy text={"Ich stimme der Verarbeitung meiner sensiblen Zyklusangaben für mein privates Tagebuch ausdrücklich zu."}/></label>
     <button disabled={!consent||busy} className="cycle-primary" onClick={()=>action("/api/cycle/preferences","POST",{action:"ENABLE",acknowledgeSensitiveData:true},"Privates Tagebuch aktiviert.")}><Copy text={"TAGEBUCH AKTIVIEREN"}/></button>
    </article>:
  <>
   <div className="cycle-grid">
    <article className="cycle-panel"><span className="cycle-kicker"><Copy text={"KALENDER · UNGEFÄHRE ANGABEN"}/></span><h2><Copy text={"Dein Verlauf"}/></h2>
      {data.forecast?<><p><Copy text={"Beobachteter Start: "}/>{data.lastPeriodStart}<Copy text={". Geschätzter Zyklustag: "}/>{data.forecast.day}.</p>
       <p><Copy text={"Nächster geschätzter Beginn: "}/><strong>{data.forecast.estimatedNextStarts[0]}</strong><Copy text={". Individuelle Abweichungen sind normal."}/></p></>:<p><Copy text={"Du hast noch keinen ausreichend aktuellen Zyklusbeginn eingetragen. Es wird nichts erfunden."}/></p>}
      <div className="cycle-fields"><label><Copy text={"Letzter tatsächlicher Beginn"}/><input type="date" value={period} onChange={e=>setPeriod(e.target.value)}/></label>
      <label><Copy text={"Übliche Zykluslänge (20–45 Tage)"}/><input type="number" min="20" max="45" value={length} onChange={e=>setLength(e.target.value)}/></label></div>
      <button className="cycle-secondary" disabled={busy||!length||Number(length)<20||Number(length)>45}
       onClick={()=>action("/api/cycle/preferences","POST",{action:"UPDATE",lastPeriodStart:period||null,cycleLengthDays:Number(length)},"Kalender gespeichert.")}><Copy text={"KALENDER SPEICHERN"}/></button>
      <p><Copy text={"Keine Fruchtbarkeits-, Eisprung- oder Verhütungsprognose."}/></p>
      {data.reminder&&<p className="cycle-hint"><Copy text={data.reminder.text}/></p>}
    </article>
    <article className="cycle-panel"><span className="cycle-kicker"><Copy text={"DEIN TAGESCHECK"}/></span><h2><Copy text={"Wie geht es dir?"}/></h2>
      <div className="cycle-fields"><label><Copy text={"Datum"}/><input type="date" value={entry.date} onChange={e=>selectDate(e.target.value)}/></label>
      <label><Copy text={"Blutung"}/><select value={entry.flow||""} onChange={e=>setEntry({...entry,flow:e.target.value||null})}>
       <option value=""><Copy text={"Keine Angabe"}/></option>{flows.map(([id,label])=><option key={id} value={id}><Copy text={label}/></option>)}</select></label></div>
      <fieldset><legend><Copy text={"Beschwerden · optional"}/></legend><div className="cycle-symptoms">{symptoms.map(([id,label])=><label key={id}>
       <input type="checkbox" checked={entry.symptoms.includes(id)} onChange={e=>setEntry({...entry,symptoms:e.target.checked?[...entry.symptoms,id]:entry.symptoms.filter(x=>x!==id)})}/><Copy text={label}/></label>)}</div></fieldset>
      <div className="cycle-fields">{(["energy","mood","discomfort"] as const).map(k=><label key={k}><Copy text={k==="energy"?"Energie":k==="mood"?"Stimmung":"Beschwerden (0–10)"}/>
       <select value={entry[k]??""} onChange={e=>setEntry({...entry,[k]:e.target.value===""?null:Number(e.target.value)})}>
        <option value=""><Copy text={"Keine Angabe"}/></option>{Array.from({length:k==="discomfort"?11:10},(_,i)=>k==="discomfort"?i:i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>)}</div>
      <fieldset><legend><Copy text={"Dein Wunsch für das Training"}/></legend><div className="cycle-choices">{choices.map(([id,label])=><label key={id}><input type="radio" checked={entry.planChoice===id} onChange={()=>setEntry({...entry,planChoice:id})}/><Copy text={label}/></label>)}</div></fieldset>
      <p><Copy text={"Dein Wunsch verändert den Trainingsplan nicht automatisch. Du kannst dich jederzeit selbst für Ruhe entscheiden."}/></p>
      <button className="cycle-primary" disabled={busy} onClick={()=>action("/api/cycle/entries","PUT",entry,"Eintrag privat gespeichert.")}><Copy text={"TAG SPEICHERN"}/></button>
      {data.entries.some(e=>e.date===entry.date)&&<button className="cycle-danger" disabled={busy} onClick={()=>{
       if(window.confirm(t("Eintrag dieses Tages endgültig löschen?")))void action("/api/cycle/entries","DELETE",{date:entry.date},"Tagesdaten gelöscht.");
      }}><Copy text={"DIESEN TAG LÖSCHEN"}/></button>}
    </article>
   </div>
   <article className="cycle-panel"><span className="cycle-kicker"><Copy text={"VERLAUF"}/></span><h2><Copy text={"Deine Einträge"}/></h2>
    {data.entries.length===0?<p><Copy text={"Noch keine Tage gespeichert."}/></p>:<div className="cycle-history">
     {data.entries.slice(0,35).map(e=><button key={e.date} className={entry.date===e.date?"cycle-day selected":"cycle-day"} onClick={()=>selectDate(e.date)}>
       <strong>{e.date}</strong><small><Copy text={e.planChoice==="REST"?"Ruhe gewünscht":e.planChoice==="EASIER"?"Leichter gewünscht":"Wie geplant"}/> · {e.energy==null?<Copy text="keine Energieangabe"/>:<><Copy text="Energie"/> {e.energy}</>}</small>
      </button>)}</div>}
   </article>
   <article className="cycle-panel"><span className="cycle-kicker"><Copy text={"DATENSCHUTZ & KONTROLLE"}/></span><h2><Copy text={"Du entscheidest."}/></h2>
    <label className="cycle-check"><input type="checkbox" checked={data.remindersEnabled} disabled={busy}
     onChange={e=>action("/api/cycle/preferences","POST",{action:"UPDATE",remindersEnabled:e.target.checked},"Hinweiseinstellung gespeichert.")}/><Copy text={" Private Hinweise im Tagebuch anzeigen"}/></label>
    <p><Copy text={"Diese Hinweise erscheinen nur beim Öffnen dieses privaten Bereichs; keine Zyklusdetails in Push-Mitteilungen."}/></p>
    <label className="cycle-check"><input type="checkbox" checked={data.shareWithCoach} disabled={busy}
      onChange={e=>{if(!e.target.checked){void action("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:false},"Trainerfreigabe widerrufen.");return}setCoachConsent(true)}}/><Copy text={" Nur Trainingssignale der letzten 14 Tage meinem zugewiesenen Trainer freigeben"}/></label>
    {coachConsent&&!data.shareWithCoach&&<div className="cycle-share-confirm"><p><Copy text={"Der Trainer sieht auf ausdrücklichen Wunsch nur Trainingswunsch, Energie und Belastungsangabe der letzten 14 Tage – keine Blutungsstärke, einzelnen Symptome oder Prognosen."}/></p>
      <button disabled={busy} className="cycle-primary" onClick={async()=>{await action("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:true,confirmShare:true},"Trainerfreigabe erteilt.");setCoachConsent(false)}}><Copy text={"FREIGABE AUSDRÜCKLICH BESTÄTIGEN"}/></button>
      <button className="cycle-secondary" onClick={()=>setCoachConsent(false)}><Copy text={"ABBRECHEN"}/></button></div>}
    <p><Link href="/api/privacy/export"><Copy text={"DEINE DATEN EXPORTIEREN →"}/></Link></p>
    <button className="cycle-danger" disabled={busy} onClick={()=>{if(window.confirm(t("Das private Zyklustagebuch, alle Tage und Freigaben unwiderruflich löschen?")))void action("/api/cycle/preferences","POST",{action:"DISABLE",confirmDeletion:true},"Alle Zyklusdaten gelöscht und Einwilligung widerrufen.");}}><Copy text={"ALLE DATEN LÖSCHEN & ZUSTIMMUNG WIDERRUFEN"}/></button>
   </article>
  </>}
  <p className="cycle-back"><Link href="/dashboard"><Copy text={"ZURÜCK ZUR STARTSEITE →"}/></Link></p>
 </section>;
}
