import Link from "next/link";
import {requireUser} from "../../lib/auth";
import FocusTimer from "./FocusTimer";
export const dynamic="force-dynamic";
export default async function FocusPage(){
  await requireUser();
  return <main className="sub-shell" style={{maxWidth:900,minHeight:"100vh"}}>
    <header className="sub-top"><Link className="brand" href="/dashboard">BE <span>DIFFERENT</span></Link><Link className="secondary" href="/dashboard">← DASHBOARD</Link></header>
    <section className="page-hero compact-hero">
      <div><span className="eyebrow">BE FOCUSED</span><h1>Dein Moment. Dein Fokus.</h1><p>Zwei Minuten bewusst atmen. Ohne Leistungsdruck. Du bestimmst das Tempo.</p></div>
      <div className="hero-stat"><span>FOKUS</span><strong>02:00</strong><small>ATEMPAUSE</small></div>
    </section>
    <FocusTimer/>
    <p className="muted" style={{marginTop:20,fontSize:13}}>Bei Unwohlsein die Übung stoppen und normal weiteratmen. Kein Luftanhalten notwendig.</p>
  </main>;
}
