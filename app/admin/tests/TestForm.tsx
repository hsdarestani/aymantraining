"use client";
import {Copy} from "../../components/Locale";

import {useState} from "react";

const blocks=[
 ["pushups","Liegestütze","Wdh"],["pullups","Klimmzüge","Wdh"],["dips","Dips","Wdh"],["plank","Unterarmstütz","Sekunden"],
 ["5k_time","5 km Lauf","Minuten"],["30m_sprint","30 m Sprint","Sekunden"],["jump","Sprung","cm"],["mobility","Beweglichkeit","Punkte"],["skill","Fähigkeit","Punkte"]
] as const;

type Detail={instructions:string;instructionVideoUrl:string};

export default function TestForm({users}:{users:{id:string;name:string}[]}){
 const [userId,setUserId]=useState(users[0]?.id||"");
 const [name,setName]=useState("BE DIFFERENT TEST");
 const [selected,setSelected]=useState<string[]>(["pushups","plank"]);
 const [details,setDetails]=useState<Record<string,Detail>>({
  pushups:{instructions:"Saubere Wiederholungen bis Technikverlust.",instructionVideoUrl:""},
  plank:{instructions:"Unterarmstütz sauber halten und Zeit stoppen.",instructionVideoUrl:""}
 });
 const [status,setStatus]=useState("");

 function detail(metric:string){return details[metric]||{instructions:"",instructionVideoUrl:""}}
 function patch(metric:string,patch:Partial<Detail>){setDetails(x=>({...x,[metric]:{...detail(metric),...patch}}))}

 async function create(){
  const definition=blocks.filter(x=>selected.includes(x[0])).map(([metric,label,unit])=>({
   metric,label,unit,
   instructions:detail(metric).instructions||undefined,
   instructionVideoUrl:detail(metric).instructionVideoUrl||undefined
  }));
  if(!definition.length){setStatus("Mindestens einen Testbaustein wählen.");return}
  const r=await fetch("/api/admin/tests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({userId,name,definition})});
  const j=await r.json().catch(()=>({}));
  setStatus(r.ok?"Test geplant und Benachrichtigung angelegt.":j.error||"Fehler.");
  if(r.ok)setTimeout(()=>location.reload(),500);
 }

 return <article className="panel mini-form">
  <span className="eyebrow">TEST BUILDER</span><h2><Copy text={"Test zuweisen"}/></h2>
  <select value={userId} onChange={e=>setUserId(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
  <input value={name} onChange={e=>setName(e.target.value)}/>
  <div className="test-block-grid">{blocks.map(([metric,label,unit])=><button type="button" key={metric} className={selected.includes(metric)?"selected":""} onClick={()=>setSelected(x=>x.includes(metric)?x.filter(v=>v!==metric):[...x,metric])}><strong>{label}</strong><small>{unit}</small></button>)}</div>
  {blocks.filter(x=>selected.includes(x[0])).map(([metric,label])=><details key={metric} className="rule-editor">
    <summary><strong>{label}</strong><span><Copy text={"ANLEITUNG"}/></span></summary>
    <div className="rule-editor-body">
      <label><Copy text={"Anweisung"}/><textarea value={detail(metric).instructions} onChange={e=>patch(metric,{instructions:e.target.value})}/></label>
      <label><Copy text={"Anleitungsvideo URL"}/><input value={detail(metric).instructionVideoUrl} onChange={e=>patch(metric,{instructionVideoUrl:e.target.value})} placeholder="Optional"/></label>
    </div>
  </details>)}
  <button className="primary compact" onClick={create}><Copy text={"TEST PLANEN"}/></button>{status&&<small><Copy text={status}/></small>}
 </article>;
}
