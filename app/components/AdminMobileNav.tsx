"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

const links=[
  ["/admin","Attention Queue"],
  ["/admin/customers","Kunden"],
  ["/admin/plans","Trainingspläne"],
  ["/admin/exercises","Übungen"],
  ["/admin/tests","Tests"],
  ["/admin/inbox","Inbox"],
  ["/admin/rules","Rules & Score"],
  ["/admin/norms","Reference Norms"],
  ["/admin/campaigns","Push Campaigns"],
  ["/admin/subscriptions","Subscriptions"],
  ["/admin/settings","App Settings"]
];

export default function AdminMobileNav(){
  const path=usePathname();
  const [open,setOpen]=useState(false);
  return <>
    <div className="admin-mobile-top">
      <Link href="/admin" className="app-wordmark">BE <b>DIFFERENT</b></Link>
      <span>COACH</span>
      <button onClick={()=>setOpen(!open)} aria-label="Coach Menü">{open?"×":"☰"}</button>
    </div>
    <div className={open?"admin-mobile-sheet open":"admin-mobile-sheet"}>
      {links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={path===href?"active":""}>{label}<b>↗</b></Link>)}
      <Link href="/dashboard" onClick={()=>setOpen(false)}>Athlete View<b>↗</b></Link>
    </div>
  </>;
}
