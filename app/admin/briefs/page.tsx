"use client";
import {Copy,LocalizedElement,LocalizedValue} from "../../components/Locale";





import {useEffect,useState} from "react";
import Link from "next/link";
export default function Briefs(){
 const [items,setItems]=useState<any[]>([]),[status,setStatus]=useState(""),[file,setFile]=useState<File|null>(null);
 const [v,setV]=useState({title:"Guten Morgen",body:"",audienceTier:"PRO"});
 async function load(){const r=await fetch("/api/admin/coach-briefs");if(r.ok)setItems((await r.json()).items||[])}
 useEffect(()=>{load()},[]);
 async function publish(){
  setStatus("WIRD VERÖFFENTLICHT");let mediaId:string|undefined;
  if(file){const f=new FormData();f.set("kind","VOICE_MESSAGE");f.set("file",file);const up=await fetch("/api/media",{method:"POST",body:f});const j=await up.json().catch(()=>({}));if(!up.ok){setStatus(j.error||"Audio Upload fehlgeschlagen.");return}mediaId=j.asset.id}
  const r=await fetch("/api/admin/coach-briefs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...v,mediaId})});const j=await r.json().catch(()=>({}));setStatus(r.ok?"Morgenübersicht veröffentlicht.":j.error||"Fehler");if(r.ok){setFile(null);setV({...v,body:""});load()}
 }
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINERSTIMME"}/></span><h1><Copy text={"Morgenübersicht"}/></h1></div><Link href="/admin" className="ghost"><Copy text={"← ÜBERSICHT"}/></Link></header><section className="admin-cols"><article className="panel mini-form"><span className="eyebrow"><Copy text={"NEU"}/></span><h2><Copy text={"Audio an Mitglieder senden"}/></h2><LocalizedElement as="input" value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder="Titel"/><LocalizedElement as="textarea" value={v.body} onChange={e=>setV({...v,body:e.target.value})} placeholder="Kurze Textzusammenfassung"/><select value={v.audienceTier} onChange={e=>setV({...v,audienceTier:e.target.value})}><option value="FREE"><Copy text={"KOSTENLOS"}/></option><option value="PRO">PRO</option><option value="ELITE">ELITE</option></select><label><Copy text={"Audio bis etwa 30 Sekunden"}/><input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="primary compact" onClick={publish}><Copy text={"VERÖFFENTLICHEN"}/></button>{status&&<small><Copy text={status}/></small>}</article><article className="panel"><span className="eyebrow"><Copy text={"VERLAUF"}/></span><h2><Copy text={"Letzte Morgenübersichten"}/></h2>{items.map(x=><div className="history-row" key={x.id}><strong><Copy text={x.title}/></strong><span><LocalizedValue value={new Date(x.publishAt)} format="toLocaleString"/> · {x.audienceTier}</span><small><Copy text={x.mediaId?"Audio vorhanden":"Nur Text"}/></small></div>)}</article></section></main>;
}
