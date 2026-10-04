"use client";
import {useState} from "react";
export default function ClonePlanButton({id,name,proOnly}:{id:string;name:string;proOnly:boolean}){
 const [busy,setBusy]=useState(false);
 async function clone(){
  setBusy(true);
  const r=await fetch("/api/admin/plans",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:name+" Kopie",proOnly,cloneFromId:id})});
  const j=await r.json().catch(()=>({}));
  if(r.ok)location.href=`/admin/plans/${j.item.id}`;else{setBusy(false);alert(j.error||"Kopieren fehlgeschlagen.")}
 }
 return <button className="secondary" onClick={clone} disabled={busy}>{busy?"KOPIERE…":"KOPIEREN"}</button>
}
