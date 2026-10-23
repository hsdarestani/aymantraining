"use client";
import {Copy,useT} from "../components/Locale";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Code="READY"|"AWAKE"|"DIFFERENT"|"BE_DIFFERENT"|"TRULY_DIFFERENT";
type Preview={id:string;titleDe:string;position:number;unlocked:boolean;finished:boolean;mandatoryDone:number|null;mandatoryTotal:number|null};
type Level={code:Code;description:string;earned:boolean;chapters:Preview[]};
type Enrollment={id:string;pathway:string;version:number;state:string;selfLevel:Code|null;confirmedLevel:Code|null;levels:Level[];completedChapters:number;totalChapters:number};
type Media={role:string;presenter:string;proOnly:boolean;available:boolean;url:string|null};
type Item={id:string;kind:string;titleDe:string;description:string;mandatory:boolean;done:boolean;exercise:{nameDe:string;equipment:string|null;coachTips:string[]}|null;trainingPlan:{name:string;description:string|null}|null;media:Media[]};
type Detail={id:string;enrollmentId:string;level:Code;titleDe:string;description:string;finished:boolean;mandatoryDone:number;mandatoryTotal:number;items:Item[];test:{titleDe:string}|null};
type Overview={goals:{slug:string;label:string}[];levels:{code:Code;description:string}[];testsEnabled:boolean;intake:{goals:string[];status:string;selfLevel:Code}|null;legacy:{workoutCount:number;transitionAvailable:boolean};enrollments:Enrollment[]};
async function fetchJson(url:string,method="GET",body?:unknown){
 const r=await fetch(url,{method,headers:body?{"content-type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,cache:"no-store"});
 const json=await r.json().catch(()=>({error:"Verbindungsfehler"}));
 if(!r.ok)throw Error(json.error||"Anfrage fehlgeschlagen");return json;
}
const label=(x:string)=>x.replaceAll("_"," ");
export default function JourneyOverview(){
 const t=useT();
 const [data,setData]=useState<Overview|null>(null),[detail,setDetail]=useState<Detail|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [selectedGoals,setSelectedGoals]=useState<string[]>([]),[selfLevel,setSelfLevel]=useState<Code>("READY"),[consent,setConsent]=useState(false);
 const reload=useCallback(async()=>{const v=await fetchJson("/api/journey/overview");setData(v);},[]);
 useEffect(()=>{reload().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[reload]);
 async function openChapter(enrollmentId:string,ch:Preview){
  if(!ch.unlocked)return;setBusy(true);setError("");
  try{const v=await fetchJson("/api/journey/chapters/"+encodeURIComponent(ch.id)+"?enrollmentId="+encodeURIComponent(enrollmentId));setDetail(v.chapter);}
  catch(e){setError(e instanceof Error?e.message:"Kapitel nicht verfügbar");setDetail(null);}
  finally{setBusy(false);}
 }
 async function mark(itemId:string){
  if(!detail)return;setBusy(true);setError("");
  try{
   await fetchJson("/api/journey/tests/items","POST",{enrollmentId:detail.enrollmentId,itemId});
   const v=await fetchJson("/api/journey/chapters/"+detail.id+"?enrollmentId="+detail.enrollmentId);
   setDetail(v.chapter);await reload();
  }catch(e){setError(e instanceof Error?e.message:"Nicht gespeichert");}
  finally{setBusy(false);}
 }
 async function optIn(){
  setBusy(true);setError("");setNotice("");
  try{
   const v=await fetchJson("/api/journey/legacy-transition","POST",{goals:selectedGoals,selfLevel,confirmLegacyPreservation:true});
   setNotice(v.status==="PENDING_PATHWAY"?"Ein passender Weg wird vom Trainer vorbereitet.":"Deine Einstufung wartet auf die Freigabe durch den Trainer.");
   await reload();
  }catch(e){setError(e instanceof Error?e.message:"Wechsel nicht möglich");}
  finally{setBusy(false);}
 }
 if(loading)return <p role="status"><Copy text="Trainingsweg wird geladen …"/></p>;
 if(!data)return <p role="alert" className="j7-error">{error||"Trainingsweg nicht erreichbar."}</p>;
 return <div className="j7-stack">
  {error&&<p role="alert" className="j7-error"><Copy text={error}/></p>}{notice&&<p role="status" className="j7-success"><Copy text={notice}/></p>}
  {data.intake&&<section className="panel j7-intake"><strong><Copy text="DEINE AUSWAHL"/></strong><p>{data.intake.goals.map(g=>t(data.goals.find(x=>x.slug===g)?.label??g)).join(" + ")}</p>
   <p><Copy text={data.intake.status==="PENDING_PATHWAY"?"Dein Trainingsweg wird vorbereitet.":data.intake.status==="PENDING_PLACEMENT"?"Deine Einstufung wird geprüft.":"Dein Einstieg wurde bestätigt."}/></p>
   <small><Copy text={"Deine Selbsteinschätzung "}/>{label(data.intake.selfLevel)}<Copy text={" öffnet noch keine Kapitel."}/></small>
  </section>}
  {!data.enrollments.length&&data.legacy.transitionAvailable&&<section className="panel j7-transition">
   <span className="eyebrow"><Copy text="FREIWILLIGER WECHSEL"/></span><h2><Copy text="Deine Leistungen bleiben erhalten."/></h2>
   <p><Copy text="Bestehende Trainingspläne, Einheiten, Punkte und Auszeichnungen bleiben unverändert. Du entscheidest selbst, ob du den neuen Weg beginnst. Die Einstufung wird später bestätigt."/></p>
   <p><Copy text={"Deine bisherigen Trainingseinheiten: "}/>{data.legacy.workoutCount}</p>
   <strong><Copy text="Ziele kombinieren"/></strong><div className="j7-goals">{data.goals.map(g=><label key={g.slug}><input type="checkbox" checked={selectedGoals.includes(g.slug)} onChange={e=>setSelectedGoals(old=>e.target.checked?[...old,g.slug]:old.filter(x=>x!==g.slug))}/><Copy text={g.label}/></label>)}</div>
   <label><Copy text={"Deine Selbsteinschätzung"}/><select value={selfLevel} onChange={e=>setSelfLevel(e.target.value as Code)}>{data.levels.map(l=><option key={l.code} value={l.code}>{label(l.code)}</option>)}</select></label>
   <label className="j7-agree"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><Copy text={" Ich möchte den neuen Weg beginnen. Meine bisherigen Daten werden nicht überschrieben."}/></label>
   <button className="primary compact" disabled={busy||!consent||!selectedGoals.length} onClick={optIn}><Copy text="WECHSEL VORMERKEN"/></button>
  </section>}
  {data.enrollments.map(e=><section key={e.id} className="panel j7-path"><header className="j7-head"><div><span className="eyebrow"><Copy text={"TRAININGSWEG · VERSION "}/>{e.version}</span><h2>{e.pathway}</h2><p><Copy text={e.confirmedLevel?"BESTÄTIGT: "+label(e.confirmedLevel):"EINSTUFUNG AUSSTEHEND"}/></p></div><strong>{e.completedChapters}/{e.totalChapters}<Copy text={" KAPITEL"}/></strong></header>
   {e.levels.map(l=><div className="j7-level" key={l.code}><div className="j7-level-head"><div><h3>{label(l.code)}</h3><p><Copy text={l.description}/></p></div><span><Copy text={l.earned?"ERREICHT":"NOCH GESPERRT"}/></span></div>
    <div className="j7-chapters">{l.chapters.map(ch=><button key={ch.id} type="button" disabled={!ch.unlocked||busy} className={ch.unlocked?"j7-chapter j7-unlocked":"j7-chapter j7-locked"} onClick={()=>openChapter(e.id,ch)}>
     <strong>{ch.position}. {ch.titleDe}</strong><small><Copy text={ch.finished?"ABGESCHLOSSEN":ch.unlocked?String(ch.mandatoryDone)+"/"+ch.mandatoryTotal+" PFLICHTINHALTE":"GESPERRT"}/></small>
    </button>)}</div></div>)}
   {data.testsEnabled&&<Link className="j7-link" href="/journey/tests"><Copy text={"KAPITELTESTS & TRAINERRÜCKMELDUNG →"}/></Link>}
  </section>)}
  {detail&&<section className="panel j7-detail" aria-live="polite"><div className="j7-head"><div><span className="eyebrow">{label(detail.level)}<Copy text={" · FREIGESCHALTET"}/></span><h2>{detail.titleDe}</h2><p>{detail.description}</p></div><button className="j7-close" onClick={()=>setDetail(null)}><Copy text={"SCHLIESSEN ×"}/></button></div>
   <p>{detail.mandatoryDone}<Copy text={" von "}/>{detail.mandatoryTotal}<Copy text={" Pflichtinhalten erledigt"}/></p>
   {detail.items.map(it=><article className="j7-item" key={it.id}><div className="j7-head"><div><span className="eyebrow"><Copy text={it.kind==="EXERCISE"?"ÜBUNG":it.kind==="TRAINING_PLAN"?"TRAININGSPLAN":"HINWEIS"}/></span><h3>{it.titleDe}</h3></div><small><Copy text={it.done?"ERLEDIGT":it.mandatory?"PFLICHT":"OPTIONAL"}/></small></div>
    {it.description&&<p>{it.description}</p>}
    {it.exercise&&<><p>{it.exercise.nameDe}{it.exercise.equipment?" · "+it.exercise.equipment:""}</p>{it.exercise.coachTips.map((tip,i)=><p key={i}>{tip}</p>)}</>}
    {it.trainingPlan&&<p>{it.trainingPlan.name} · {it.trainingPlan.description||""}</p>}
    {!!it.media.length&&<div className="j7-media">{it.media.map((m,i)=><div key={i} className="j7-media-tile"><strong><Copy text={m.presenter==="TRAINER"?"TRAINERIN":"TRAINER"}/> · <Copy text={m.role==="EXPLANATION_VIDEO"?"ERKLÄRVIDEO":"ÜBUNGSBILD"}/></strong>
     {!m.available?<p><Copy text={m.proOnly?"Mit PRO verfügbar.":"Aufnahme derzeit nicht verfügbar."}/></p>:m.role==="EXPLANATION_VIDEO"?<video controls playsInline preload="metadata" src={m.url!}/>:<img src={m.url!} alt="Übungsdarstellung" loading="lazy"/>}
    </div>)}</div>}
    {data.testsEnabled&&<button className="j7-close" disabled={busy||it.done||detail.finished} onClick={()=>mark(it.id)}><Copy text={it.done?"ERLEDIGT":"ALS ERLEDIGT MARKIEREN"}/></button>}
   </article>)}
   {detail.test&&data.testsEnabled&&<Link className="j7-link" href="/journey/tests"><Copy text={"KAPITELTEST: "}/>{detail.test.titleDe} →</Link>}
  </section>}
 </div>;
}
