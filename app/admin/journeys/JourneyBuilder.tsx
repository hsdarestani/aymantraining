"use client";
import {useEffect,useState} from "react";
import type {CurriculumDraft} from "../../../lib/journey-editor-contract";

type Step=CurriculumDraft["levels"][number];
type Chapter=Step["chapters"][number];
type Item=Chapter["items"][number];
type Test=NonNullable<Chapter["test"]>;
type Media=Item["media"][number];
type Path={id:string;titleDe:string;description:string;goals:string[];versions:{id:string;version:number;state:string;updatedAt:string;publishedAt:string|null}[]};
type Version=CurriculumDraft & {id:string;pathwayId:string;version:number;state:string;titleDe:string;description:string;goalSlugs:string[];publishedAt:string|null;exercises:{id:string;nameDe:string;category:string}[];plans:{id:string;name:string}[]};
const goals=[{slug:"football",label:"Fußball"},{slug:"athleticism",label:"Athletik"},{slug:"muscle_building",label:"Muskelaufbau"},{slug:"fat_loss",label:"Fettabbau"},{slug:"calisthenics",label:"Calisthenics"},{slug:"health",label:"Gesundheit"}];
const goalLabel=(slug:string)=>goals.find(x=>x.slug===slug)?.label??slug;
const newTest=():Test=>({titleDe:"",criteria:{schemaVersion:1,metrics:[]},retestRules:{minHoursAfterFailure:0,guidanceDe:""},approved:false});
const newChapter=():Chapter=>({titleDe:"Neues Kapitel",description:"",plannedDurationDays:14,items:[],test:null});
const newItem=(kind:Item["kind"]):Item=>({kind,titleDe:kind==="GUIDANCE"?"Anleitung":"Neue Übung",description:"",exerciseId:null,trainingPlanId:null,mandatory:true,media:[]});
const clean=(v:Version):CurriculumDraft=>({revision:v.revision,notes:v.notes,levels:v.levels,placement:v.placement});
async function request(path:string,method="GET",body?:unknown){
 const result=await fetch(path,{method,headers:body===undefined?undefined:{"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await result.json().catch(()=>({error:"Netzwerkfehler."}));
 if(!result.ok)throw Error(data.error||"Vorgang fehlgeschlagen.");
 return data;
}
function RenderAssessment({value,onChange,onRemove,readOnly}:{value:Test;onChange:(next:Test)=>void;onRemove:()=>void;readOnly:boolean}){
  const change=(fn:(v:Test)=>void)=>{const next=structuredClone(value);fn(next);onChange(next);};
  return <div className="journey-test">
   <div className="journey-card-heading"><strong>Abschlusstest / Einstufungstest</strong>{!readOnly&&<button type="button" onClick={onRemove}>Entfernen</button>}</div>
   <label>Testname<input disabled={readOnly} value={value.titleDe} onChange={e=>change(x=>{x.titleDe=e.target.value})}/></label>
   <div className="journey-metric-head"><strong>Bestehenskriterien</strong>{!readOnly&&<button type="button" onClick={()=>change(x=>{x.criteria.metrics.push({key:"",unit:"reps",min:1})})}>+ Kriterium</button>}</div>
   {value.criteria.metrics.map((m,i)=><div className="journey-metric" key={i}>
    <label>Messgröße<input disabled={readOnly} value={m.key} placeholder="z. B. pushups" onChange={e=>change(x=>{x.criteria.metrics[i].key=e.target.value})}/></label>
    <label>Einheit<input disabled={readOnly} value={m.unit} placeholder="reps" onChange={e=>change(x=>{x.criteria.metrics[i].unit=e.target.value})}/></label>
    <label>Mindestens<input disabled={readOnly} type="number" value={m.min??""} onChange={e=>change(x=>{if(e.target.value==="")delete x.criteria.metrics[i].min;else x.criteria.metrics[i].min=Number(e.target.value)})}/></label>
    <label>Höchstens<input disabled={readOnly} type="number" value={m.max??""} onChange={e=>change(x=>{if(e.target.value==="")delete x.criteria.metrics[i].max;else x.criteria.metrics[i].max=Number(e.target.value)})}/></label>
    {!readOnly&&<button type="button" onClick={()=>change(x=>{x.criteria.metrics.splice(i,1)})}>×</button>}
   </div>)}
   <div className="journey-form-row">
    <label>Wiederholung frühestens nach (Stunden)<input disabled={readOnly} type="number" min={0} max={8760} value={value.retestRules?.minHoursAfterFailure??0} onChange={e=>change(x=>{x.retestRules={...x.retestRules,minHoursAfterFailure:Number(e.target.value)}})}/></label>
    <label>Hinweis nach Nichtbestehen<input disabled={readOnly} value={value.retestRules?.guidanceDe??""} onChange={e=>change(x=>{x.retestRules={...x.retestRules,minHoursAfterFailure:x.retestRules?.minHoursAfterFailure??0,guidanceDe:e.target.value}})}/></label>
   </div>
   <label className="journey-check"><input disabled={readOnly} type="checkbox" checked={value.approved} onChange={e=>change(x=>{x.approved=e.target.checked})}/> Kriterien durch Trainer fachlich geprüft und freigegeben</label>
  </div>;
 }

export default function JourneyBuilder(){
 const [paths,setPaths]=useState<Path[]>([]);
 const [waiting,setWaiting]=useState(0);
 const [selected,setSelected]=useState("");
 const [version,setVersion]=useState<Version|null>(null);
 const [draft,setDraft]=useState<CurriculumDraft|null>(null);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [selectedGoals,setSelectedGoals]=useState<string[]>(["football","athleticism","muscle_building"]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [dirty,setDirty]=useState(false);
 const [uploading,setUploading]=useState("");
 const readOnly=version?.state!=="DRAFT";
 async function refresh(){
  const response=await request("/api/admin/journeys");
  setPaths(response.paths);setWaiting(response.waiting);
 }
 async function load(id:string){
  if(dirty&&!window.confirm("Ungespeicherte Änderungen verwerfen?"))return;
  setError("");setNotice("");setBusy(true);
  try{
   const data=await request("/api/admin/journeys/"+encodeURIComponent(id));
   setVersion(data.version);setDraft(clean(data.version));setSelected(id);setDirty(false);
  }catch(e){setError(String(e instanceof Error?e.message:e));}
  finally{setBusy(false);}
 }
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
 function edit(change:(value:CurriculumDraft)=>void){
  if(!draft||readOnly)return;
  const next=structuredClone(draft);change(next);setDraft(next);setDirty(true);
 }
 function chapterEdit(li:number,ci:number,change:(ch:Chapter)=>void){edit(d=>change(d.levels[li].chapters[ci]));}
 function itemEdit(li:number,ci:number,ii:number,change:(it:Item)=>void){chapterEdit(li,ci,c=>change(c.items[ii]));}
 function testEdit(li:number,ci:number,change:(value:Test)=>void){
  chapterEdit(li,ci,ch=>{if(ch.test)change(ch.test);});
 }
 async function createPath(){
  if(!title.trim()||!selectedGoals.length){setError("Titel und mindestens ein Ziel auswählen.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const created=await request("/api/admin/journeys","POST",{titleDe:title,description,goals:selectedGoals});
   await refresh();setTitle("");setDescription("");await load(created.versionId);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 async function save(){
  if(!version||!draft)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await request("/api/admin/journeys/"+version.id,"PUT",draft);
   const next={...draft,revision:result.revision};setDraft(next);
   setVersion({...version,...next});setDirty(false);setNotice("Entwurf gespeichert.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 async function publish(){
  if(!version||!draft||dirty)return;
  if(!window.confirm("Version "+version.version+" verbindlich veröffentlichen? Sie bleibt danach unveränderlich."))return;
  setBusy(true);setError("");setNotice("");
  try{const result=await request("/api/admin/journeys/"+version.id+"/publish","POST",{});
   setNotice("Veröffentlicht. "+result.matchedIntakes+" offene Zielkombinationen vorgemerkt.");
   await refresh();await load(version.id);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 async function clone(pathwayId:string){
  if(dirty&&!window.confirm("Ungespeicherte Änderungen verwerfen?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await request("/api/admin/journeys/clone","POST",{pathwayId});
   setDirty(false);await refresh();await load(result.id);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 async function upload(li:number,ci:number,ii:number,file:File,role:Media["role"],presenter:Media["presenter"]){
  if(!file)return;
  const key=li+"."+ci+"."+ii+"."+role;
  setUploading(key);setError("");
  try{
   const form=new FormData();
   form.set("file",file);form.set("kind",role==="EXPLANATION_VIDEO"?"EXERCISE_VIDEO":"EXERCISE_IMAGE");form.set("scope","JOURNEY");
   const r=await fetch("/api/media",{method:"POST",body:form});
   const body=await r.json();
   if(!r.ok)throw Error(body.error||"Hochladen fehlgeschlagen.");
   itemEdit(li,ci,ii,it=>{
    it.media=it.media.filter(m=>!(m.role===role&&m.presenter===presenter));
    it.media.push({mediaAssetId:body.asset.id,role,presenter,durationSec:role==="EXPLANATION_VIDEO"?10:null});
   });
   setNotice("Medium hochgeladen. Noch Entwurf speichern.");
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setUploading("");}
 }
 return <div className="journey-workspace">
  <section className="panel journey-side">
   <div className="journey-headline"><h2>Trainingswege</h2><span>{paths.length} Wege</span></div>
   <p className="muted">{waiting} offene Anfragen warten auf eine passende Kombination.</p>
   <div className="journey-list">{paths.map(p=><div className="journey-list-row" key={p.id}><strong>{p.titleDe}</strong><small>{p.goals.map(goalLabel).join(" + ")}</small><div className="journey-versions">{p.versions.map(v=><button type="button" className={selected===v.id?"journey-active":""} key={v.id} onClick={()=>load(v.id)} disabled={busy}>V{v.version} · {v.state==="PUBLISHED"?"Veröffentlicht":"Entwurf"}</button>)}</div>{p.versions.length>0&&p.versions.every(v=>v.state!=="DRAFT")&&<button type="button" disabled={busy} className="journey-outline" onClick={()=>clone(p.id)}>+ Neue Version</button>}</div>)}</div>
   <div className="journey-create">
    <h3>Neuen Weg erstellen</h3>
    <label>Name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Fußball, Athletik und Muskelaufbau"/></label>
    <label>Beschreibung<textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Für wen ist dieser Weg?"/></label>
    <strong>Ziele kombinieren</strong>
    <div className="journey-goals">{goals.map(g=><label key={g.slug}><input type="checkbox" checked={selectedGoals.includes(g.slug)} onChange={e=>setSelectedGoals(old=>e.target.checked?[...old,g.slug]:old.filter(x=>x!==g.slug))}/>{g.label}</label>)}</div>
    <button type="button" className="primary compact" disabled={busy} onClick={createPath}>WEG ERSTELLEN</button>
   </div>
  </section>
  <section className="journey-edit">
   {error&&<div className="journey-alert" role="alert">{error}</div>}
   {notice&&<div className="journey-ok" role="status">{notice}</div>}
   {!draft||!version?<article className="panel journey-empty"><h2>Wähle einen Weg</h2><p>Oder erstelle links einen neuen Trainingsweg für eine Kombination deiner Ziele.</p></article>:<>
    <div className="panel journey-sticky">
     <div><small>VERSION {version.version} · {version.state==="DRAFT"?"ENTWURF":"VERÖFFENTLICHT"}</small><h2>{version.titleDe}</h2><p>{version.goalSlugs.map(goalLabel).join(" + ")}</p></div>
     <div className="journey-toolbar">{dirty&&<span className="journey-dirty">Ungespeichert</span>}<button type="button" onClick={()=>load(version.id)} disabled={busy}>Neu laden</button>{!readOnly&&<><button type="button" className="primary compact" onClick={save} disabled={busy||!dirty}>SPEICHERN</button><button type="button" className="journey-publish" onClick={publish} disabled={busy||dirty}>VERÖFFENTLICHEN</button></>}</div>
    </div>
    <div className="panel journey-meta"><label>Versionsnotiz<textarea rows={2} disabled={readOnly} value={draft.notes} onChange={e=>edit(x=>{x.notes=e.target.value})}/></label>
    <div className="journey-card-heading"><h3>Einstufungstest</h3>{!draft.placement&&!readOnly&&<button type="button" onClick={()=>edit(d=>{d.placement=newTest()})}>+ Test anlegen</button>}</div>
    {draft.placement?<RenderAssessment readOnly={readOnly} value={draft.placement} onChange={next=>edit(d=>{d.placement=next})} onRemove={()=>edit(d=>{d.placement=null})}/>:<p className="muted">Noch kein Einstufungstest. Der Coach kann den Einstieg später alternativ persönlich bestätigen.</p>}
    </div>
    {draft.levels.map((l,li)=><details key={l.code} className="panel journey-level" open={li===0}>
     <summary><strong>{li+1}. {l.code.replaceAll("_"," ")}</strong><span>{l.chapters.length} Kapitel</span></summary>
     <label>Levelbeschreibung<textarea rows={2} disabled={readOnly} value={l.description} onChange={e=>edit(d=>{d.levels[li].description=e.target.value})}/></label>
     {l.chapters.map((ch,ci)=><section className="journey-chapter" key={ci}>
      <div className="journey-card-heading"><strong>KAPITEL {ci+1}</strong><div>{!readOnly&&<><button type="button" disabled={ci===0} onClick={()=>edit(d=>{const cs=d.levels[li].chapters;[cs[ci-1],cs[ci]]=[cs[ci],cs[ci-1]]})}>↑</button><button type="button" disabled={ci===l.chapters.length-1} onClick={()=>edit(d=>{const cs=d.levels[li].chapters;[cs[ci+1],cs[ci]]=[cs[ci],cs[ci+1]]})}>↓</button><button type="button" onClick={()=>edit(d=>{d.levels[li].chapters.splice(ci,1)})}>Entfernen</button></>}</div></div>
      <div className="journey-form-row"><label>Titel<input disabled={readOnly} value={ch.titleDe} onChange={e=>chapterEdit(li,ci,c=>{c.titleDe=e.target.value})}/></label><label>Dauer (Tage)<input type="number" min={1} max={365} disabled={readOnly} value={ch.plannedDurationDays??""} onChange={e=>chapterEdit(li,ci,c=>{c.plannedDurationDays=e.target.value===""?null:Number(e.target.value)})}/></label></div>
      <label>Abschnittsbeschreibung<textarea disabled={readOnly} rows={2} value={ch.description} onChange={e=>chapterEdit(li,ci,c=>{c.description=e.target.value})}/></label>
      <div className="journey-card-heading"><h4>Übungen & Inhalte</h4>{!readOnly&&<div>{(["GUIDANCE","EXERCISE","TRAINING_PLAN"] as const).map(kind=><button key={kind} type="button" onClick={()=>chapterEdit(li,ci,c=>{c.items.push(newItem(kind))})}>+ {kind==="GUIDANCE"?"Hinweis":kind==="EXERCISE"?"Übung":"Plan"}</button>)}</div>}</div>
      {ch.items.map((it,ii)=><div className="journey-item" key={ii}>
       <div className="journey-card-heading"><strong>{ii+1}. {it.kind==="EXERCISE"?"Übung":it.kind==="TRAINING_PLAN"?"Trainingsplan":"Hinweis"}</strong>{!readOnly&&<button type="button" onClick={()=>chapterEdit(li,ci,c=>{c.items.splice(ii,1)})}>× Entfernen</button>}</div>
       <div className="journey-form-row"><label>Titel<input disabled={readOnly} value={it.titleDe} onChange={e=>itemEdit(li,ci,ii,v=>{v.titleDe=e.target.value})}/></label>
       {it.kind==="EXERCISE"&&<label>Übung<select disabled={readOnly} value={it.exerciseId??""} onChange={e=>itemEdit(li,ci,ii,v=>{v.exerciseId=e.target.value||null})}><option value="">Übung auswählen</option>{version.exercises.map(x=><option key={x.id} value={x.id}>{x.nameDe} · {x.category}</option>)}</select></label>}
       {it.kind==="TRAINING_PLAN"&&<label>Plan<select disabled={readOnly} value={it.trainingPlanId??""} onChange={e=>itemEdit(li,ci,ii,v=>{v.trainingPlanId=e.target.value||null})}><option value="">Plan auswählen</option>{version.plans.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div>
       <label>Beschreibung / schriftliche Anleitung<textarea rows={2} disabled={readOnly} value={it.description} onChange={e=>itemEdit(li,ci,ii,v=>{v.description=e.target.value})}/></label>
       <label className="journey-check"><input type="checkbox" disabled={readOnly} checked={it.mandatory} onChange={e=>itemEdit(li,ci,ii,v=>{v.mandatory=e.target.checked})}/> Pflichtinhalt für den Abschlusstest</label>
       {it.kind==="EXERCISE"&&<div className="journey-media"><h4>Trainermedien · FREE Bilder & Text · PRO Erklärvideo</h4>
        {it.media.map((m,mi)=><div key={mi} className="journey-media-item"><span>{m.role.replaceAll("_"," ")} · {m.presenter} · {m.role==="EXPLANATION_VIDEO"?"PRO":"FREE"}</span>{m.role==="EXPLANATION_VIDEO"&&<label>Länge in Sekunden<input type="number" min={8} max={12} disabled={readOnly} value={m.durationSec??10} onChange={e=>itemEdit(li,ci,ii,v=>{v.media[mi].durationSec=Number(e.target.value)})}/></label>}<a target="_blank" rel="noreferrer" href={"/api/media/"+encodeURIComponent(m.mediaAssetId)}>Vorschau</a>{!readOnly&&<button type="button" onClick={()=>itemEdit(li,ci,ii,v=>{v.media.splice(mi,1)})}>Entfernen</button>}</div>)}
        {!readOnly&&<div className="journey-media-uploader"><label>Medienrolle<select id={"jr-"+li+"-"+ci+"-"+ii} defaultValue="START_IMAGE"><option value="START_IMAGE">Anfangsbild (FREE)</option><option value="MIDDLE_IMAGE">Zwischenbild (FREE)</option><option value="END_IMAGE">Endbild (FREE)</option><option value="EXPLANATION_VIDEO">Erklärvideo (PRO · 8 bis 12 Sek.)</option></select></label>
         <label>Vorführende Person<select id={"jp-"+li+"-"+ci+"-"+ii}><option value="COACH">Coach</option><option value="TRAINER">Trainerin</option></select></label>
         <label>Bild / Video<input type="file" disabled={Boolean(uploading)} accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" onChange={async e=>{
          const file=e.target.files?.[0];if(!file)return;
          const role=(document.getElementById("jr-"+li+"-"+ci+"-"+ii) as HTMLSelectElement).value as Media["role"];
          const presenter=(document.getElementById("jp-"+li+"-"+ci+"-"+ii) as HTMLSelectElement).value as Media["presenter"];
          await upload(li,ci,ii,file,role,presenter);e.target.value="";
         }}/></label>{uploading&&<span>Medium wird hochgeladen…</span>}</div>}
       </div>}
      </div>)}
      <div className="journey-card-heading"><h4>Kapitelabschluss</h4>{!ch.test&&!readOnly&&<button type="button" onClick={()=>chapterEdit(li,ci,c=>{c.test=newTest()})}>+ Abschlusstest</button>}</div>
      {ch.test&&<RenderAssessment readOnly={readOnly} value={ch.test} onChange={next=>chapterEdit(li,ci,c=>{c.test=next})} onRemove={()=>chapterEdit(li,ci,c=>{c.test=null})}/>}
     </section>)}
     {!readOnly&&<button className="journey-outline" type="button" onClick={()=>edit(d=>{d.levels[li].chapters.push(newChapter())})}>+ KAPITEL HINZUFÜGEN</button>}
    </details>)}
   </>}
  </section>
 </div>;
}
