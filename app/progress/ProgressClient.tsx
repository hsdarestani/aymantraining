"use client";
import {FormEvent,useState} from "react";
export default function ProgressClient(){
  const [status,setStatus]=useState("");
  const [consent,setConsent]=useState(false);
  async function metric(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const f=new FormData(e.currentTarget);
    const body={weightKg:Number(f.get("weightKg"))||undefined,waistCm:Number(f.get("waistCm"))||undefined,chestCm:Number(f.get("chestCm"))||undefined};
    const r=await fetch("/api/body-metrics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    setStatus(r.ok?"Gespeichert.":"Speichern fehlgeschlagen.");if(r.ok)setTimeout(()=>location.reload(),350);
  }
  async function photo(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!consent){setStatus("Bitte bestätige zuerst die persönliche Fotoverarbeitung.");return;}
    await fetch("/api/consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"media_processing",version:"1.0",granted:true})});
    const f=new FormData(e.currentTarget);f.set("kind","PROGRESS_PHOTO");
    const r=await fetch("/api/media",{method:"POST",body:f});const j=await r.json().catch(()=>({}));
    setStatus(r.ok?"Foto privat gespeichert.":j.error||"Hochladen fehlgeschlagen.");if(r.ok)setTimeout(()=>location.reload(),350);
  }
  return <div className="progress-actions">
    <form className="panel mini-form" onSubmit={metric}><span className="eyebrow">KÖRPERWERTE</span><h2>Maße eintragen</h2><input name="weightKg" type="number" step=".1" placeholder="Gewicht kg"/><input name="waistCm" type="number" step=".1" placeholder="Taille cm"/><input name="chestCm" type="number" step=".1" placeholder="Brust cm"/><button className="secondary">SPEICHERN</button></form>
    <form className="panel mini-form" onSubmit={photo}><span className="eyebrow">PRIVATES FOTO</span><h2>Fortschrittsbild</h2><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required/><label className="consent-line"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Ich stimme der privaten Verarbeitung dieses Fortschrittsbildes für Betreuung und Fortschrittsvergleich zu.</label><button className="secondary">HOCHLADEN</button></form>
    {status&&<div className="save-toast">{status}</div>}
  </div>
}