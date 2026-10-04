"use client";
import {useEffect,useState} from "react";
type Challenge={id:string;title:string;description:string|null;proOnly:boolean};
type Entry={challengeId:string;progress:number;completedAt:string|null};
type Badge={id:string;name:string};
type Leader={userId:string;name:string;improvement:number;current:number};

export default function CommunityClient({challenges,entries,badges,leaderboard}:{challenges:Challenge[];entries:Entry[];badges:Badge[];leaderboard:Leader[]}){
 const [code,setCode]=useState("");const [status,setStatus]=useState("");
 useEffect(()=>{fetch("/api/referral").then(r=>r.json()).then(j=>setCode(j.code||"")).catch(()=>{})},[]);
 async function join(id:string){const r=await fetch(`/api/challenges/${id}/join`,{method:"POST"});const j=await r.json();setStatus(r.ok?"Aufgabe gestartet.":j.error||"Nicht verfügbar.");if(r.ok)setTimeout(()=>location.reload(),400)}
 const map=new Map(entries.map(e=>[e.challengeId,e]));
 return <>
   <section className="challenge-grid">{challenges.map(c=>{const e=map.get(c.id);return <article className="panel" key={c.id}><span className="eyebrow">{c.proOnly?"PRO AUFGABE":"AUFGABE"}</span><h2>{c.title}</h2><p className="muted">{c.description}</p>{e?<><div className="challenge-progress"><i style={{width:`${Math.round(e.progress)}%`}}/></div><small>{Math.round(e.progress)} % {e.completedAt?"· ABGESCHLOSSEN":""}</small></>:<button className="secondary" onClick={()=>join(c.id)}>TEILNEHMEN</button>}</article>})}</section>
   <article className="panel"><span className="eyebrow">ABZEICHEN</span><h2>Deine Meilensteine</h2><div className="badge-strip">{badges.length?badges.map(b=><span key={b.id}><b>◆</b>{b.name}</span>):<span className="muted">Das erste Abzeichen wartet auf dich.</span>}</div></article>
   <article className="panel leaderboard-panel"><div className="panel-head"><div><span className="eyebrow">RANGLISTE DER VERBESSERUNG</span><h2>Wer entwickelt sich?</h2></div><span className="tag">30 TAGE</span></div>{leaderboard.map((x,i)=><div className="leader-row" key={x.userId}><strong>{String(i+1).padStart(2,"0")}</strong><span>{x.name}</span><b>{x.improvement>=0?"+":""}{x.improvement}</b><small>Wert {x.current}</small></div>)}</article>
   <article className="panel referral-card"><div><span className="eyebrow">EINLADUNG</span><h2>Freund einladen</h2><p className="muted">Wenn dein eingeladener Freund erstmals ein echtes PRO Abo kauft, erhältst du automatisch 30 Tage PRO.</p></div><strong>{code||"…"}</strong></article>
   <article className="panel share-card"><div><span className="eyebrow">FORTSCHRITTSBILD</span><h2>Teile deinen Fortschritt</h2></div><a className="primary compact" href="/api/story" target="_blank">FORTSCHRITTSBILD ÖFFNEN</a></article>
   {status&&<div className="save-toast">{status}</div>}
 </>;
}