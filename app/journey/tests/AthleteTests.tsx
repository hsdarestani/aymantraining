"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Metric={key:string;unit:string;min?:number;max?:number};
type Attempt={id:string;verdict:"PENDING"|"FAILED"|"PASSED";feedback:any;submittedAt:string;reviewedAt:string|null;results:unknown};
type Exam={id:string;kind:string;titleDe:string;metrics:Metric[];guidanceDe:string;nextRetestAt:string|null;canSubmit:boolean;attempts:Attempt[]};
type Item={id:string;titleDe:string;kind:string;description:string;mandatory:boolean;done:boolean};
type Chapter={id:string;level:string;titleDe:string;unlocked:boolean;finished:boolean;mandatoryTotal:number;mandatoryDone:number;items:Item[];assessment:Exam|null};
type Enrollment={id:string;state:string;pathway:string;version:number;selfLevel:string|null;confirmedLevel:string|null;placement:Exam|null;chapters:Chapter[]};

function when(input:string){return new Date(input).toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"});}
async function call(path:string,method="GET",body?:unknown){
 const r=await fetch(path,{method,headers:body?{"content-type":"application/json"}:undefined,
  body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>({error:"Verbindung fehlgeschlagen."}));
 if(!r.ok)throw new Error(data.error||"Anfrage fehlgeschlagen.");
 return data;
}
function Feedback({attempt,exam}:{attempt:Attempt;exam:Exam}){
 const f=attempt.feedback;
 return <div className={"j6-result "+(attempt.verdict==="PASSED"?"j6-passed":attempt.verdict==="FAILED"?"j6-failed":"j6-pending")}>
  <strong>{attempt.verdict==="PENDING"?"IN PRÜFUNG":attempt.verdict==="PASSED"?"TEST BESTANDEN":"NOCH NICHT BESTANDEN"}</strong>
  <p>{attempt.verdict==="PENDING"?"Deine Ergebnisse wurden gesendet. Dein Trainer prüft die Werte.":
   attempt.verdict==="PASSED"?"Stark! Der nächste Trainingsabschnitt wird entsprechend deinem Weg freigeschaltet.":
   "Du bist noch nicht so weit. Hier siehst du genau, woran du weiterarbeiten kannst."}</p>
  {attempt.verdict==="FAILED"&&<div className="j6-improvements">
   {Array.isArray(f?.missing)&&f.missing.length>0&&<p>Fehlende Messungen: {f.missing.join(", ")}</p>}
   {Array.isArray(f?.failed)&&f.failed.map((x:{key:string;expected:string;actual:number},i:number)=>
    <p key={i}>{x.key}: {x.actual} · Ziel {x.expected}</p>)}
   {exam.guidanceDe&&<p>{exam.guidanceDe}</p>}
  </div>}
  {f?.coachFeedbackDe&&<p><b>Dein Trainer:</b> {String(f.coachFeedbackDe)}</p>}
  {attempt.verdict==="FAILED"&&exam.nextRetestAt&&new Date(exam.nextRetestAt).getTime()>Date.now()&&
   <small>Nächster Test frühestens: {when(exam.nextRetestAt)}</small>}
  <small>Abgegeben am {when(attempt.submittedAt)}</small>
 </div>;
}
function ExamForm({exam,enrollmentId,onSaved,canStart}:{exam:Exam;enrollmentId:string;onSaved:()=>Promise<void>;canStart:boolean}){
 const [values,setValues]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const key=useRef<string|null>(null);
 async function submit(){
  setError("");setBusy(true);
  try{
   const results=exam.metrics.map(m=>({key:m.key,unit:m.unit,value:Number(values[m.key])}));
   if(exam.metrics.some(m=>values[m.key]===undefined||values[m.key].trim()===""||!Number.isFinite(Number(values[m.key]))))
    throw Error("Bitte alle Messwerte vollständig eintragen.");
   key.current??=globalThis.crypto?.randomUUID?.()??"journey-"+String(Date.now());
   await call("/api/journey/tests/attempts","POST",{
    enrollmentId,assessmentId:exam.id,idempotencyKey:key.current,results
   });
   await onSaved();setValues({});key.current=null;
  }catch(e){setError(e instanceof Error?e.message:"Senden fehlgeschlagen.");}
  finally{setBusy(false);}
 }
 const latest=exam.attempts[0];
 return <div className="j6-exam">
  <h4>{exam.titleDe}</h4>
  {latest&&<Feedback attempt={latest} exam={exam}/>}
  {canStart&&exam.canSubmit?<div>
    <div className="j6-metrics">{exam.metrics.map(m=><label key={m.key}>{m.key} ({m.unit})
      <small>{m.min!==undefined?"Ab "+m.min+" ":""}{m.max!==undefined?"Bis "+m.max:""}</small>
      <input type="number" step="any" inputMode="decimal" value={values[m.key]??""}
       onChange={e=>setValues(old=>({...old,[m.key]:e.target.value}))}/></label>)}</div>
    {error&&<p role="alert" className="j6-error">{error}</p>}
    <button type="button" disabled={busy} className="primary compact" onClick={submit}>{busy?"WIRD GESENDET …":"ERGEBNIS EINREICHEN"}</button>
   </div>:<p className="j6-muted">{latest?.verdict==="PENDING"?"Auf die Prüfung durch deinen Trainer warten.":
    latest?.verdict==="PASSED"?"Dieser Test wurde bestanden.":
    exam.nextRetestAt&&new Date(exam.nextRetestAt).getTime()>Date.now()?"Die Wiederholung ist noch nicht freigegeben.":
    "Erst die Pflichtinhalte dieses Kapitels abschließen."}</p>}
 </div>;
}
export default function AthleteTests(){
 const [enrollments,setEnrollments]=useState<Enrollment[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const [busyItem,setBusyItem]=useState("");
 const load=useCallback(async()=>{
  try{const r=await call("/api/journey/tests");setEnrollments(r.enrollments);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Trainingsweg nicht verfügbar.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function complete(enrollmentId:string,itemId:string){
  setBusyItem(itemId);setError("");
  try{await call("/api/journey/tests/items","POST",{enrollmentId,itemId});await load();}
  catch(e){setError(e instanceof Error?e.message:"Nicht möglich.");}
  finally{setBusyItem("");}
 }
 if(loading)return <p role="status">Trainingsweg wird geladen …</p>;
 return <div className="j6-workspace">
  {error&&<p role="alert" className="j6-error">{error}</p>}
  {!enrollments.length&&<article className="panel"><h2>Dein Trainingsweg wird vorbereitet.</h2><p>Nach der Auswahl deiner Ziele und der Freigabe durch den Trainer erscheint dein persönlicher Weg hier.</p></article>}
  {enrollments.map(e=><section className="panel j6-path" key={e.id}>
   <div className="j6-path-header"><div><span className="eyebrow">TRAININGSWEG · VERSION {e.version}</span><h2>{e.pathway}</h2></div>
   <span className="j6-status">{e.confirmedLevel?e.confirmedLevel.replaceAll("_"," "):"EINSTUFUNG OFFEN"}</span></div>
   <p>Selbsteinschätzung: {e.selfLevel?.replaceAll("_"," ")||"Keine Angabe"} · Bestätigtes Level: {e.confirmedLevel?.replaceAll("_"," ")||"Noch offen"}</p>
   {e.state==="PENDING"&&<article className="j6-chapter j6-wait">
    <h3>Dein Einstiegslevel wird bestätigt.</h3>
    <p>Eine höhere Selbsteinschätzung und ein PRO Abo öffnen keine weiteren Kapitel.</p>
    {e.placement?<ExamForm exam={e.placement} enrollmentId={e.id} onSaved={load} canStart/>:
     <p>Der Trainer kann deine Einstufung nach persönlicher Prüfung bestätigen.</p>}
    {e.placement?.attempts[0]?.verdict==="PASSED"&&<p>Test bestanden. Die Einstufung wird vom Trainer abschließend bestätigt.</p>}
   </article>}
   <div className="j6-chapters">{e.chapters.map(ch=><article className={"j6-chapter "+(!ch.unlocked?"j6-locked":"")} key={ch.id}>
    <div className="j6-chapter-head"><div><span className="eyebrow">{ch.level.replaceAll("_"," ")}</span><h3>{ch.titleDe}</h3></div><span className="j6-status">
    {ch.finished?"BESTANDEN":ch.unlocked?"FREIGESCHALTET":"GESPERRT"}</span></div>
    {ch.unlocked?<div>
      <p>{ch.mandatoryDone} von {ch.mandatoryTotal} Pflichtinhalten abgeschlossen</p>
      <div className="j6-items">{ch.items.map(item=><div className="j6-item" key={item.id}>
       <div><strong>{item.titleDe}</strong><small>{item.kind==="GUIDANCE"?"HINWEIS":item.kind==="EXERCISE"?"ÜBUNG":"TRAININGSPLAN"} · {item.mandatory?"PFLICHT":"OPTIONAL"}</small>
        {item.description&&<p>{item.description}</p>}</div>
       <button type="button" disabled={item.done||busyItem===item.id||ch.finished} onClick={()=>complete(e.id,item.id)}>
        {item.done?"ERLEDIGT":busyItem===item.id?"SPEICHERN …":"ALS ERLEDIGT MARKIEREN"}</button>
      </div>)}</div>
      {ch.assessment?<ExamForm exam={ch.assessment} enrollmentId={e.id} onSaved={load}
       canStart={!ch.finished&&ch.mandatoryDone===ch.mandatoryTotal}/>:
       <p>Der Abschlusstest wird durch den Trainer vorbereitet.</p>}
     </div>:<p>Schließe zuerst die erforderlichen Kapitel und Tests ab.</p>}
   </article>)}</div>
  </section>)}
 </div>;
}
