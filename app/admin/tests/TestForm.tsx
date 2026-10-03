"use client";
import {useState} from "react";
const blocks=[
 ["pushups","Push ups","reps"],["pullups","Pull ups","reps"],["dips","Dips","reps"],["plank","Plank","seconds"],
 ["5k_time","5 km Lauf","minutes"],["30m_sprint","30 m Sprint","seconds"],["jump","Sprung","cm"],["mobility","Mobility","score"],["skill","Skill Check","score"]
] as const;
export default function TestForm({users}:{users:{id:string;name:string}[]}){
 const [userId,setUserId]=useState(users[0]?.id||"");const [name,setName]=useState("BE DIFFERENT TEST");const [selected,setSelected]=useState<string[]>(["pushups","plank"]);const [status,setStatus]=useState("");
 async function create(){const definition=blocks.filter(x=>selected.includes(x[0])).map(([metric,label,unit])=>({metric,label,unit}));if(!definition.length){setStatus("Mindestens einen Testbaustein wählen.");return;}const r=await fetch("/api/admin/tests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({userId,name,definition})});const j=await r.json().catch(()=>({}));setStatus(r.ok?"Test geplant und Notification angelegt.":j.error||"Fehler.");if(r.ok)setTimeout(()=>location.reload(),500)}
 return <article className="panel mini-form"><span className="eyebrow">TEST BUILDER</span><h2>Test zuweisen</h2><select value={userId} onChange={e=>setUserId(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select><input value={name} onChange={e=>setName(e.target.value)}/><div className="test-block-grid">{blocks.map(([metric,label,unit])=><button type="button" key={metric} className={selected.includes(metric)?"selected":""} onClick={()=>setSelected(x=>x.includes(metric)?x.filter(v=>v!==metric):[...x,metric])}><strong>{label}</strong><small>{unit}</small></button>)}</div><button className="primary compact" onClick={create}>TEST PLANEN</button>{status&&<small>{status}</small>}</article>;
}