"use client";
import {Copy,LocalizedElement} from "../components/Locale";



import {useState} from "react";
export default function BeforeAfter({beforeId,afterId}:{beforeId:string;afterId:string}){
  const [value,setValue]=useState(50);
  return <article className="panel before-after-panel">
    <div className="panel-head"><div><span className="eyebrow"><Copy text={"VORHER UND NACHHER"}/></span><h2><Copy text={"Dein Fortschritt"}/></h2></div><span className="tag"><Copy text={"PRIVAT"}/></span></div>
    <div className="before-after" style={{"--split":`${value}%`} as React.CSSProperties}>
      <LocalizedElement as="img" src={`/api/media/${beforeId}`} alt="Vorher"/>
      <div className="after-layer"><LocalizedElement as="img" src={`/api/media/${afterId}`} alt="Nachher"/></div>
      <i/>
      <span className="before-label"><Copy text={"VORHER"}/></span><span className="after-label"><Copy text={"NACHHER"}/></span>
    </div>
    <LocalizedElement as="input" className="compare-range" aria-label="Vorher Nachher Vergleich" type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))}/>
  </article>
}