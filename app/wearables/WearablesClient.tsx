"use client";
import {Copy,LocalizedValue} from "../components/Locale";





import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
export default function WearablesClient(){
 const [data,setData]=useState<any>({items:[],providers:[]}),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await fetch('/api/wearables/connections');if(!r.ok)throw Error('Verbindungen konnten nicht geladen werden.');setData(await r.json())},[]);
 useEffect(()=>{load().catch(e=>setStatus(e.message));const refresh=()=>load().catch(()=>{});window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[load]);
 async function action(provider:string,action:string){setBusy(true);setStatus('');try{const r=await fetch('/api/wearables/connections',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider,action})});const d=await r.json();if(!r.ok)throw Error(d.error);if(d.connectUrl){location.assign(d.connectUrl);return}setStatus(d.pending?"Synchronisierung angefordert.":d.revokePending?'Lokal getrennt. Die Trennung beim Anbieter muss erneut versucht werden.':action==='disconnect'?'Verbindung getrennt.':'Daten synchronisiert.');await load()}catch(e:any){setStatus(e.message||'Verbindung fehlgeschlagen.')}finally{setBusy(false)}}
 return <main className="sub-shell"><header className="sub-top"><Link href="/settings"><Copy text={"← EINSTELLUNGEN"}/></Link></header><section className="page-hero"><h1>Wearables</h1><p><Copy text={"Verbinden, synchronisieren und trennen."}/></p></section><article className="panel"><p><Copy text={"Apple Gesundheitsdaten und Android Gesundheitsdaten werden direkt in der App verbunden."}/></p>{data.providers.map((p:any)=>{const conn=data.items.find((x:any)=>x.provider===p.provider),connected=conn?.status==='CONNECTED';return <div className="setting-row" key={p.provider}><div><strong>{p.provider.toUpperCase()}</strong><p><Copy text={connected?'VERBUNDEN':p.configured?'BEREIT':'NOCH NICHT AKTIVIERT'}/></p>{conn?.lastSyncAt&&<small><LocalizedValue value={new Date(conn.lastSyncAt)} format="toLocaleString"/></small>}</div><div className="row-actions">{connected?<button disabled={busy} className="secondary" onClick={()=>action(p.provider,'sync')}><Copy text={"SYNCHRONISIEREN"}/></button>:<button disabled={busy||!p.configured} className="secondary" onClick={()=>action(p.provider,'connect')}><Copy text={"VERBINDEN"}/></button>}{conn&&<button disabled={busy} className="secondary" onClick={()=>action(p.provider,'disconnect')}><Copy text={"TRENNEN"}/></button>}</div></div>})}<p role="status"><Copy text={status}/></p></article></main>
}
