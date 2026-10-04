"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
export default function Team(){
 const [d,setD]=useState<any>({coaches:[],athletes:[],assignments:[]}),[status,setStatus]=useState("");
 const [form,setForm]=useState({name:"",email:"",password:""});
 async function load(){const r=await fetch("/api/admin/team");if(r.ok)setD(await r.json())}
 useEffect(()=>{load()},[]);
 const assigned=useMemo(()=>new Map((d.assignments||[]).map((x:any)=>[x.athleteId,x.coachId])),[d]);
 async function create(){const r=await fetch("/api/admin/team",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create_coach",...form})});const j=await r.json().catch(()=>({}));setStatus(r.ok?"Trainer angelegt.":j.error||"Fehler");if(r.ok){setForm({name:"",email:"",password:""});load()}}
 async function assign(athleteId:string,coachId:string){if(!coachId)return;const r=await fetch("/api/admin/team",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"assign",athleteId,coachId})});setStatus(r.ok?"Zuordnung gespeichert.":"Zuordnung fehlgeschlagen.");if(r.ok)load()}
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow">TEAM</span><h1>Trainer und Zuständigkeiten</h1></div><Link href="/admin" className="ghost">← ÜBERSICHT</Link></header><section className="admin-cols"><article className="panel mini-form"><span className="eyebrow">NEUER TRAINER</span><h2>Zugang anlegen</h2><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name"/><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="E Mail"/><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Temporäres Passwort"/><button className="primary compact" onClick={create}>TRAINER ANLEGEN</button>{status&&<small>{status}</small>}<div className="history-row"><strong>{d.coaches.length}</strong><span>Trainerkonten</span></div></article><article className="panel"><span className="eyebrow">ZUSTÄNDIGKEIT</span><h2>Athleten zuordnen</h2>{d.athletes.map((a:any)=><div className="history-row" key={a.id}><strong>{a.name||a.email}</strong><span>{a.subscriptionTier}</span><select value={assigned.get(a.id)||""} onChange={e=>assign(a.id,e.target.value)}><option value="">Trainer wählen</option>{d.coaches.map((c:any)=><option value={c.id} key={c.id}>{c.name||c.email}</option>)}</select></div>)}</article></section></main>;
}
