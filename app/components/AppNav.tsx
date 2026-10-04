"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

type IconName="home"|"training"|"progress"|"coach"|"athlete"|"menu"|"close"|"back";
function Icon({name}:{name:IconName}){
  const common={width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(name==="home")return <svg {...common}><path d="M3.5 10.8 12 3.8l8.5 7v9.4h-6v-6.3h-5v6.3h-6z"/></svg>;
  if(name==="training")return <svg {...common}><path d="M6 8v8M3.5 9.5v5M18 8v8M20.5 9.5v5M6 12h12"/></svg>;
  if(name==="progress")return <svg {...common}><path d="M4 18V9M10 18V5M16 18v-7M22 18V3"/><path d="M3 20h20"/></svg>;
  if(name==="coach")return <svg {...common}><path d="M7.5 18.5 4 20l1.4-3.5A8 8 0 1 1 7.5 18.5Z"/><path d="M8.5 10.5h7M8.5 14h4"/></svg>;
  if(name==="athlete")return <svg {...common}><circle cx="12" cy="7" r="3.2"/><path d="M5.5 21c.7-4 3-6.2 6.5-6.2s5.8 2.2 6.5 6.2"/></svg>;
  if(name==="close")return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if(name==="back")return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

const items=[
  ["/dashboard","START","home"],
  ["/training","TRAINING","training"],
  ["/progress","FORTSCHRITT","progress"],
  ["/coach","TRAINER","coach"],
  ["/athlete","ATHLET","athlete"]
] as const;

const more=[
  ["/report","Wochenbericht"],
  ["/plans","Trainingspläne"],
  ["/library","Übungsbibliothek"],
  ["/lifestyle","Regeneration"],
  ["/fuel","Ernährung"],
  ["/tests","Leistungstests"],
  ["/checkin","Wochencheck"],
  ["/community","Gemeinschaft"],
  ["/pricing","Mitgliedschaft"],
  ["/settings","Einstellungen"],
  ["/legal/privacy","Datenschutz"],
  ["/legal/impressum","Impressum"]
] as const;

export default function AppNav(){
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const workout=/^\/training\/[^/]+$/.test(path);

  return <>
    <header className="app-desktop-top">
      <div className="app-desktop-inner">
        <Link href="/dashboard" className="app-wordmark">BE <b>DIFFERENT</b></Link>
        {workout&&<Link href="/training" className="desktop-back"><Icon name="back"/> ZURÜCK ZUM TRAINING</Link>}
        <nav aria-label="Hauptnavigation">
          {items.map(([href,label,icon])=>{
            const active=path===href||(href!=="/dashboard"&&path.startsWith(href+"/"));
            return <Link href={href} className={active?"active":""} key={href}><Icon name={icon}/><span>{label}</span></Link>;
          })}
        </nav>
        <button className="desktop-menu" aria-label="Menü öffnen" onClick={()=>setOpen(true)}><Icon name="menu"/><span>MENÜ</span></button>
      </div>
    </header>

    <div className="app-mobile-top">
      {workout?<Link href="/training" className="mobile-back"><Icon name="back"/><span>TRAINING</span></Link>:<Link href="/dashboard" className="app-wordmark">BE <b>DIFFERENT</b></Link>}
      <button aria-label="Menü öffnen" onClick={()=>setOpen(true)}><Icon name="menu"/></button>
    </div>

    <nav className="app-bottom-nav" aria-label="Hauptnavigation">
      {items.map(([href,label,icon])=>{
        const active=path===href||(href!=="/dashboard"&&path.startsWith(href+"/"));
        return <Link href={href} className={active?"active":""} key={href}><span className="nav-icon"><Icon name={icon}/></span><small>{label}</small></Link>;
      })}
    </nav>

    <div className={open?"app-drawer open":"app-drawer"} aria-hidden={!open}>
      <button className="drawer-backdrop" aria-label="Menü schließen" onClick={()=>setOpen(false)}/>
      <aside>
        <div className="drawer-head"><span className="app-wordmark">BE <b>DIFFERENT</b></span><button aria-label="Menü schließen" onClick={()=>setOpen(false)}><Icon name="close"/></button></div>
        <div className="drawer-identity"><span>DEINE ENTWICKLUNG</span><strong>DEIN ATHLET.</strong></div>
        <div className="drawer-primary">
          {items.map(([href,label,icon])=><Link href={href} onClick={()=>setOpen(false)} key={href}><Icon name={icon}/><span>{label}</span></Link>)}
        </div>
        <div className="drawer-links">{more.map(([href,label])=><Link href={href} onClick={()=>setOpen(false)} key={href}>{label}<b>→</b></Link>)}</div>
        <p>Normal ist langweilig.</p>
      </aside>
    </div>
  </>;
}