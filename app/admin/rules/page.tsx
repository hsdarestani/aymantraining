"use client";
import Link from "next/link";
import {useState} from "react";

const defaults=[
  {name:"Recovery niedrig",condition:"Recovery < 60",action:"Recovery Tag vorschlagen",enabled:true},
  {name:"Schlaf kritisch",condition:"Schlaf < 6h an 3/5 Nächten",action:"Training moderat",enabled:true},
  {name:"Workouts verpasst",condition:"2 geplante Workouts verpasst",action:"Coach informieren",enabled:true},
  {name:"Neuer Rekord",condition:"PR erkannt",action:"Erfolg Push",enabled:true}
];

export default function RulesAdmin(){
  const [rules,setRules]=useState(defaults);
  return <main className="admin-content" style={{margin:"0 auto"}}>
    <header className="admin-header">
      <div><span className="eyebrow">COACH PANEL</span><h1>Coaching Engine</h1></div>
      <Link href="/admin" className="ghost">← Dashboard</Link>
    </header>
    <article className="panel">
      <div className="panel-head">
        <div><span className="eyebrow">PHASE 1 · RULE BASED</span><h2>Regeln</h2></div>
        <button className="primary compact">+ REGEL</button>
      </div>
      <div className="rule-list">
        {rules.map((r,i)=><div className="rule-row" key={r.name}>
          <button className={r.enabled?"toggle on":"toggle"} onClick={()=>setRules(rules.map((x,j)=>j===i?{...x,enabled:!x.enabled}:x))}>{r.enabled?"ON":"OFF"}</button>
          <div><strong>{r.name}</strong><small>{r.condition}</small></div>
          <span>→</span>
          <div><strong>{r.action}</strong><small>Coach bestätigt relevante Planänderungen</small></div>
        </div>)}
      </div>
    </article>
  </main>;
}
