"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./focus.module.css";

const LENGTH=120;
const cues=[
 "Nimm eine bequeme Position ein. Atme ruhig durch die Nase ein und wieder aus.",
 "Du gibst das Tempo vor. Kein Druck.",
 "Lass die Schultern locker und atme ruhig weiter.",
 "Bei jeder Ausatmung darfst du etwas Spannung abgeben.",
 "Spüre den Boden unter dir. Bleib in deinem Rhythmus.",
 "Noch ein paar bewusste Atemzüge.",
 "Du musst nichts leisten. Bleib einfach hier.",
 "Gleich geschafft. Komm langsam zurück in deinen Tag."
];
function clock(n:number){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
export default function FocusTimer(){
 const [remaining,setRemaining]=useState(LENGTH),[running,setRunning]=useState(false),[narration,setNarration]=useState(false),[supported,setSupported]=useState(true);
 const end=useRef(0),interval=useRef<ReturnType<typeof setInterval>|null>(null),spoken=useRef(-1);
 const enabled=useRef(false);enabled.current=narration;
 useEffect(()=>{setSupported(typeof window!=="undefined"&&"speechSynthesis" in window);return()=>{window.speechSynthesis?.cancel()}},[]);
 function say(message:string){
  if(!enabled.current||!("speechSynthesis" in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(message);u.lang="de-DE";u.rate=.88;u.pitch=1;
  const preferred=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("de"));
  if(preferred)u.voice=preferred;
  window.speechSynthesis.speak(u);
 }
 function stopInterval(){if(interval.current){clearInterval(interval.current);interval.current=null}}
 function tick(){
  const next=Math.max(0,Math.ceil((end.current-Date.now())/1000));
  setRemaining(next);
  if(next===0){stopInterval();setRunning(false);say("Geschafft. Atme ganz normal weiter.");return}
  const step=Math.floor((LENGTH-next)/16);
  if(step>spoken.current){spoken.current=step;if(step>0&&step<cues.length)say(cues[step])}
 }
 useEffect(()=>{
  document.addEventListener("visibilitychange",tick);
  return()=>{document.removeEventListener("visibilitychange",tick);stopInterval();window.speechSynthesis?.cancel()};
 },[]);
 function startOrPause(){
  if(running){setRemaining(Math.max(0,Math.ceil((end.current-Date.now())/1000)));stopInterval();setRunning(false);window.speechSynthesis?.cancel();return}
  const duration=remaining===0?LENGTH:remaining;
  if(remaining===0)setRemaining(LENGTH);
  end.current=Date.now()+duration*1000;spoken.current=-1;setRunning(true);
  if(duration===LENGTH)say(cues[0]);
  interval.current=setInterval(tick,250);
 }
 function reset(){stopInterval();setRunning(false);setRemaining(LENGTH);spoken.current=-1;window.speechSynthesis?.cancel()}
 function toggleVoice(){setNarration(!narration);window.speechSynthesis?.cancel()}
 const elapsed=LENGTH-remaining;
 const phase=Math.floor(elapsed/4)%2===0?"EINATMEN":"AUSATMEN";
 return <section className={styles.layout} aria-label="Zwei Minuten Atemtraining">
  <div className={styles.stage}>
   <div className={styles.stageHeader}><span className={styles.eyebrow}>GEFÜHRTE ATEMPAUSE / 001</span><span className={styles.stageCount}>120 SEKUNDEN</span></div>
   <div className={styles.orbitSpace}>
    <div className={styles.halo+" "+(running?styles.haloActive:"")} aria-hidden="true"/>
    <div className={styles.orbit} role="timer" aria-label={"Verbleibende Zeit "+clock(remaining)} style={{background:"conic-gradient(#D4FF00 "+(elapsed/LENGTH*100)+"%,#2C393C 0%)"}}>
     <div className={styles.orbitInner}>
      <span className={styles.clock}>{clock(remaining)}</span>
      <span aria-live="off" className={styles.phase}>{remaining===0?"GESCHAFFT":running?phase:"BEREIT"}</span>
     </div>
    </div>
   </div>
   <div className={styles.breathPrompt} aria-live="off">{remaining===0?"Stark. Atme jetzt ganz normal weiter.":running?phase==="EINATMEN"?"Atme ruhig durch die Nase ein.":"Lass die Luft langsam wieder aus.":"Du bestimmst das Tempo. Starte, wenn du bereit bist."}</div>
   <div className={styles.controls}>
    <button type="button" className={styles.start} onClick={startOrPause}>{running?"PAUSIEREN":remaining===0?"NOCH EINMAL":remaining<LENGTH?"FORTSETZEN":"JETZT STARTEN"} <span aria-hidden="true">{running?"Ⅱ":"↗"}</span></button>
    <button type="button" className={styles.reset} onClick={reset}>ZURÜCKSETZEN</button>
   </div>
   <p className={styles.safety}>Bei Unwohlsein stoppen und normal weiteratmen. Kein Luftanhalten notwendig.</p>
  </div>
  <aside className={styles.sidebar}>
   <div className={styles.sidebarNumber}>01<span>/</span>02</div>
   <div><span className={styles.eyebrow}>BE DIFFERENT / MINDSET</span><h2 className={styles.sideTitle}>STILLNESS<br/><em>IS STRENGTH.</em></h2><p className={styles.sideDescription}>Ein Moment, der nur dir gehört. Ruhiger Atem, klarer Kopf, volle Kontrolle.</p></div>
   <button type="button" disabled={!supported} role="switch" aria-checked={narration} className={styles.narration+" "+(narration?styles.narrationActive:"")} onClick={toggleVoice}>
    <span className={styles.speakerIcon} aria-hidden="true">◖))</span><span className={styles.speakerText}><strong>{!supported?"SPRACHE NICHT VERFÜGBAR":narration?"GUIDE AUDIO AKTIV":"GUIDE AUDIO EINSCHALTEN"}</strong><small>Geführte Atemübung mit Systemstimme</small></span><span className={styles.switch}>{narration?"ON":"OFF"}</span>
   </button>
   <div className={styles.sideFooter}><span>4 SEK. EIN</span><span className={styles.dot}/><span>4 SEK. AUS</span><span className={styles.dot}/><span>KEIN HALTEN</span></div>
  </aside>
 </section>
}
