"use client";
import {useCallback,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Copy} from "../components/Locale";

type Mode="GENERAL"|"WOMEN";
type Presenter="ANY"|"TRAINERIN";
type Preference={enabled:boolean;mode:Mode;presenterPreference:Presenter};
export default function DashboardPreference(){
 const router=useRouter();
 const [value,setValue]=useState<Preference|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState("");
 const load=useCallback(async()=>{
  const r=await fetch("/api/dashboard-preference",{credentials:"same-origin",cache:"no-store"});
  if(!r.ok)throw Error("Die Ansicht konnte nicht geladen werden.");
  const json=await r.json();setValue(json.preference);
 },[]);
 useEffect(()=>{load().catch(e=>setError(e.message))},[load]);
 async function update(mode:Mode,presenterPreference:Presenter){
  if(!value||busy)return;
  const previous=value;setBusy(true);setError("");setSaved("");
  setValue({...value,mode,presenterPreference});
  try{
   const r=await fetch("/api/dashboard-preference",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({mode,presenterPreference})});
   const json=await r.json();
   if(!r.ok)throw Error(json.error||"Die Ansicht konnte nicht gespeichert werden.");
   setValue(json.preference);setSaved("Ansicht gespeichert.");router.refresh();
  }catch(e){setValue(previous);setError(e instanceof Error?e.message:"Speichern fehlgeschlagen.");}
  finally{setBusy(false)}
 }
 if(!value?.enabled)return null;
 return <section className="panel" aria-label="Deine Trainingsansicht" style={{padding:22,display:"grid",gap:13}}>
  <span className="eyebrow"><Copy text="DEINE TRAININGSANSICHT"/></span>
  <h2><Copy text="Du entscheidest, was du siehst."/></h2>
  <p className="muted"><Copy text="Die Frauenansicht ist freiwillig. Beide Ansichten enthalten dieselben Sportarten, Trainingswege und Zugriffsrechte."/></p>
  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
   <button type="button" aria-pressed={value.mode==="GENERAL"} className={value.mode==="GENERAL"?"primary compact":"secondary"}
    disabled={busy} onClick={()=>update("GENERAL",value.presenterPreference)}><Copy text="ALLGEMEINE ANSICHT"/></button>
   <button type="button" aria-pressed={value.mode==="WOMEN"} className={value.mode==="WOMEN"?"primary compact":"secondary"}
    disabled={busy} onClick={()=>update("WOMEN",value.presenterPreference)}><Copy text="FRAUENANSICHT"/></button>
  </div>
  {value.mode==="WOMEN"&&<label style={{display:"flex",gap:10,alignItems:"center"}}>
    <input type="checkbox" checked={value.presenterPreference==="TRAINERIN"} disabled={busy}
      onChange={e=>update("WOMEN",e.target.checked?"TRAINERIN":"ANY")}/>
    <span><Copy text="Aufnahmen mit Trainerinnen bevorzugen, sofern vorhanden"/></span>
  </label>}
  <p className="muted"><Copy text="Das ändert weder deine Einstufung noch Trainingspläne. Zyklusdaten werden hier nicht erhoben."/></p>
  {saved&&<p role="status" style={{color:"#d4ff00"}}>{saved}</p>}
  {error&&<p role="alert" style={{color:"#ffb6b6"}}><Copy text={error}/></p>}
 </section>;
}
