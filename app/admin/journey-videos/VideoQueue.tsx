"use client";
import {useEffect,useState} from "react";
type Row={id:string;athlete:string;mediaId:string;annotations:any;createdAt:string;upcoming:{id:string;title:string;scheduledAt:string}[]};
export default function VideoQueue(){
 const [rows,setRows]=useState<Row[]>([]),[note,setNote]=useState<Record<string,string>>({}),[selected,setSelected]=useState<Record<string,string>>({}),[focus,setFocus]=useState<Record<string,string>>({}),[advice,setAdvice]=useState<Record<string,string>>({}),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState("");
 async function load(){const r=await fetch("/api/admin/journey-videos",{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Nicht verfügbar");setRows(j.videos)}
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 async function send(row:Row){
  setError("");setNotice("");setBusy(row.id);
  try{
   const workoutId=selected[row.id]||null;
   const nextSession=workoutId?{workoutId,focus:focus[row.id]||"",advice:advice[row.id]||""}:null;
   const r=await fetch("/api/admin/journey-videos/"+row.id+"/review",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify({coachNote:note[row.id]||"",nextSession})});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Bewertung nicht möglich");
   setNotice("Feedback gespeichert und an den Athleten gesendet.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Bewertung fehlgeschlagen")}finally{setBusy("")}
 }
 return <section className="panel" style={{padding:22}}>
  {error&&<p role="alert" style={{color:"#ffb4b4"}}>{error}</p>}{notice&&<p role="status">{notice}</p>}
  <h2>{rows.length} offene Technikvideos</h2>
  {rows.map(row=><article key={row.id} style={{padding:18,border:"1px solid #506752",marginTop:14,borderRadius:10}}>
   <h3>{row.athlete}</h3><p>Eingereicht: {new Date(row.createdAt).toLocaleString("de-DE")}</p>
   <video src={"/api/media/"+row.mediaId} controls preload="metadata" style={{maxWidth:"100%",maxHeight:280}}/>
   {row.annotations?.athleteNote&&<p>Frage: {row.annotations.athleteNote}</p>}
   <label style={{display:"block"}}>Persönliches Feedback<textarea rows={3} maxLength={2000} value={note[row.id]||""} onChange={e=>setNote(s=>({...s,[row.id]:e.target.value}))} style={{display:"block",width:"100%",padding:12,background:"#162319",color:"white"}}/></label>
   <label>Optionaler Bezug zur nächsten geplanten Einheit
   <select value={selected[row.id]||""} onChange={e=>setSelected(s=>({...s,[row.id]:e.target.value}))} style={{display:"block",padding:12,margin:"10px 0",maxWidth:"100%"}}>
    <option value="">Keine Anpassung</option>{row.upcoming.map(w=><option key={w.id} value={w.id}>{w.title} · {new Date(w.scheduledAt).toLocaleString("de-DE")}</option>)}
   </select></label>
   {selected[row.id]&&<div><label>Fokus <input value={focus[row.id]||""} onChange={e=>setFocus(s=>({...s,[row.id]:e.target.value}))}/></label>
    <label>Hinweise <textarea value={advice[row.id]||""} onChange={e=>setAdvice(s=>({...s,[row.id]:e.target.value}))}/></label></div>}
   <p>Die Trainingsplanung ändert sich nicht automatisch. Nur der Hinweis für die angegebene Einheit wird dokumentiert.</p>
   <button className="primary compact" disabled={busy===row.id||(note[row.id]||"").trim().length<8} onClick={()=>send(row)}>BEWERTUNG SPEICHERN</button>
  </article>)}
 </section>
}
