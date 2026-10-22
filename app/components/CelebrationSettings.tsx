"use client";
import {useEffect,useState} from "react";
import {Copy} from "./Locale";
type Pref={enabled:boolean;reduceMotion:boolean};
export default function CelebrationSettings(){
 const [available,setAvailable]=useState(false);
 const [value,setValue]=useState<Pref>({enabled:true,reduceMotion:false});
 const [busy,setBusy]=useState(false),[status,setStatus]=useState("");
 useEffect(()=>{fetch("/api/celebrations",{cache:"no-store"}).then(r=>r.ok?r.json():null)
  .then(j=>{if(j?.enabled){setAvailable(true);setValue(j.preference)}}).catch(()=>{})},[]);
 async function save(next:Pref){
  if(busy)return;
  const prior=value;setValue(next);setBusy(true);setStatus("");
  try{const r=await fetch("/api/celebrations",{method:"POST",credentials:"same-origin",
   headers:{"content-type":"application/json"},body:JSON.stringify({action:"SET_PREFERENCES",...next})});
   if(!r.ok)throw Error("Einstellung konnte nicht gespeichert werden.");
   setStatus("Einstellung gespeichert.");
  }catch{setValue(prior);setStatus("Speichern fehlgeschlagen.")}
  finally{setBusy(false)}
 }
 if(!available)return null;
 return <section className="panel" aria-label="Erfolgserlebnisse" style={{padding:22,display:"grid",gap:13}}>
  <span className="eyebrow"><Copy text="DEINE ERFOLGSMOMENTE"/></span>
  <h2><Copy text="Feiere Fortschritt auf deine Weise."/></h2>
  <p className="muted"><Copy text="Alle bestätigten Meilensteine bleiben erhalten, auch wenn du Animationen abschaltest."/></p>
  <label style={{display:"flex",gap:12,alignItems:"center"}}>
   <input type="checkbox" disabled={busy} checked={value.enabled} onChange={e=>void save({...value,enabled:e.target.checked})}/>
   <Copy text="Erfolgsanzeigen automatisch öffnen"/>
  </label>
  <label style={{display:"flex",gap:12,alignItems:"center"}}>
   <input type="checkbox" disabled={busy} checked={value.reduceMotion} onChange={e=>void save({...value,reduceMotion:e.target.checked})}/>
   <Copy text="Erfolge ohne bewegte Effekte anzeigen"/>
  </label>
  <p className="muted"><Copy text="Die Einstellung für reduzierte Bewegung deines Geräts gilt immer zusätzlich."/></p>
  {status&&<p role="status"><Copy text={status}/></p>}
 </section>;
}
