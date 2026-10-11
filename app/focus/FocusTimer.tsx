"use client";
import {useEffect,useState} from "react";
const LENGTH=120;
function clock(n:number){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
export default function FocusTimer(){
 const [remaining,setRemaining]=useState(LENGTH),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(!playing||remaining===0)return;const t=window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(t)},[playing,remaining]);
 useEffect(()=>{if(remaining===0)setPlaying(false)},[remaining]);
 const elapsed=LENGTH-remaining;
 const phase=elapsed%8<4?"EINATMEN":"AUSATMEN";
 const progress=(elapsed/LENGTH)*100;
 return <section className="panel" aria-label="Zwei Minuten Atemtraining" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:410,background:"radial-gradient(circle at 50% 30%,rgba(212,255,0,.1),transparent 50%),#121719"}}>
   <span className="eyebrow" style={{color:"var(--volt)"}}>BE FOCUSED · 2 MINUTEN</span>
   <div aria-live="off" style={{margin:"25px auto",width:"min(65vw,218px)",height:"min(65vw,218px)",borderRadius:"50%",background:`conic-gradient(var(--volt) ${progress}%,#2b3338 ${progress}% 100%)`,padding:5}}>
    <div style={{height:"100%",borderRadius:"50%",background:"#101416",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
     <strong style={{fontSize:58,letterSpacing:"-.07em",fontVariantNumeric:"tabular-nums"}}>{clock(remaining)}</strong>
     <span style={{color:"var(--volt)",fontSize:13,fontWeight:900,letterSpacing:".12em"}}>{remaining===0?"GESCHAFFT":playing?phase:"BEREIT"}</span>
    </div>
   </div>
   <p aria-live="polite" style={{textAlign:"center",maxWidth:400,color:"var(--ash)"}}>{remaining===0?"Gut gemacht. Nimm dir einen Moment, bevor du weitermachst.":playing?(phase==="EINATMEN"?"Atme ruhig durch die Nase ein.":"Atme langsam und entspannt aus."):"Starte, wenn du bereit bist. Vier Sekunden ein, vier Sekunden aus."}</p>
   <div style={{display:"flex",gap:12,marginTop:14}}>
    <button type="button" className="primary compact" onClick={()=>remaining===0?(setRemaining(LENGTH),setPlaying(true)):setPlaying(v=>!v)}>{remaining===0?"NOCH EINMAL":playing?"PAUSE":"STARTEN"}</button>
    <button type="button" className="secondary" onClick={()=>{setRemaining(LENGTH);setPlaying(false)}}>ZURÜCKSETZEN</button>
   </div>
 </section>;
}
