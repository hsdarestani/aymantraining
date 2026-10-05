"use client";
import {Copy,LocalizedElement,LocalizedValue} from "../../../components/Locale";



import {useRef,useState} from "react";

type Msg={id:string;senderId:string;athleteId:string;kind:"TEXT"|"VOICE"|"VIDEO";text:string|null;mediaId:string|null;durationSec:number|null;createdAt:string};
type Media={id:string;kind:string;originalName:string;mimeType:string};
type Feedback={id:string;mediaId:string;annotations:any;createdAt:string};

function FeedbackEditor({athleteId,mediaId,onSaved}:{athleteId:string;mediaId:string;onSaved:()=>void}){
 const video=useRef<HTMLVideoElement|null>(null);
 const svg=useRef<SVGSVGElement|null>(null);
 const [note,setNote]=useState(""),[stamp,setStamp]=useState(0),[drawing,setDrawing]=useState(false),[active,setActive]=useState(false),[strokes,setStrokes]=useState<Array<Array<{x:number;y:number}>>>([]);
 function pos(e:React.PointerEvent<SVGSVGElement>){const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
 function down(e:React.PointerEvent<SVGSVGElement>){if(!drawing)return;e.currentTarget.setPointerCapture(e.pointerId);setActive(true);setStrokes(x=>[...x,[pos(e)]])}
 function move(e:React.PointerEvent<SVGSVGElement>){if(!drawing||!active)return;const p=pos(e);setStrokes(x=>x.map((s,i)=>i===x.length-1?[...s,p]:s))}
 function up(){setActive(false)}
 function capture(){setStamp(Math.max(0,Math.round(video.current?.currentTime||0)))}
 async function save(){
  const r=await fetch("/api/admin/video-feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({athleteId,mediaId,timestampSec:stamp,note,strokes})});
  if(r.ok){setNote("");setStrokes([]);onSaved()}else alert((await r.json().catch(()=>({}))).error||"Feedback konnte nicht gespeichert werden.");
 }
 return <div className="feedback-editor">
  <div className="feedback-video"><video ref={video} src={`/api/media/${mediaId}`} controls/><svg ref={svg} className={drawing?"feedback-draw active":"feedback-draw"} viewBox="0 0 1000 1000" preserveAspectRatio="none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{strokes.map((s,i)=><polyline key={i} points={s.map(p=>`${p.x*1000},${p.y*1000}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>)}</svg></div>
  <div className="feedback-controls"><button className="secondary" onClick={capture}><Copy text={"ZEITMARKE"}/>{stamp}s</button><button className={drawing?"secondary selected":"secondary"} onClick={()=>setDrawing(!drawing)}><Copy text={drawing?"ZEICHNEN AKTIV":"ZEICHNEN"}/></button><button className="secondary" onClick={()=>setStrokes([])}><Copy text={"ZEICHNUNG LÖSCHEN"}/></button></div>
  <LocalizedElement as="textarea" value={note} onChange={e=>setNote(e.target.value)} placeholder="Feedback zur Technik"/>
  <button className="primary compact" onClick={save} disabled={!note.trim()&&!strokes.length}><Copy text={"FEEDBACK SENDEN"}/></button>
 </div>
}

export default function ThreadClient({athleteId,messages:initial,media,feedback}:{athleteId:string;messages:Msg[];media:Media[];feedback:Feedback[]}){
 const [messages,setMessages]=useState(initial),[text,setText]=useState(""),[status,setStatus]=useState(""),[recording,setRecording]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]),started=useRef(0);
 const mediaMap=new Map(media.map(x=>[x.id,x]));
 async function reload(){const r=await fetch(`/api/messages?athleteId=${encodeURIComponent(athleteId)}`);if(r.ok)setMessages((await r.json()).items)}
 async function send(body:any){const r=await fetch("/api/messages",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({athleteId,...body})});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||"Senden fehlgeschlagen.");await reload()}
 async function sendText(){if(!text.trim())return;setStatus("SENDE…");try{await send({text});setText("");setStatus("GESENDET")}catch(e:any){setStatus(e.message)}}
 async function startVoice(){
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(stream);chunks.current=[];mr.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};mr.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:mr.mimeType||"audio/webm"});const file=new File([blob],"trainer-stimme.webm",{type:blob.type});const f=new FormData();f.set("kind","VOICE_MESSAGE");f.set("relatedUserId",athleteId);f.set("file",file);setStatus("LADE SPRACHE HOCH…");const up=await fetch("/api/media",{method:"POST",body:f});if(!up.ok){setStatus("UPLOAD FEHLGESCHLAGEN");return}const mediaId=(await up.json()).asset.id;await send({kind:"VOICE",mediaId,durationSec:Math.max(1,Math.round((Date.now()-started.current)/1000)),text:"Sprachnachricht vom Trainer"});setStatus("GESENDET")};recorder.current=mr;started.current=Date.now();mr.start();setRecording(true);setStatus("AUFNAHME LÄUFT")}
  catch{setStatus("MIKROFON NICHT VERFÜGBAR")}
 }
 function stopVoice(){recorder.current?.stop();recorder.current=null;setRecording(false)}
 return <section className="admin-cols">
  <article className="panel coach-thread"><span className="eyebrow"><Copy text={"UNTERHALTUNG"}/></span><h2><Copy text={"Direkter Trainerkontakt"}/></h2><div className="thread-list">
   {messages.map(m=>{const mine=m.senderId!==m.athleteId;const asset=m.mediaId?mediaMap.get(m.mediaId):null;return <div className={mine?"thread-message coach":"thread-message athlete"} key={m.id}><strong><Copy text={mine?"TRAINER":"ATHLET"}/></strong>{m.text&&<p>{m.text}</p>}{m.kind==="VOICE"&&m.mediaId&&<audio controls src={`/api/media/${m.mediaId}`}/>} {m.kind==="VIDEO"&&m.mediaId&&<video controls src={`/api/media/${m.mediaId}`}/>}<small><LocalizedValue value={new Date(m.createdAt)} format="toLocaleString"/>{asset?" · "+asset.originalName:""}</small></div>})}
  </div><div className="thread-composer"><LocalizedElement as="textarea" value={text} onChange={e=>setText(e.target.value)} placeholder="Nachricht an den Athleten"/><div className="row-actions"><button className="primary compact" onClick={sendText}><Copy text={"SENDEN"}/></button><button className="secondary" onClick={recording?stopVoice:startVoice}><Copy text={recording?"AUFNAHME BEENDEN":"SPRACHE AUFNEHMEN"}/></button></div>{status&&<small><Copy text={status}/></small>}</div></article>
  <aside className="stack"><article className="panel"><span className="eyebrow"><Copy text={"TECHNIKVIDEO"}/></span><h2><Copy text={"Analyse"}/></h2>{messages.filter(m=>m.kind==="VIDEO"&&m.mediaId).length?messages.filter(m=>m.kind==="VIDEO"&&m.mediaId).map(m=><div key={m.id}><FeedbackEditor athleteId={athleteId} mediaId={m.mediaId!} onSaved={()=>location.reload()}/><div className="feedback-history">{feedback.filter(f=>f.mediaId===m.mediaId).map(f=><div className="history-row" key={f.id}><strong>Feedback</strong><span><LocalizedValue value={new Date(f.createdAt)} format="toLocaleString"/></span></div>)}</div></div>):<p className="muted"><Copy text={"Noch kein Technikvideo vom Athleten."}/></p>}</article></aside>
 </section>;
}
