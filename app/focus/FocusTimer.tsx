"use client";
import {Copy} from "../components/Locale";

import {useEffect,useRef,useState} from "react";
import {useCoachVoice} from "../components/useCoachVoice";
import styles from "./focus.module.css";
import {useLocale} from "../components/Locale";
import {translate} from "../../lib/i18n/translate";

const LENGTH=120;
function clock(n:number){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
export default function FocusTimer(){
 const voice=useCoachVoice("MOTIVATION");
 const locale=useLocale();
 const t=(text:string)=>translate(text,locale);
 const voiceLabels=locale==="de"?{unavailable:"Audio momentan nicht verfügbar."}:{unavailable:"Audio unavailable."};
 const [remaining,setRemaining]=useState(LENGTH),[running,setRunning]=useState(false);
 const end=useRef(0),interval=useRef<ReturnType<typeof setInterval>|null>(null),spoken=useRef(-1);
 function stopInterval(){if(interval.current){clearInterval(interval.current);interval.current=null}}
 function tick(){
  const next=Math.max(0,Math.ceil((end.current-Date.now())/1000));
  setRemaining(next);
  if(next===0){stopInterval();setRunning(false);voice.stop();return}
  const step=Math.floor((LENGTH-next)/16);
  if(step>spoken.current){spoken.current=step}
 }
 useEffect(()=>{
  return()=>{stopInterval();voice.stop()};
 },[]);
 function startOrPause(){
  if(running){setRemaining(Math.max(0,Math.ceil((end.current-Date.now())/1000)));stopInterval();setRunning(false);voice.stop();return}
  const duration=remaining===0?LENGTH:remaining;
  if(remaining===0)setRemaining(LENGTH);
  end.current=Date.now()+duration*1000;spoken.current=-1;setRunning(true);
  voice.play();
  interval.current=setInterval(tick,250);
 }
 function reset(){stopInterval();setRunning(false);setRemaining(LENGTH);spoken.current=-1;voice.stop()}
 function toggleVoice(){void voice.change(!voice.enabled)}
 const elapsed=LENGTH-remaining;
 const phase=Math.floor(elapsed/4)%2===0?"EINATMEN":"AUSATMEN";
 return <section className={styles.layout} aria-label={t("Zwei Minuten Atemtraining")}>
  <div className={styles.stage}>
   <div className={styles.stageHeader}><span className={styles.eyebrow}><Copy text={t("GEFÜHRTE ATEMPAUSE / 001")}/></span><span className={styles.stageCount}><Copy text={t("120 SEKUNDEN")}/></span></div>
   <div className={styles.orbitSpace}>
    <div className={styles.halo+" "+(running?styles.haloActive:"")} aria-hidden="true"/>
    <div className={styles.orbit} role="timer" aria-label={t("Verbleibende Zeit ")+clock(remaining)} style={{background:"conic-gradient(#D4FF00 "+(elapsed/LENGTH*100)+"%,#2C393C 0%)"}}>
     <div className={styles.orbitInner}>
      <span className={styles.clock}>{clock(remaining)}</span>
      <span aria-live="off" className={styles.phase}><Copy text={t(remaining===0?"GESCHAFFT":running?phase:"BEREIT")}/></span>
     </div>
    </div>
   </div>
   <div className={styles.breathPrompt} aria-live="off"><Copy text={t(remaining===0?"Stark. Atme jetzt ganz normal weiter.":running?phase==="EINATMEN"?"Atme ruhig durch die Nase ein.":"Lass die Luft langsam wieder aus.":"Du bestimmst das Tempo. Starte, wenn du bereit bist.")}/></div>
   <div className={styles.controls}>
    <button type="button" className={styles.start} onClick={startOrPause}><Copy text={t(running?"PAUSIEREN":remaining===0?"NOCH EINMAL":remaining<LENGTH?"FORTSETZEN":"JETZT STARTEN")}/> <span aria-hidden="true">{running?"Ⅱ":"↗"}</span></button>
    <button type="button" className={styles.reset} onClick={reset}><Copy text={t("ZURÜCKSETZEN")}/></button>
   </div>
   <p className={styles.safety}><Copy text={t("Bei Unwohlsein stoppen und normal weiteratmen. Kein Luftanhalten notwendig.")}/></p>
  </div>
  <aside className={styles.sidebar}>
   <div className={styles.sidebarNumber}>01<span>/</span>02</div>
   <div><span className={styles.eyebrow}><Copy text={"BE DIFFERENT / MINDSET"}/></span><h2 className={styles.sideTitle}>STILLNESS<br/><em>IS STRENGTH.</em></h2><p className={styles.sideDescription}><Copy text={t("Ein Moment, der nur dir gehört. Ruhiger Atem, klarer Kopf, volle Kontrolle.")}/></p></div>
   <button type="button" disabled={!voice.ready} role="switch" aria-checked={voice.enabled} className={styles.narration+" "+(voice.enabled?styles.narrationActive:"")} onClick={toggleVoice}>
    <span className={styles.speakerIcon} aria-hidden="true">◖))</span><span className={styles.speakerText}><strong><Copy text={t(voice.enabled?"GUIDE AUDIO AKTIV":"GUIDE AUDIO EINSCHALTEN")}/></strong><small><Copy text={t("Trainerstimme")}/></small></span><span className={styles.switch}><Copy text={voice.enabled?"ON":"OFF"}/></span>
   </button>
   {voice.error&&<p role="status">{voiceLabels.unavailable}</p>}
   <div className={styles.sideFooter}><span><Copy text={t("4 SEK. EIN")}/></span><span className={styles.dot}/><span><Copy text={t("4 SEK. AUS")}/></span><span className={styles.dot}/><span><Copy text={t("KEIN HALTEN")}/></span></div>
  </aside>
 </section>
}
