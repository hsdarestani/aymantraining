import Link from "next/link";

const rows=[["STRENGTH",86],["ENDURANCE",74],["ATHLETICISM",79],["MOBILITY",72],["RECOVERY",68],["FUEL",76],["CONSISTENCY",91]] as const;

export default function AthletePage(){
  return <main className="sub-shell">
    <header className="sub-top">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link className="active" href="/athlete">ATHLETE</Link></nav>
    </header>

    <section className="page-hero">
      <div><span className="eyebrow">ATHLETE PROFILE</span><h1>Von Training zu Identität.</h1><p>Deine Entwicklung über alle Säulen. Der Digital Twin ist als Phase 2 vorbereitet und nutzt später Verlauf und Zielprognose.</p></div>
      <div className="hero-stat"><span>LEVEL</span><strong>81%</strong><small>BE DIFFERENT</small></div>
    </section>

    <section className="athlete-grid">
      <article className="panel silhouette-panel">
        <span className="tag">PHASE 2 PREVIEW</span>
        <div className="silhouette"><i/><i/><i/></div>
        <h2>ATHLETE DIGITAL TWIN</h2>
        <p className="muted">Tag 1 → Tag 90 → Ziel. Prognosen werden klar als Trend und nicht als Garantie gekennzeichnet.</p>
      </article>
      <article className="panel">
        <span className="eyebrow">YOUR PILLARS</span>
        <h2>Performance Profile</h2>
        <div className="athlete-bars">{rows.map(([name,value])=><div key={name}><span>{name}</span><div className="weight-track"><i style={{width:value+"%"}}/></div><strong>{value}</strong></div>)}</div>
      </article>
    </section>

    <section className="share-card panel">
      <div><span className="eyebrow">SHARE YOUR PROGRESS</span><h2>Story Generator</h2><p className="muted">Score, Rekorde und Fortschritt im 1080 × 1920 Format. Teilen erfolgt nur bewusst durch den Nutzer.</p></div>
      <button className="primary compact">STORY PREVIEW</button>
    </section>
  </main>;
}
