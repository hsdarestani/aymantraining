"use client";
import Link from "next/link";
import {useState} from "react";

const starter=[
  {from:"coach",text:"Guten Morgen. Deine Recovery ist heute niedriger. Wir halten die Einheit kontrolliert."},
  {from:"you",text:"Verstanden. Schulter fühlt sich gut an, Energie ist aber nur 6/10."}
];

export default function CoachPage(){
  const [messages,setMessages]=useState(starter);
  const [value,setValue]=useState("");
  function send(){
    if(!value.trim())return;
    setMessages([...messages,{from:"you",text:value.trim()}]);setValue("");
  }
  return <main className="sub-shell">
    <header className="sub-top">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link className="active" href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav>
    </header>

    <section className="coach-layout">
      <aside className="panel coach-profile">
        <div className="coach-pic large">A</div>
        <span className="eyebrow">YOUR COACH</span>
        <h1>Ayman</h1>
        <span className="online">● ONLINE</span>
        <p>Direkter Draht zu deinem Coach. Antworten, Voice Feedback und Technikvideos an einem Ort.</p>
        <button className="primary">VOICE MESSAGE</button>
        <button className="secondary full">TECHNIKVIDEO HOCHLADEN</button>
      </aside>

      <section className="panel chat-panel">
        <div className="panel-head"><div><span className="eyebrow">COACH CHAT · PRO</span><h2>Heute</h2></div><span className="tag">RESPONSE &lt; 24H</span></div>
        <div className="messages">
          {messages.map((m,i)=><div key={i} className={"message "+m.from}>{m.text}</div>)}
        </div>
        <div className="composer"><input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Nachricht an Ayman..."/><button onClick={send}>SEND</button></div>
      </section>
    </section>

    <article className="panel checkin">
      <div><span className="eyebrow">WEEKLY CHECK IN</span><h2>Sonntag fällig</h2><p className="muted">Gewicht, Fotos, Befinden und Fragen. Der Coach sieht den Verlauf direkt im Kundenprofil.</p></div>
      <button className="secondary">CHECK IN ÖFFNEN</button>
    </article>
  </main>;
}
