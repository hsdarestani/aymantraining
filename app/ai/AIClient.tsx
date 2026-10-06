"use client";
import {Copy} from "../components/Locale";



import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
export default function AIClient(){
 const [data,setData]=useState<any>({items:[]}),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await fetch('/api/ai'),d=await r.json();if(!r.ok)throw Error(d.error);setData(d)},[]);
 useEffect(()=>{load().catch(e=>setError(e.message))},[load]);
 async function send(action='message'){if(busy||(!message.trim()&&action==='message'))return;setBusy(true);setError('');try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:message.trim()||'Ich möchte mit meinem Trainer sprechen.',action})}),d=await r.json();if(!r.ok)throw Error(d.error);setMessage('');await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <main className="sub-shell ai-shell"><header className="sub-top"><Link href="/coach"><Copy text={"← TRAINER"}/></Link></header><section className="page-hero"><h1>Different AI</h1><p><Copy text={"Automatisierte Hilfe. Dein Trainer entscheidet über Planänderungen."}/></p></section><article className="panel ai-conversation">{data.handoff&&<p role="status"><Copy text={"AN TRAINER ÜBERGEBEN ·"}/>{data.handoff.status}</p>}{data.items.map((m:any)=><div className={m.role==='user'?'ai-message ai-message-user':'ai-message'} key={m.id}><strong><Copy text={m.role==='user'?'DU':'DIFFERENT AI'}/></strong><p>{m.content}</p></div>)}<label className="ai-message-field"><Copy text={"Nachricht"}/><textarea rows={5} value={message} maxLength={2000} onChange={e=>setMessage(e.target.value)}/></label><div className="row-actions ai-actions"><button className="primary" disabled={busy||!message.trim()} onClick={()=>send()}><Copy text={"SENDEN"}/></button><button className="secondary" disabled={busy||Boolean(data.handoff)} onClick={()=>send('handoff')}><Copy text={"AN TRAINER ÜBERGEBEN"}/></button></div>{error&&<p role="alert"><Copy text={error}/></p>}</article></main>
}
