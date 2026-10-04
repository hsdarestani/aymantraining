"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function AIReview(){
 const [items,setItems]=useState<any[]>([]),[notes,setNotes]=useState<Record<string,string>>({}),[status,setStatus]=useState("");
 async function load(){const r=await fetch("/api/admin/ai");if(r.ok)setItems((await r.json()).items||[])}
 useEffect(()=>{load()},[]);
 async function review(id:string,replacement?:string){const r=await fetch("/api/admin/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({messageId:id,replacement:replacement||undefined})});setStatus(r.ok?"Geprüft.":"Prüfung fehlgeschlagen.");if(r.ok)load()}
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow">DIFFERENT AI</span><h1>Trainer Kontrolle</h1></div><Link href="/admin" className="ghost">← ÜBERSICHT</Link></header><article className="panel"><div className="panel-head"><div><span className="eyebrow">ANTWORTEN</span><h2>Prüfen und übernehmen</h2></div><span className="tag">{items.filter(x=>!x.coachReviewedAt).length} OFFEN</span></div>{items.map(x=><details className="rule-editor" key={x.id}><summary><div><strong>{x.user?.name||x.user?.email}</strong><small>{new Date(x.createdAt).toLocaleString("de-DE")}</small></div><span>{x.coachReviewedAt?"GEPRÜFT":"OFFEN"}</span></summary><div className="rule-editor-body"><p>{x.content}</p>{!x.coachReviewedAt?<><label>Ergänzung des Trainers<textarea value={notes[x.id]||""} onChange={e=>setNotes({...notes,[x.id]:e.target.value})}/></label><div className="row-actions"><button className="secondary" onClick={()=>review(x.id)}>NUR PRÜFEN</button><button className="primary compact" onClick={()=>review(x.id,notes[x.id])}>ERGÄNZUNG SENDEN</button></div></>:null}</div></details>)}{status&&<div className="save-toast">{status}</div>}</article></main>;
}
