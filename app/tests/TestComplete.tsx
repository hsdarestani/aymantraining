"use client";
import {Copy,LocalizedElement} from "../components/Locale";



import {useEffect,useMemo,useState} from "react";
type Block={metric:string;label:string;unit:string;instructions?:string};
export default function TestComplete({id,name,definition}:{id:string;name:string;definition:Block[]}){
 const [values,setValues]=useState<Record<string,string>>({});
 const [status,setStatus]=useState("");
 const [timer,setTimer]=useState(0),[running,setRunning]=useState(false),[activeMetric,setActiveMetric]=useState<string|null>(null);
 const [video,setVideo]=useState<File|null>(null);
 useEffect(()=>{if(!running)return;const h=window.setInterval(()=>setTimer(x=>x+.1),100);return()=>clearInterval(h)},[running]);
 const blocks=useMemo(()=>definition.length?definition:[{metric:"pushups",label:"Push ups",unit:"Wdh"}],[definition]);
 function timerFor(b:Block){setActiveMetric(b.metric);setTimer(0);setRunning(true)}
 function stopTimer(b:Block){setRunning(false);const value=b.unit==="minutes"?(timer/60).toFixed(2):timer.toFixed(1);setValues(v=>({...v,[b.metric]:value}))}
 async function save(){
   const results=blocks.map(b=>({metric:b.metric,value:Number(values[b.metric]),unit:b.unit})).filter(x=>Number.isFinite(x.value));
   if(results.length!==blocks.length){setStatus("Bitte alle Testwerte eintragen.");return}
   let videoUrl:string|undefined;
   if(video){
     await fetch("/api/consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"media_processing",version:"1.0",granted:true})});
     const form=new FormData();form.set("kind","TEST_VIDEO");form.set("file",video);
     const upload=await fetch("/api/media",{method:"POST",body:form});const j=await upload.json().catch(()=>({}));
     if(!upload.ok){setStatus(j.error||"Video konnte nicht hochgeladen werden.");return}
     videoUrl=`/api/media/${j.asset.id}`;
   }
   const payload={results:results.map(x=>({...x,videoUrl})),notes:video?"Test mit privatem Video Beleg":undefined};
   const r=await fetch(`/api/performance-tests/${id}/complete`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   const j=await r.json().catch(()=>({}));setStatus(r.ok?"Test gespeichert. Leistungswert wurde aktualisiert.":j.error||"Speichern fehlgeschlagen.");if(r.ok)setTimeout(()=>location.reload(),600);
 }
 return <article className="panel guided-test"><div className="panel-head"><div><span className="eyebrow"><Copy text={"GEFÜHRTER TEST"}/></span><h2>{name}</h2></div><span className="tag">{blocks.length}<Copy text={"BLÖCKE"}/></span></div>
   <div className="guided-blocks">{blocks.map((b,i)=><section key={b.metric}><div><span>{String(i+1).padStart(2,"0")}</span><strong><Copy text={b.label}/></strong><small>{b.instructions||"Sauber ausführen und Ergebnis eintragen."}</small></div><div className="test-value"><LocalizedElement as="input" type="number" step=".01" value={values[b.metric]||""} onChange={e=>setValues(v=>({...v,[b.metric]:e.target.value}))} placeholder="Ergebnis"/><b>{b.unit}</b></div>{["seconds","minutes"].includes(b.unit)&&<button className="secondary" type="button" onClick={()=>running&&activeMetric===b.metric?stopTimer(b):timerFor(b)}><Copy text={running&&activeMetric===b.metric?`STOPP ${timer.toFixed(1)}`:"TIMER"}/></button>}</section>)}</div>
   <label className="field-label"><Copy text={"Optionales Testvideo"}/><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e=>setVideo(e.target.files?.[0]||null)}/><small><Copy text={"Privat. Nur für dich und berechtigte Trainer."}/></small></label>
   <button className="primary compact" onClick={save}><Copy text={"TEST ABSCHLIESSEN →"}/></button>{status&&<small className="muted"><Copy text={status}/></small>}
 </article>;
}