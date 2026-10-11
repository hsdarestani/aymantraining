"use client";
import {Copy,LocalizedValue} from "../components/Locale";





import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type DemoPreview={samples:Array<{date:string;steps:number;sleepMinutes:number;restingHr:number;hrv:number;vo2max:number}>};
export default function WearablesClient({demoPreview}:{demoPreview:DemoPreview|null}){
 const [data,setData]=useState<any>({items:[],providers:[]}),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await fetch('/api/wearables/connections');if(!r.ok)throw Error('Verbindungen konnten nicht geladen werden.');setData(await r.json())},[]);
 useEffect(()=>{load().catch(e=>setStatus(e.message));const refresh=()=>load().catch(()=>{});window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[load]);
 async function action(provider:string,action:string){setBusy(true);setStatus('');try{const r=await fetch('/api/wearables/connections',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider,action})});const d=await r.json();if(!r.ok)throw Error(d.error);if(d.connectUrl){location.assign(d.connectUrl);return}setStatus(d.pending?"Synchronisierung angefordert.":d.revokePending?'Lokal getrennt. Die Trennung beim Anbieter muss erneut versucht werden.':action==='disconnect'?'Verbindung getrennt.':'Daten synchronisiert.');await load()}catch(e:any){setStatus(e.message||'Verbindung fehlgeschlagen.')}finally{setBusy(false)}}
 return <main className="sub-shell"><header className="sub-top"><Link href="/settings"><Copy text={"← EINSTELLUNGEN"}/></Link></header><section className="page-hero"><h1>Wearables</h1><p><Copy text={"Verbinden, synchronisieren und trennen."}/></p></section>{demoPreview?.samples.length?<article className="panel bd-wearable-demo">
  <span className="eyebrow">DEMO · OFFLINE VORSCHAU</span>
  <h2>7 Tage Aktivität und Regeneration</h2>
  <p className="muted">Nur synthetische Beispieldaten. Kein Gerät verbunden und keine echten Gesundheitsdaten synchronisiert.</p>
  <div className="bd-wearable-demo-cards">
    <div><span>Ø SCHRITTE</span><strong>{Math.round(demoPreview.samples.reduce((s,x)=>s+x.steps,0)/demoPreview.samples.length).toLocaleString("de-DE")}</strong></div>
    <div><span>Ø SCHLAF</span><strong>{(demoPreview.samples.reduce((s,x)=>s+x.sleepMinutes,0)/demoPreview.samples.length/60).toFixed(1)} h</strong></div>
    <div><span>Ø RUHEPULS</span><strong>{Math.round(demoPreview.samples.reduce((s,x)=>s+x.restingHr,0)/demoPreview.samples.length)} bpm</strong></div>
    <div><span>Ø HRV</span><strong>{Math.round(demoPreview.samples.reduce((s,x)=>s+x.hrv,0)/demoPreview.samples.length)} ms</strong></div>
  </div>
  <div className="bd-wearable-demo-bars">{demoPreview.samples.slice().reverse().map(d=><div key={d.date} title={d.date+": "+d.steps+" Schritte"}>
    <span style={{height:Math.max(12,Math.min(100,d.steps/12000*100))+"%"}}/>
    <small>{d.date.slice(8)}</small>
  </div>)}</div>
</article>:null}<article className="panel"><p><Copy text={"Apple Gesundheitsdaten und Android Gesundheitsdaten werden direkt in der App verbunden."}/></p>{data.providers.map((p:any)=>{const conn=data.items.find((x:any)=>x.provider===p.provider),connected=conn?.status==='CONNECTED';return <div className="setting-row" key={p.provider}><div><strong>{p.provider.toUpperCase()}</strong><p><Copy text={connected?'VERBUNDEN':p.configured?'BEREIT':'NOCH NICHT AKTIVIERT'}/></p>{conn?.lastSyncAt&&<small><LocalizedValue value={new Date(conn.lastSyncAt)} format="toLocaleString"/></small>}</div><div className="row-actions">{connected?<button disabled={busy} className="secondary" onClick={()=>action(p.provider,'sync')}><Copy text={"SYNCHRONISIEREN"}/></button>:<button disabled={busy||!p.configured} className="secondary" onClick={()=>action(p.provider,'connect')}><Copy text={"VERBINDEN"}/></button>}{conn&&<button disabled={busy} className="secondary" onClick={()=>action(p.provider,'disconnect')}><Copy text={"TRENNEN"}/></button>}</div></div>})}<p role="status"><Copy text={status}/></p></article></main>
}
