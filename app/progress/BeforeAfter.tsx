"use client";
import {useState} from "react";
export default function BeforeAfter({beforeId,afterId}:{beforeId:string;afterId:string}){
  const [value,setValue]=useState(50);
  return <article className="panel before-after-panel">
    <div className="panel-head"><div><span className="eyebrow">BEFORE / AFTER</span><h2>Dein Fortschritt</h2></div><span className="tag">PRIVATE</span></div>
    <div className="before-after" style={{"--split":`${value}%`} as React.CSSProperties}>
      <img src={`/api/media/${beforeId}`} alt="Vorher"/>
      <div className="after-layer"><img src={`/api/media/${afterId}`} alt="Nachher"/></div>
      <i/>
      <span className="before-label">BEFORE</span><span className="after-label">AFTER</span>
    </div>
    <input className="compare-range" aria-label="Vorher Nachher Vergleich" type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))}/>
  </article>
}