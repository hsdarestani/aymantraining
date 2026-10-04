"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

export default function Events(){
 const [items,setItems]=useState<any[]>([]),[status,setStatus]=useState("");
 const [v,setV]=useState({title:"",description:"",type:"MEETUP",startsAt:"",endsAt:"",location:"",meetingUrl:"",capacity:"",minTier:"FREE"});
 async function load(){const r=await fetch("/api/admin/events");if(r.ok)setItems((await r.json()).items||[])}
 useEffect(()=>{load()},[]);
 async function create(){
  const startsAt=new Date(v.startsAt).toISOString(),endsAt=v.endsAt?new Date(v.endsAt).toISOString():null;
  const r=await fetch("/api/admin/events",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...v,startsAt,endsAt,capacity:v.capacity?Number(v.capacity):null})});
  const j=await r.json().catch(()=>({}));setStatus(r.ok?"Event gespeichert.":j.error||"Fehler");if(r.ok){setV({...v,title:"",description:"",location:"",meetingUrl:"",capacity:""});load()}
 }
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow">TRAINERBEREICH</span><h1>Events und Video Calls</h1></div><Link href="/admin" className="ghost">← ÜBERSICHT</Link></header><section className="admin-cols"><article className="panel mini-form"><span className="eyebrow">NEUES EVENT</span><h2>Termin erstellen</h2><input value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder="Titel"/><textarea value={v.description} onChange={e=>setV({...v,description:e.target.value})} placeholder="Beschreibung"/><select value={v.type} onChange={e=>setV({...v,type:e.target.value})}><option value="MEETUP">Meetup</option><option value="TEST_DAY">Testtag</option><option value="VIDEO_CALL">Video Call</option></select><label>Beginn<input type="datetime-local" value={v.startsAt} onChange={e=>setV({...v,startsAt:e.target.value})}/></label><label>Ende<input type="datetime-local" value={v.endsAt} onChange={e=>setV({...v,endsAt:e.target.value})}/></label><input value={v.location} onChange={e=>setV({...v,location:e.target.value})} placeholder="Ort"/><input value={v.meetingUrl} onChange={e=>setV({...v,meetingUrl:e.target.value})} placeholder="Video Call URL"/><input value={v.capacity} onChange={e=>setV({...v,capacity:e.target.value})} placeholder="Kapazität" type="number"/><select value={v.minTier} onChange={e=>setV({...v,minTier:e.target.value})}><option value="FREE">KOSTENLOS</option><option value="PRO">PRO</option><option value="ELITE">ELITE</option></select><button className="primary compact" onClick={create}>SPEICHERN</button>{status&&<small>{status}</small>}</article><article className="panel"><span className="eyebrow">TERMINE</span><h2>Geplant</h2>{items.map(x=><div className="history-row" key={x.id}><strong>{x.title}</strong><span>{new Date(x.startsAt).toLocaleString("de-DE")} · {x.type.replaceAll("_"," ")} · {x.minTier}</span><small>{x.location||x.meetingUrl||"Ohne Ort"} · {x._count?.registrations??0} Anmeldungen</small></div>)}</article></section></main>;
}
