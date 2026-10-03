"use client";
import {useEffect,useState} from "react";
export default function LifestyleClient(){
  const [seconds,setSeconds]=useState(120),[running,setRunning]=useState(false);
  useEffect(()=>{if(!running||seconds<=0)return;const id=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(id)},[running,seconds]);
  useEffect(()=>{if(seconds===0)setRunning(false)},[seconds]);
  function reset(){setRunning(false);setSeconds(120)}
  return <article className="panel breathing-card"><span className="eyebrow">BE FOCUSED</span><h2>2 Minuten Atmung</h2><div className={running?"breathing-orb running":"breathing-orb"}><strong>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</strong><small>{running?"LANGSAM ATMEN":"READY"}</small></div><div className="breathing-actions"><button className="primary compact" onClick={()=>setRunning(!running)}>{running?"PAUSE":"START"}</button><button className="secondary" onClick={reset}>RESET</button></div></article>;
}