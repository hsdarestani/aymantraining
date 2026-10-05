"use client";
import {Copy} from "../../components/Locale";

import {useState} from "react";

type Settings={
 proMonthly:number;proYearly:number;proCapacity:number;waitlist:boolean;videoAnalysesPerMonth:number;coachResponseHours:number;
 nutritionMode:"manual"|"external"|"internal";brandName:string;accent:string;supportEmail:string;
 legalName:string;legalAddress:string;legalEmail:string;legalPhone:string;managingDirector:string;registerCourt:string;registerNumber:string;vatId:string
};
export default function AppSettingsForm({initial,integrations}:{initial:Settings;integrations:Record<string,boolean>}){
 const [v,setV]=useState(initial);const [status,setStatus]=useState("");const set=(key:keyof Settings,value:any)=>setV({...v,[key]:value});
 async function save(){setStatus("Speichere…");const r=await fetch("/api/admin/settings",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(v)});setStatus(r.ok?"Gespeichert.":"Speichern fehlgeschlagen.")}
 return <div className="settings-admin-grid">
  <article className="panel mini-form"><span className="eyebrow"><Copy text={"GESCHÄFTSEINSTELLUNGEN"}/></span><h2>PRO & Coaching</h2>
   <label><Copy text={"PRO monatlich €"}/><input type="number" step=".01" value={v.proMonthly} onChange={e=>set("proMonthly",Number(e.target.value))}/></label>
   <label><Copy text={"PRO jährlich €"}/><input type="number" step=".01" value={v.proYearly} onChange={e=>set("proYearly",Number(e.target.value))}/></label>
   <label><Copy text={"PRO Kapazität"}/><input type="number" value={v.proCapacity} onChange={e=>set("proCapacity",Number(e.target.value))}/></label>
   <label className="checkline"><input type="checkbox" checked={v.waitlist} onChange={e=>set("waitlist",e.target.checked)}/><Copy text={"Warteliste aktiv"}/></label>
   <label><Copy text={"Videoanalysen pro Monat"}/><input type="number" value={v.videoAnalysesPerMonth} onChange={e=>set("videoAnalysesPerMonth",Number(e.target.value))}/></label>
   <label><Copy text={"Trainer Antwortzeit in Stunden"}/><input type="number" value={v.coachResponseHours} onChange={e=>set("coachResponseHours",Number(e.target.value))}/></label>
   <label>Nutrition<select value={v.nutritionMode} onChange={e=>set("nutritionMode",e.target.value)}><option value="manual"><Copy text={"Manuell / Gesundheitsdaten"}/></option><option value="external"><Copy text={"Externer Provider"}/></option><option value="internal"><Copy text={"Eigene Datenbank"}/></option></select></label>
  </article>
  <article className="panel mini-form"><span className="eyebrow">BRAND</span><h2><Copy text={"Darstellung"}/></h2><label>Brand Name<input value={v.brandName} onChange={e=>set("brandName",e.target.value)}/></label><label>Accent<input value={v.accent} onChange={e=>set("accent",e.target.value)}/></label><label><Copy text={"Support E Mail"}/><input type="email" value={v.supportEmail} onChange={e=>set("supportEmail",e.target.value)}/></label></article>
  <article className="panel mini-form legal-settings"><span className="eyebrow">LEGAL</span><h2><Copy text={"Rechtliche Angaben"}/></h2>
   <label><Copy text={"Rechtlicher Name"}/><input value={v.legalName} onChange={e=>set("legalName",e.target.value)}/></label>
   <label><Copy text={"Anschrift"}/><textarea value={v.legalAddress} onChange={e=>set("legalAddress",e.target.value)}/></label>
   <label><Copy text={"Geschäftsführung"}/><input value={v.managingDirector} onChange={e=>set("managingDirector",e.target.value)}/></label>
   <label><Copy text={"Rechtliche E Mail"}/><input type="email" value={v.legalEmail} onChange={e=>set("legalEmail",e.target.value)}/></label>
   <label><Copy text={"Telefon"}/><input value={v.legalPhone} onChange={e=>set("legalPhone",e.target.value)}/></label>
   <label><Copy text={"Registergericht"}/><input value={v.registerCourt} onChange={e=>set("registerCourt",e.target.value)}/></label>
   <label><Copy text={"Registernummer"}/><input value={v.registerNumber} onChange={e=>set("registerNumber",e.target.value)}/></label>
   <label><Copy text={"USt IdNr"}/><input value={v.vatId} onChange={e=>set("vatId",e.target.value)}/></label>
   <button className="primary compact" onClick={save}><Copy text={"EINSTELLUNGEN SPEICHERN"}/></button>{status&&<small><Copy text={status}/></small>}
  </article>
  <article className="panel integrations-card"><span className="eyebrow">INTEGRATIONS</span><h2><Copy text={"ZUGANGSDATEN"}/></h2><p className="muted"><Copy text={"Hier werden nur Statuswerte angezeigt. Secrets bleiben ausschließlich in der Server Umgebung oder GitHub Secrets."}/></p><div className="integration-list">{Object.entries(integrations).map(([name,on])=><div key={name}><span className={on?"integration-dot on":"integration-dot"}/><strong>{name.toUpperCase()}</strong><small>{on?"CONNECTED":"WAITING FOR SECRET"}</small></div>)}</div></article>
 </div>;
}