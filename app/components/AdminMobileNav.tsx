"use client";
import {Copy,LocalizedElement} from "./Locale";


import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

const links=[
  ["/admin","Aufmerksamkeit"],
  ["/admin/customers","Kunden"],
  ["/admin/plans","Trainingspläne"],
  ["/admin/exercises","Übungen"],
  ["/admin/tests","Tests"],
  ["/admin/inbox","Nachrichten"],
  ["/admin/rules","Regeln und Score"],
  ["/admin/norms","Referenzwerte"],
  ["/admin/campaigns","Push Kampagnen"],
  ["/admin/subscriptions","Abos"],
  ["/admin/team","Trainer Team"],
  ["/admin/events","Events und Video Calls"],
  ["/admin/briefs","Morgenübersicht"],
  ["/admin/ai","Different AI"],
  ["/admin/kpi","KPI"],
  ["/admin/settings","App Einstellungen"]
];

export default function AdminMobileNav(){
  const path=usePathname();
  const [open,setOpen]=useState(false);
  return <>
    <div className="admin-mobile-top">
      <Link href="/admin" className="app-wordmark">BE <b>DIFFERENT</b></Link>
      <span><Copy text={"TRAINER"}/></span>
      <LocalizedElement as="button" onClick={()=>setOpen(!open)} aria-label="Trainer Menü">{open?"×":"☰"}</LocalizedElement>
    </div>
    <div className={open?"admin-mobile-sheet open":"admin-mobile-sheet"}>
      {links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={path===href?"active":""}>{label}<b>↗</b></Link>)}
      <Link href="/dashboard" onClick={()=>setOpen(false)}><Copy text={"Athletenansicht"}/><b>↗</b></Link>
    </div>
  </>;
}
