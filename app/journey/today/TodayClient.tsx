"use client";
import {Copy,LocalizedValue} from "../../components/Locale";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Workout={id:string;title:string;scheduledAt:string};
type Note={title:string;action:string;explanation:string;date:string};
type Feedback={id:string;coachNote:string;reviewedAt:string;nextSession:{focus?:string;advice?:string}|null};
type Day={date:string;dayState:string;actual:{scheduledToday:number;completedToday:number;workout:Workout|null;nextWorkout:Workout|null;energy:number|null;soreness:number|null;sleepMinutes:number|null;checkInDate:string|null;sleepDate:string|null};recovery:{needsCheckIn:boolean;hasSleep:boolean;note:string};coach:{assigned:boolean;brief:{title:string;body:string|null}|null;adjustments:Note[];openVideos:number;feedback:Feedback[]}};
export default function TodayClient(){
 const [day,setDay]=useState<Day|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[file,setFile]=useState<File|null>(null),[note,setNote]=useState("");
 const load=useCallback(async()=>{const response=await fetch("/api/journey/daily",{cache:"no-store"});const body=await response.json();if(!response.ok)throw Error(body.error||"Tagesansicht nicht verfügbar");setDay(body)},[]);
 useEffect(()=>{load().catch(e=>setError(e.message))},[load]);
 async function sendVideo(){
  if(!file)return;setBusy(true);setError("");setNotice("");
  try{
   const form=new FormData();form.append("file",file);form.append("kind","TECHNIQUE_VIDEO");
   const upload=await fetch("/api/media",{method:"POST",body:form});const up=await upload.json();
   if(!upload.ok)throw Error(up.error||"Video konnte nicht hochgeladen werden.");
   const result=await fetch("/api/journey/videos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mediaId:up.asset.id,message:note})});
   const body=await result.json();
   if(!result.ok)throw Error(body.error||"Video wurde hochgeladen, aber noch nicht zugeordnet. Bitte Trainer kontaktieren.");
   setFile(null);setNote("");setNotice("Video beim Trainer eingereicht.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Upload fehlgeschlagen")}finally{setBusy(false)}
 }
 return <div style={{display:"grid",gap:18,marginTop:20}}>
 {error&&<div role="alert" style={{padding:14,background:"#4b2026",color:"#ffe5e5"}}><Copy text={error}/></div>}
 {notice&&<p role="status" style={{color:"#d4ff00"}}><Copy text={notice}/></p>}
 {!day?<p role="status"><Copy text="Trainingsdaten werden geladen …"/></p>:<>
  <section className="panel" style={{padding:25}}>
   <span className="eyebrow">{day.date}<Copy text={" · DEIN PLAN"}/></span>
   <h2><Copy text={day.dayState==="TRAINING_PLANNED"?"Dein Training steht an.":day.dayState==="TRAINING_DONE"?"Dein Training ist erledigt.":"Keine weitere Einheit eingetragen."}/></h2>
   <p>{day.actual.scheduledToday}<Copy text={" eingeplant · "}/>{day.actual.completedToday}<Copy text={" abgeschlossen"}/></p>
   {day.actual.workout&&<p><strong>{day.actual.workout.title}</strong> · <LocalizedValue value={new Date(day.actual.workout.scheduledAt)}/></p>}
   {day.actual.nextWorkout&&<p><Copy text={"Nächste geplante Einheit: "}/><strong>{day.actual.nextWorkout.title}</strong>, <LocalizedValue value={new Date(day.actual.nextWorkout.scheduledAt)}/></p>}
   <Link href="/training" style={{color:"#d4ff00"}}><Copy text={"TRAININGSÜBERSICHT →"}/></Link>
  </section>
  <section className="panel" style={{padding:25}}>
   <span className="eyebrow"><Copy text="ERHOLUNG & TAGESFORM"/></span><h2><Copy text="Deine aktuelle Rückmeldung"/></h2>
   <p><Copy text={"Energie: "}/><Copy text={day.actual.energy??"Noch nicht eingetragen"}/><Copy text={" · Muskelgefühl: "}/><Copy text={day.actual.soreness??"Noch nicht eingetragen"}/></p>
   <p><Copy text={"Schlaf: "}/>{day.actual.sleepMinutes==null?<Copy text="Keine verfügbaren Messwerte"/>:<>{Math.round(day.actual.sleepMinutes/6)/10} <Copy text="Stunden"/></>}</p>
   <p><Copy text={day.recovery.note}/></p><Link href="/lifestyle" style={{color:"#d4ff00"}}><Copy text={"TAGESCHECK ÖFFNEN →"}/></Link>
  </section>
  <section className="panel" style={{padding:25}}>
   <span className="eyebrow"><Copy text="DIREKT VOM TRAINER"/></span><h2><Copy text="Was du als Nächstes beachten sollst"/></h2>
   {day.coach.brief&&<p><strong>{day.coach.brief.title}</strong> {day.coach.brief.body}</p>}
   {day.coach.adjustments.length?day.coach.adjustments.map((n,i)=><p key={i}><strong>{n.title}</strong> ({n.date}): {n.action}</p>):<p><Copy text="Noch keine neue persönliche Trainingsanpassung eingetragen."/></p>}
   {day.coach.feedback.map(f=><article key={f.id} style={{borderTop:"1px solid #3b503d",paddingTop:12,marginTop:12}}>
    <strong><Copy text="Dein Technikvideo wurde geprüft"/></strong><p>{f.coachNote}</p>{f.nextSession&&<p><Copy text={"Nächste Einheit: "}/>{f.nextSession.focus} · {f.nextSession.advice}</p>}
   </article>)}
  </section>
  <section className="panel" style={{padding:25}}>
   <span className="eyebrow"><Copy text="DEIN TECHNIKVIDEO"/></span><h2><Copy text="Dein Trainer sieht deine Ausführung."/></h2>
   <p><Copy text={"Das Video ist nur für berechtigte Trainer und dich sichtbar. Die Verarbeitung privater Videos erfordert deine Zustimmung. Der Upload gehört zur PRO Betreuung."}/></p>
   {day.coach.openVideos>0&&<p>{day.coach.openVideos}<Copy text={" Video(s) warten noch auf Rückmeldung."}/></p>}
   {day.coach.assigned?<><label style={{display:"block",marginBottom:10}}><Copy text={"Video auswählen "}/><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
    <label style={{display:"block",marginBottom:12}}><Copy text={"Frage an den Trainer "}/><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} rows={2} style={{display:"block",width:"100%",padding:12,background:"#17241b",color:"white"}}/></label>
    <button type="button" className="primary compact" disabled={!file||busy} onClick={sendVideo}><Copy text={busy?"WIRD GESENDET …":"VIDEO EINREICHEN"}/></button></>:<p><Copy text={"Noch kein Trainer zugeordnet."}/></p>}
   <p><Link href="/coach" style={{color:"#d4ff00"}}><Copy text={"DEIN TRAINER →"}/></Link></p>
  </section>
 </>}
 </div>
}
