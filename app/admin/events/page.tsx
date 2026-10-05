"use client";
import {Copy,LocalizedElement,LocalizedValue} from "../../components/Locale";





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
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINERBEREICH"}/></span><h1><Copy text={"Events und Video Calls"}/></h1></div><Link href="/admin" className="ghost"><Copy text={"← ÜBERSICHT"}/></Link></header><section className="admin-cols"><article className="panel mini-form"><span className="eyebrow"><Copy text={"NEUES EVENT"}/></span><h2><Copy text={"Termin erstellen"}/></h2><label className="brand-field"><span><Copy text={"Titel"}/></span><LocalizedElement as="input" value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder="Titel"/></label><label className="brand-field"><span><Copy text={"Beschreibung"}/></span><LocalizedElement as="textarea" value={v.description} onChange={e=>setV({...v,description:e.target.value})} placeholder="Beschreibung"/></label><select value={v.type} onChange={e=>setV({...v,type:e.target.value})}><option value="MEETUP">Meetup</option><option value="TEST_DAY"><Copy text={"Testtag"}/></option><option value="VIDEO_CALL">Video Call</option></select><label><Copy text={"Beginn"}/><input type="datetime-local" value={v.startsAt} onChange={e=>setV({...v,startsAt:e.target.value})}/></label><label><Copy text={"Ende"}/><input type="datetime-local" value={v.endsAt} onChange={e=>setV({...v,endsAt:e.target.value})}/></label><label className="brand-field"><span><Copy text={"Ort"}/></span><LocalizedElement as="input" value={v.location} onChange={e=>setV({...v,location:e.target.value})} placeholder="Ort"/></label><label className="brand-field"><span><Copy text={"Video Call URL"}/></span><input value={v.meetingUrl} onChange={e=>setV({...v,meetingUrl:e.target.value})} placeholder="Video Call URL"/></label><label className="brand-field"><span><Copy text={"Kapazität"}/></span><LocalizedElement as="input" value={v.capacity} onChange={e=>setV({...v,capacity:e.target.value})} placeholder="Kapazität" type="number"/></label><select value={v.minTier} onChange={e=>setV({...v,minTier:e.target.value})}><option value="FREE"><Copy text={"KOSTENLOS"}/></option><option value="PRO">PRO</option><option value="ELITE">ELITE</option></select><button className="primary compact" onClick={create}><Copy text={"SPEICHERN"}/></button>{status&&<small><Copy text={status}/></small>}</article><article className="panel"><span className="eyebrow"><Copy text={"TERMINE"}/></span><h2><Copy text={"Geplant"}/></h2>{items.map(x=><div className="history-row" key={x.id}><strong><Copy text={x.title}/></strong><span><LocalizedValue value={new Date(x.startsAt)} format="toLocaleString"/> · {x.type.replaceAll("_"," ")} · {x.minTier}</span><small>{x.location||x.meetingUrl||"Ohne Ort"} · {x._count?.registrations??0}<Copy text={"Anmeldungen"}/></small></div>)}</article></section></main>;
}
