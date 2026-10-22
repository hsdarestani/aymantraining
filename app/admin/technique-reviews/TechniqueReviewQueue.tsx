"use client";
import {useCallback,useEffect,useState} from "react";
type Review={id:string;mediaId:string;athleteName:string;athleteNoteDe:string|null;sourceWorkoutTitle:string|null;submittedAt:string;choices:{id:string;title:string;scheduledAt:string|null}[]};
export default function TechniqueReviewQueue(){
 const [items,setItems]=useState<Review[]>([]),[feedback,setFeedback]=useState<Record<string,string>>({}),[cue,setCue]=useState<Record<string,string>>({}),[choice,setChoice]=useState<Record<string,string>>({}),[busy,setBusy]=useState(""),[error,setError]=useState(""),[done,setDone]=useState("");
 const refresh=useCallback(async()=>{const r=await fetch("/api/admin/technique-reviews",{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Verbindung fehlgeschlagen");setItems(j.items)},[]);
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[refresh]);
 async function save(x:Review){
  setBusy(x.id);setError("");setDone("");
  try{
   const body={feedbackDe:feedback[x.id]||"",...(cue[x.id]?.trim()?{nextSessionCueDe:cue[x.id].trim()}:{}),
    ...(choice[x.id]?{targetWorkoutId:choice[x.id]}:{})};
   const r=await fetch("/api/admin/technique-reviews/"+x.id,{method:"PATCH",
    headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Rückmeldung fehlgeschlagen");
   setDone("Persönliche Rückmeldung gespeichert und für den Athleten freigegeben.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Fehler");}finally{setBusy("")}
 }
 return <div style={{display:"grid",gap:18}}>
  {error&&<p role="alert" style={{color:"#ffb6ba"}}>{error}</p>}{done&&<p role="status">{done}</p>}
  {!items.length&&<article className="panel"><h2>Keine offenen Technikvideos</h2><p>Neue Videos der zugeordneten Athleten erscheinen hier.</p></article>}
  {items.map(x=><article className="panel" key={x.id} style={{padding:22}}>
   <span className="eyebrow">{new Date(x.submittedAt).toLocaleString("de-DE")}</span><h2>{x.athleteName}</h2>
   <p>{x.sourceWorkoutTitle||"Allgemeine Technikaufnahme"}</p>
   {x.athleteNoteDe&&<p>{x.athleteNoteDe}</p>}
   <video controls preload="metadata" style={{width:"100%",maxWidth:560,maxHeight:340}} src={"/api/media/"+x.mediaId}/>
   <label style={{display:"block",marginTop:14}}>Persönliche Auswertung<textarea rows={4} value={feedback[x.id]||""} onChange={e=>setFeedback(v=>({...v,[x.id]:e.target.value}))}
    placeholder="Konkrete Beobachtung und nächster Verbesserungsschritt" style={{display:"block",width:"100%",padding:12,marginTop:7}}/></label>
   <label style={{display:"block",marginTop:12}}>Hinweis für die nächste Einheit (optional)
    <textarea rows={2} maxLength={800} value={cue[x.id]||""} onChange={e=>setCue(v=>({...v,[x.id]:e.target.value}))} style={{display:"block",width:"100%",padding:12,marginTop:7}}/>
   </label>
   {!!x.choices.length&&<label style={{display:"block",marginTop:12}}>An welche geplante Einheit anheften?
    <select value={choice[x.id]||""} onChange={e=>setChoice(v=>({...v,[x.id]:e.target.value}))} style={{display:"block",width:"100%",padding:10,marginTop:7}}>
     <option value="">Nächste passende Einheit automatisch</option>
     {x.choices.map(w=><option key={w.id} value={w.id}>{w.title}{w.scheduledAt?" · "+new Date(w.scheduledAt).toLocaleDateString("de-DE"):""}</option>)}
    </select></label>}
   <button className="primary compact" style={{marginTop:16}} disabled={busy===x.id||!feedback[x.id]||feedback[x.id].trim().length<10||Boolean(choice[x.id]&&!cue[x.id]?.trim())} onClick={()=>save(x)}>
    {busy===x.id?"SPEICHERN …":"TRAINERANTWORT FREIGEBEN"}
   </button>
  </article>)}
 </div>;
}