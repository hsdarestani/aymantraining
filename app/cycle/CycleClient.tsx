"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
type Entry={date:string;flow:string|null;symptoms:string[];energy:number|null;mood:number|null;discomfort:number|null;planChoice:string};
type Forecast={day:number;estimatedNextStarts:string[];approximate:true};
type Data={available:boolean;enabled:boolean;shareWithCoach:boolean;remindersEnabled:boolean;lastPeriodStart:string|null;
 cycleLengthDays:number|null;forecast:Forecast|null;entries:Entry[];reminder:{text:string}|null};
const flows=[["","Keine Angabe"],["NONE","Keine Blutung"],["LIGHT","Leicht"],["MEDIUM","Mittel"],["HEAVY","Stark"]] as const;
const symptoms=[["CRAMPS","Krämpfe"],["HEADACHE","Kopfschmerzen"],["FATIGUE","Müdigkeit"],["BLOATING","Blähungen"],["BACK_PAIN","Rückenschmerzen"],["OTHER","Sonstige"]] as const;
const choices=[["AS_PLANNED","Wie geplant"],["EASIER","Leichter trainieren"],["REST","Ruhe wünschen"]] as const;
const pad=(n:number)=>String(n).padStart(2,"0");
function iso(d:Date){return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
function initialEntry(date:string):Entry{return {date,flow:null,symptoms:[],energy:null,mood:null,discomfort:null,planChoice:"AS_PLANNED"}}
async function json(url:string,method="GET",body?:object){
 const r=await fetch(url,{method,headers:body?{"content-type":"application/json"}:undefined,
  credentials:"same-origin",cache:"no-store",body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>({error:"Verbindung fehlgeschlagen"}));
 if(!r.ok)throw Error(data.error||"Die Änderung wurde nicht gespeichert.");return data;
}
export default function CycleClient(){
 const [d,setD]=useState<Data|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [ack,setAck]=useState(false),[shareAck,setShareAck]=useState(false),[deleteAck,setDeleteAck]=useState(false);
 const [selectedDate,setSelectedDate]=useState(iso(new Date())),[entry,setEntry]=useState<Entry>(initialEntry(iso(new Date())));
 const [month,setMonth]=useState(iso(new Date()).slice(0,7));
 const [last,setLast]=useState(""),[length,setLength]=useState("28");
 const load=useCallback(async()=>{const v=await json("/api/cycle");setD(v);setLast(v.lastPeriodStart??"");setLength(String(v.cycleLengthDays??28));},[]);
 useEffect(()=>{load().catch(e=>setError(e.message))},[load]);
 async function action(url:string,method:string,body:object){
  setBusy(true);setError("");setNotice("");
  try{await json(url,method,body);await load();setNotice("Gespeichert.");}
  catch(e){setError(e instanceof Error?e.message:"Speichern fehlgeschlagen");}
  finally{setBusy(false);}
 }
 function pick(day:string){setSelectedDate(day);setEntry(d?.entries.find(e=>e.date===day)??initialEntry(day))}
 const dates=useMemo(()=>{
  const [y,m]=month.split("-").map(Number),start=new Date(Date.UTC(y,m-1,1));
  const offset=(start.getUTCDay()+6)%7;
  return Array.from({length:42},(_,i)=>iso(new Date(Date.UTC(y,m-1,1-offset+i))));
 },[month]);
 const entryMap=new Map(d?.entries.map(x=>[x.date,x])??[]);
 const currentMonth=(diff:number)=>{const [y,m]=month.split("-").map(Number),d=new Date(Date.UTC(y,m-1+diff,1));setMonth(iso(d).slice(0,7))};
 if(!d)return <p role="status">{error||"Lade deinen privaten Bereich …"}</p>;
 if(!d.available)return <p>Der vertrauliche Zyklusbereich ist noch nicht freigeschaltet. Deine Trainingsdaten bleiben unverändert.</p>;
 return <div className="cy-stack">
  {error&&<p role="alert" className="cy-error">{error}</p>}{notice&&<p role="status" className="cy-ok">{notice}</p>}
  {!d.enabled?<section className="panel cy-consent"><h2>Nur wenn du es möchtest.</h2>
   <p>Hier kannst du Angaben zu Blutung, Beschwerden, Energie und Stimmung privat dokumentieren. Diese Daten sind besonders sensibel. Ohne deine Zustimmung speichern wir keine solchen Einträge. Die Freigabe an deinen Trainer ist separat und standardmäßig aus.</p>
   <label><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/> Ich willige ausdrücklich in die Verarbeitung meiner Zyklusaufzeichnungen für meinen privaten Kalender ein. Ich kann jederzeit alles löschen.</label>
   <button type="button" className="primary compact" disabled={!ack||busy} onClick={()=>action("/api/cycle/preferences","POST",{action:"ENABLE",acknowledgeSensitiveData:true})}>PRIVATEN KALENDER AKTIVIEREN</button>
  </section>:<>
   <section className="panel cy-settings">
    <h2>Deine Kontrolle</h2>
    <p>Du kannst jederzeit aufhören, alles löschen oder entscheiden, ob Trainingssignale an deinen zuständigen Trainer weitergegeben werden. Blutung und Symptome werden dabei nicht geteilt.</p>
    <div className="cy-fields"><label>Letzter Beginn (optional)<input type="date" value={last} onChange={e=>setLast(e.target.value)}/></label>
    <label>Ungefährer Abstand in Tagen<input type="number" min={20} max={45} value={length} onChange={e=>setLength(e.target.value)}/></label></div>
    <button type="button" className="secondary" disabled={busy||!Number.isInteger(Number(length))||Number(length)<20||Number(length)>45} onClick={()=>action("/api/cycle/preferences","POST",{action:"UPDATE",lastPeriodStart:last||null,cycleLengthDays:Number(length),remindersEnabled:d.remindersEnabled})}>SCHÄTZWERTE SPEICHERN</button>
    <label><input type="checkbox" checked={d.remindersEnabled} disabled={busy} onChange={e=>action("/api/cycle/preferences","POST",{action:"UPDATE",remindersEnabled:e.target.checked})}/> Private Hinweise nur in diesem Bereich anzeigen</label>
    <div className="cy-share"><label><input type="checkbox" checked={d.shareWithCoach} disabled={busy}
     onChange={e=>{if(e.target.checked){setShareAck(true)}else{setShareAck(false);void action("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:false})}}}/>
      Trainingsbezogene Angaben freiwillig mit meinem Trainer teilen</label>
     {shareAck&&!d.shareWithCoach&&<div role="group"><p>Nur die letzten 14 Tage: Energiewert, Belastungsempfinden und gewünschte Trainingsanpassung. Keine Blutung, Symptome oder Vorhersagen.</p>
      <button type="button" className="secondary" disabled={busy} onClick={()=>{setShareAck(false);void action("/api/cycle/preferences","POST",{action:"SHARE",shareWithCoach:true,confirmShare:true})}}>FREIGABE AUSDRÜCKLICH BESTÄTIGEN</button>
      <button type="button" className="secondary" onClick={()=>setShareAck(false)}>ABBRECHEN</button></div>}
     <p>{d.shareWithCoach?"Trainerfreigabe ist aktiv. Du kannst sie jederzeit ausschalten.":"Keine Freigabe an Trainer."}</p></div>
   </section>
   <section className="panel cy-calendar" aria-label="Privater Zykluskalender">
    <header><button type="button" onClick={()=>currentMonth(-1)} aria-label="Vorheriger Monat">‹</button><h2>{month}</h2><button type="button" onClick={()=>currentMonth(1)} aria-label="Nächster Monat">›</button></header>
    <div className="cy-days">{["MO","DI","MI","DO","FR","SA","SO"].map(x=><b key={x}>{x}</b>)}
      {dates.map(x=><button type="button" key={x} className={(x===selectedDate?"cy-selected ":"")+(entryMap.has(x)?"cy-recorded ":"")+(d.forecast?.estimatedNextStarts.includes(x)?"cy-estimate ":"")}
       onClick={()=>pick(x)} aria-pressed={x===selectedDate} aria-label={x}>{Number(x.slice(8))}</button>)}</div>
    <p className="cy-note">Umrandet = deine Aufzeichnung. Gepunktet = grobe Schätzung des nächsten Beginns, keine sichere Vorhersage. Nicht zur Verhütung oder Schwangerschaftsplanung verwenden.</p>
    {d.forecast&&<p>Ungefährer Zyklustag {d.forecast.day}. Nächster geschätzter Beginn: {d.forecast.estimatedNextStarts[0]}. Bei unregelmäßigem Zyklus kann die Schätzung unzutreffend sein.</p>}
    {d.reminder&&<p role="status">{d.reminder.text}</p>}
   </section>
   <section className="panel cy-entry"><h2>Dein Tag · {selectedDate}</h2>
    <div className="cy-fields"><label>Blutung<select value={entry.flow??""} onChange={e=>setEntry({...entry,flow:e.target.value||null})}>{flows.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
     {([["energy","Energie (1 bis 10)"],["mood","Stimmung (1 bis 10)"],["discomfort","Beschwerden (0 bis 10)"]] as const).map(([key,title])=><label key={key}>{title}<input type="number" min={key==="discomfort"?0:1} max={10} value={entry[key]??""} onChange={e=>setEntry({...entry,[key]:e.target.value===""?null:Number(e.target.value)})}/></label>)}</div>
    <fieldset><legend>Beschwerden (freiwillig)</legend><div className="cy-symptoms">{symptoms.map(([code,label])=><label key={code}><input type="checkbox" checked={entry.symptoms.includes(code)} onChange={e=>setEntry({...entry,symptoms:e.target.checked?[...entry.symptoms,code]:entry.symptoms.filter(x=>x!==code)})}/>{label}</label>)}</div></fieldset>
    <label>Wunsch für dein Training<select value={entry.planChoice} onChange={e=>setEntry({...entry,planChoice:e.target.value})}>{choices.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
    <p className="cy-note">Deine Auswahl ändert keine gebuchte Einheit. Bei Bedarf kannst du deinen Trainingsplan ansehen und eine Anpassung mit dem Trainer besprechen.</p>
    <div className="cy-actions"><button className="primary compact" type="button" disabled={busy} onClick={()=>action("/api/cycle/entries","PUT",entry)}>TAG SPEICHERN</button>
     {entryMap.has(selectedDate)&&<button type="button" className="secondary" disabled={busy} onClick={()=>{if(confirm("Eintrag endgültig löschen?"))void action("/api/cycle/entries","DELETE",{date:selectedDate})}}>EINTRAG LÖSCHEN</button>}
     <Link href="/training">TRAININGSPLAN ANSEHEN</Link></div>
   </section>
   <section className="panel cy-delete"><h2>Alle Zyklusdaten entfernen</h2>
    <label><input type="checkbox" checked={deleteAck} onChange={e=>setDeleteAck(e.target.checked)}/> Ich möchte die Funktion ausschalten und alle Einträge, Einstellungen und Freigaben löschen.</label>
    <button type="button" className="danger-button" disabled={!deleteAck||busy} onClick={()=>{if(confirm("Zyklusdaten und Freigabe endgültig löschen?"))void action("/api/cycle/preferences","POST",{action:"DISABLE",confirmDeletion:true})}}>ALLE ZYKLUSDATEN LÖSCHEN</button>
    <p className="cy-note">Für eine persönliche Kopie kannst du vor dem Löschen den Datenexport in den <Link href="/settings">Einstellungen</Link> nutzen.</p>
   </section>
  </>}
 </div>;
}
