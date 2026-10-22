import Link from "next/link";
import {requireUser} from "../../lib/auth";
import CycleClient from "./CycleClient";
import "./cycle.css";
export const dynamic="force-dynamic";
export default async function CyclePage(){
 const user=await requireUser();
 return <main className="sub-shell">
  <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link>
   <nav><Link href="/dashboard">STARTSEITE</Link><Link href="/settings">EINSTELLUNGEN</Link></nav></header>
  <section className="page-hero compact-hero"><div><span className="eyebrow">FREIWILLIG · PRIVAT</span>
   <h1>DEIN ZYKLUS. DEINE ENTSCHEIDUNG.</h1>
   <p>Nur für dich. Nichts davon verändert automatisch deine Trainingsstufe oder deinen Trainingsplan.</p></div></section>
  {user.role==="ATHLETE"?<CycleClient/>:<p>Diese Funktion steht nur Athletinnen und Athleten zur Verfügung.</p>}
 </main>;
}
