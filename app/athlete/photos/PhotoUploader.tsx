"use client";
import {useState} from "react";
import {Copy} from "../../components/Locale";

export default function PhotoUploader(){
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 async function upload(files:FileList|null){
  if(!files?.length||busy)return;
  setBusy(true);setStatus("");
  try{
   await fetch("/api/consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"media_processing",version:"1.0",granted:true})});
   let done=0;
   for(const file of Array.from(files)){
    const form=new FormData();form.append("kind","PROGRESS_PHOTO");form.append("file",file);
    const res=await fetch("/api/media",{method:"POST",body:form});
    if(!res.ok)throw new Error((await res.json().catch(()=>null))?.error||"Upload fehlgeschlagen");
    done++;
   }
   setStatus(String(done));
   window.location.reload();
  }catch(e:any){setStatus(e?.message||"Upload fehlgeschlagen")}
  finally{setBusy(false)}
 }
 return <div className="panel">
  <span className="eyebrow"><Copy text="PRIVATE ATHLETENFOTOS"/></span>
  <h2><Copy text="Fotos für dein Athlete Profil"/></h2>
  <p className="muted"><Copy text="Die Bilder werden verschlüsselt gespeichert und nicht im öffentlichen GitHub Repository abgelegt."/></p>
  <label className="primary compact" style={{display:"inline-flex",cursor:"pointer",marginTop:12}}>
   <Copy text={busy?"WIRD HOCHGELADEN…":"FOTOS AUSWÄHLEN"}/>
   <input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>upload(e.target.files)}/>
  </label>
  {status?<p className="muted" role="status" style={{marginTop:10}}>{/^\d+$/.test(status)?<><Copy text="HOCHGELADEN"/>: {status}</>:status}</p>:null}
 </div>;
}
