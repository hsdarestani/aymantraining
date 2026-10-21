"use client";
import {useCallback,useEffect,useState} from "react";
type Pending={id:string;enrollmentId:string;assessmentId:string;titleDe:string;kind:"PLACEMENT"|"CHAPTER_FINAL";
 submittedAt:string;results:unknown;criteria:unknown;athlete:{name:string;email:string};
 pathway:string;selfLevel:string|null};
type Placement={id:string;userId:string;selfLevel:string|null;
 user:{name:string|null};version:{pathway:{titleDe:string};levels:{code:string}[]}};
async function call(path:string,method="GET",body?:unknown){
 const r=await fetch(path,{method,headers:body?{"content-type":"application/json"}:undefined,
  body:body?JSON.stringify(body):undefined});
 const json=await r.json().catch(()=>({error:"Keine Antwort erhalten."}));
 if(!r.ok)throw new Error(json.error||"Aktion fehlgeschlagen.");return json;
}
function date(x:string){return new Date(x).toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"});}
export default function JourneyReviews(){
 const [pending,setPending]=useState<Pending[]>([]);
 const [placements,setPlacements]=useState<Placement[]>([]);
 const [comments,setComments]=useState<Record<string,string>>({});
 const [levels,setLevels]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  // The placement editor belongs to onboarding and can be disabled independently.
  // Its unavailability must never hide coach review of submitted chapter exams.
  const reviews=await call("/api/admin/journey-tests");
  setPending(reviews.attempts);
  const placement=await call("/api/journey/placement").catch(()=>({pending:[]}));
  setPlacements(placement.pending);
 },[]);
 useEffect(()=>{load().catch(e=>setError(String(e.message)));},[load]);
 async function review(attempt:Pending){
  const feedback=comments[attempt.id]?.trim();
  if(!feedback||feedback.length<5){setError("Bitte eine konkrete Rückmeldung für den Athleten eingeben.");return;}
  setError("");setMessage("");setBusy(attempt.id);
  try{
   const result=await call("/api/admin/journey-tests/"+attempt.id+"/review","POST",{coachFeedbackDe:feedback});
   setMessage(result.verdict==="PASSED"?
    result.nextLevel?"Test bestanden: Level "+result.nextLevel.replaceAll("_"," ")+" freigeschaltet.":
    result.nextChapterId?"Test bestanden: nächstes Kapitel freigeschaltet.":"Test bestanden. Einstufung kann jetzt bestätigt werden.":
    "Noch nicht bestanden. Hinweise und nächster Versuch sind für den Athleten sichtbar.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Prüfung fehlgeschlagen.");}
  finally{setBusy("");}
 }
 async function confirm(p:Placement){
  const chosen=levels[p.id]??p.selfLevel??"READY";
  if(!window.confirm("Einstiegslevel "+chosen.replaceAll("_"," ")+" für "+(p.user.name||"Athlet")+" bestätigen?"))return;
  setError("");setMessage("");setBusy(p.id);
  try{
   const result=await call("/api/journey/placement","POST",{enrollmentId:p.id,confirmedLevel:chosen});
   setMessage("Einstieg freigegeben. Erstes Kapitel: "+result.firstChapterId);
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Einstufung nicht möglich.");}
  finally{setBusy("");}
 }
 return <div className="j6-review-workspace">
  {error&&<div role="alert" className="j6-alert">{error}</div>}
  {message&&<div role="status" className="j6-success">{message}</div>}
  <section className="panel">
   <div className="j6-review-title"><div><span className="eyebrow">PRÜFUNG AUSSTEHEND</span><h2>Abschlusstests & Einstufungstests</h2></div><span>{pending.length} offen</span></div>
   {pending.length===0&&<p className="muted">Derzeit warten keine Prüfungen auf die Bewertung.</p>}
   <div className="j6-review-cards">{pending.map(x=><article className="j6-review-card" key={x.id}>
    <div className="j6-review-top"><div><span className="eyebrow">{x.kind==="PLACEMENT"?"EINSTUFUNGSTEST":"KAPITELABSCHLUSS"}</span><h3>{x.athlete.name}</h3>
     <p>{x.pathway} · {x.titleDe}</p></div><small>{date(x.submittedAt)}</small></div>
    <div className="j6-review-columns">
     <div><h4>Eingereichte Ergebnisse</h4><pre>{JSON.stringify(x.results,null,2)}</pre></div>
     <div><h4>Fachlich freigegebene Kriterien</h4><pre>{JSON.stringify(x.criteria,null,2)}</pre></div>
    </div>
    <label>Persönliche Rückmeldung<textarea rows={3} maxLength={2000} value={comments[x.id]??""} onChange={e=>setComments(old=>({...old,[x.id]:e.target.value}))}
     placeholder="Was wurde gut gemacht? Was soll als Nächstes verbessert werden?"/></label>
    <button className="primary compact" type="button" disabled={busy===x.id} onClick={()=>review(x)}>
     {busy===x.id?"WIRD GEPRÜFT …":"ERGEBNIS FACHLICH PRÜFEN"}</button>
    <p className="muted">Bestehen oder Nichtbestehen wird anhand der zuvor freigegebenen Kriterien ermittelt. Die persönliche Rückmeldung wird gespeichert.</p>
   </article>)}</div>
  </section>
  <section className="panel">
   <div className="j6-review-title"><div><span className="eyebrow">EINSTIEG FREIGEBEN</span><h2>Offene Einstufungen</h2></div><span>{placements.length} offen</span></div>
   <p className="muted">Ein bestandener Einstufungstest bestätigt die Messwerte. Der tatsächliche Startlevel wird hier nach deiner fachlichen Einschätzung freigegeben. Ohne Freigabe bleiben alle Kapitel geschlossen.</p>
   <div className="j6-review-cards">{placements.map(p=><div className="j6-placement" key={p.id}>
    <div><strong>{p.user.name||"Athlet"}</strong><small>{p.version.pathway.titleDe} · Selbsteinschätzung {p.selfLevel?.replaceAll("_"," ")||"offen"}</small></div>
    <label>Bestätigtes Level<select value={levels[p.id]??p.selfLevel??"READY"} onChange={e=>setLevels(old=>({...old,[p.id]:e.target.value}))}>
      {p.version.levels.map(x=><option value={x.code} key={x.code}>{x.code.replaceAll("_"," ")}</option>)}
     </select></label>
    <button type="button" className="primary compact" disabled={busy===p.id} onClick={()=>confirm(p)}>EINSTIEG BESTÄTIGEN</button>
   </div>)}</div>
  </section>
 </div>;
}
