"use client";
import {useState} from "react";

type Settings={proMonthly:number;proYearly:number;proCapacity:number;waitlist:boolean;videoAnalysesPerMonth:number;coachResponseHours:number;nutritionMode:"manual"|"external"|"internal";brandName:string;accent:string;supportEmail:string};
export default function AppSettingsForm({initial,integrations}:{initial:Settings;integrations:Record<string,boolean>}){
  const [v,setV]=useState(initial);const [status,setStatus]=useState("");
  const set=(key:keyof Settings,value:any)=>setV({...v,[key]:value});
  async function save(){setStatus("Speichere…");const r=await fetch("/api/admin/settings",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(v)});setStatus(r.ok?"Gespeichert.":"Speichern fehlgeschlagen.");}
  return <div className="settings-admin-grid">
    <article className="panel mini-form">
      <span className="eyebrow">BUSINESS SETTINGS</span><h2>PRO & Coaching</h2>
      <label>PRO monatlich €<input type="number" step=".01" value={v.proMonthly} onChange={e=>set("proMonthly",Number(e.target.value))}/></label>
      <label>PRO jährlich €<input type="number" step=".01" value={v.proYearly} onChange={e=>set("proYearly",Number(e.target.value))}/></label>
      <label>PRO Kapazität<input type="number" value={v.proCapacity} onChange={e=>set("proCapacity",Number(e.target.value))}/></label>
      <label className="checkline"><input type="checkbox" checked={v.waitlist} onChange={e=>set("waitlist",e.target.checked)}/> Waitlist aktiv</label>
      <label>Videoanalysen pro Monat<input type="number" value={v.videoAnalysesPerMonth} onChange={e=>set("videoAnalysesPerMonth",Number(e.target.value))}/></label>
      <label>Coach Antwortzeit in Stunden<input type="number" value={v.coachResponseHours} onChange={e=>set("coachResponseHours",Number(e.target.value))}/></label>
      <label>Nutrition<select value={v.nutritionMode} onChange={e=>set("nutritionMode",e.target.value)}><option value="manual">Manual / Health</option><option value="external">External Provider</option><option value="internal">Internal Database</option></select></label>
    </article>
    <article className="panel mini-form">
      <span className="eyebrow">BRAND</span><h2>Darstellung</h2>
      <label>Brand Name<input value={v.brandName} onChange={e=>set("brandName",e.target.value)}/></label>
      <label>Accent<input value={v.accent} onChange={e=>set("accent",e.target.value)}/></label>
      <label>Support E-Mail<input type="email" value={v.supportEmail} onChange={e=>set("supportEmail",e.target.value)}/></label>
      <button className="primary compact" onClick={save}>EINSTELLUNGEN SPEICHERN</button>{status&&<small>{status}</small>}
    </article>
    <article className="panel integrations-card">
      <span className="eyebrow">INTEGRATIONS</span><h2>Secret Status</h2>
      <p className="muted">Hier werden nur Statuswerte angezeigt. Secrets bleiben ausschließlich in der Server Umgebung oder GitHub Secrets.</p>
      <div className="integration-list">{Object.entries(integrations).map(([name,on])=><div key={name}><span className={on?"integration-dot on":"integration-dot"}/><strong>{name.toUpperCase()}</strong><small>{on?"CONNECTED":"WAITING FOR SECRET"}</small></div>)}</div>
    </article>
  </div>;
}
