"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import "../celebrations.css";
type Award={id:string;title:string;message:string;intensity:"SMALL"|"MEDIUM"|"FULL";achievedAt:string};
type Settings={enabled:boolean;reduceMotion:boolean};
type Response={ok:boolean;enabled:boolean;preference:Settings;pending:Award[]};
export default function CelebrationOverlay(){
 const [loaded,setLoaded]=useState(false),[queue,setQueue]=useState<Award[]>([]);
 const [settings,setSettings]=useState<Settings>({enabled:true,reduceMotion:false});
 const [systemReduce,setSystemReduce]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const modal=useRef<HTMLDialogElement>(null);
 const load=useCallback(async()=>{
  const res=await fetch("/api/celebrations",{cache:"no-store",credentials:"same-origin"});
  if(!res.ok)return;
  const data:Response=await res.json();
  if(!data.enabled)return;
  setSettings(data.preference);
  setQueue(data.pending);setLoaded(true);
 },[]);
 useEffect(()=>{void load().catch(()=>{})},[load]);
 useEffect(()=>{
  const query=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setSystemReduce(query.matches);update();
  query.addEventListener("change",update);
  return()=>query.removeEventListener("change",update);
 },[]);
 const active=loaded&&settings.enabled&&queue.length>0?queue[0]:null;
 useEffect(()=>{
  const d=modal.current;
  if(!d)return;
  if(active&&!d.open)d.showModal();
  else if(!active&&d.open)d.close();
  // Restores original keyboard focus when dialog closes.
  return()=>{if(d.open)d.close()};
 },[active?.id]);
 async function seen(){
  if(!active||busy)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/celebrations",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({action:"ACKNOWLEDGE",awardId:active.id})});
   if(!res.ok)throw Error("Bestätigung derzeit nicht möglich.");
   setQueue(items=>items.filter(x=>x.id!==active.id));
  }catch(e){setError(e instanceof Error?e.message:"Versuche es erneut.");}
  finally{setBusy(false)}
 }
 async function reduce(){
  setBusy(true);setError("");
  const prior=settings;
  const next={...settings,reduceMotion:true};
  try{
   const res=await fetch("/api/celebrations",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({action:"SET_PREFERENCES",...next})});
   if(!res.ok)throw Error("Die Einstellung konnte nicht gespeichert werden.");
   setSettings(next);
  }catch(e){setSettings(prior);setError(e instanceof Error?e.message:"Fehler");}
  finally{setBusy(false)}
 }
 const isReduced=systemReduce||settings.reduceMotion;
 return <dialog ref={modal} className={"bd-celebration "+(active?"bd-celebration-"+active.intensity.toLowerCase():"")+(isReduced?" bd-celebration-still":"")}
  aria-labelledby="bd-celebration-title" aria-describedby="bd-celebration-description"
  onCancel={e=>{e.preventDefault();void seen()}}>
  {active&&<div className="bd-celebration-inner">
   <div className="bd-celebration-art" aria-hidden="true">
    <div className="bd-celebration-halo"/>
    <div className="bd-celebration-symbol">✦</div>
    {active.intensity!=="SMALL"&&Array.from({length:active.intensity==="FULL"?10:5},(_,i)=>
     <i key={i} style={{["--piece" as string]:i}}/>)}
   </div>
   <span className="bd-celebration-eyebrow">{active.intensity==="FULL"?"EIN GROSSER MOMENT":active.intensity==="MEDIUM"?"DU HAST ES GESCHAFFT":"EIN ECHTER SCHRITT"}</span>
   <h2 id="bd-celebration-title">{active.title}</h2>
   <p id="bd-celebration-description">{active.message}</p>
   <p className="bd-celebration-note">Du hast dir diesen Erfolg verdient. Er wurde durch deinen dokumentierten Fortschritt bestätigt.</p>
   {error&&<p className="bd-celebration-error" role="alert">{error}</p>}
   <button type="button" className="bd-celebration-next" autoFocus disabled={busy} onClick={()=>void seen()}>WEITER</button>
   {!isReduced&&<button type="button" className="bd-celebration-quiet" disabled={busy}
    onClick={()=>void reduce()}>BEWEGUNGEN REDUZIEREN</button>}
   {queue.length>1&&<span className="bd-celebration-counter">{queue.length} bestätigte Erfolge</span>}
  </div>}
 </dialog>;
}
