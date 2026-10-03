"use client";
import Link from "next/link";
import {useState} from "react";

const initial=[['Morning Brief',true],['Training Reminder',true],['Recovery Warnungen',true],['Schlaf Reminder',true],['Wasser & Ernährung',false],['Erfolge & Level Up',true]] as [string,boolean][];
export default function Settings(){
  const [items,setItems]=useState(initial);
  return <main className="sub-shell"><header className="sub-top"><Link href="/" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav></header>
  <section className="page-hero compact-hero"><div><span className="eyebrow">SETTINGS</span><h1>Begleitung ohne Spam.</h1><p>Benachrichtigungen bleiben begrenzt, Kategorien sind steuerbar und Ruhezeiten werden respektiert.</p></div><div className="hero-stat"><span>DAILY LIMIT</span><strong>3</strong><small>MAX PUSHES</small></div></section>
  <article className="panel settings-panel"><div className="panel-head"><div><span className="eyebrow">NOTIFICATIONS</span><h2>Kategorien</h2></div><span className="tag">PERSONAL</span></div>{items.map(([name,on],i)=><div className="setting-row" key={name}><div><strong>{name}</strong><small>{on?'Aktiv':'Aus'}</small></div><button className={on?'toggle on':'toggle'} onClick={()=>setItems(items.map((x,j)=>j===i?[x[0],!x[1]]:x))}>{on?'ON':'OFF'}</button></div>)}</article>
  </main>;
}
