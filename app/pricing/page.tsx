import Link from "next/link";

export default function Pricing(){
  return <main className="sub-shell">
    <header className="sub-top"><Link href="/" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow">MEMBERSHIP</span><h1>FREE zeigt was möglich ist. PRO macht es persönlich.</h1><p>PRO verbindet Tracking mit persönlicher Betreuung, laufender Plananpassung und Coach Feedback.</p></div><div className="hero-stat"><span>PRO TEST</span><strong>7</strong><small>TAGE GRATIS</small></div></section>
    <section className="pricing-grid">
      <article className="panel price-card"><span className="eyebrow">FREE</span><h2>Start Different</h2><strong className="price">0 €</strong><p>Tracking, Basis Bibliothek, Templates und Gesamt Score.</p><button className="secondary full">FREE STARTEN</button></article>
      <article className="panel price-card pro"><span className="signal">PRO</span><h2>Build Your Athlete</h2><strong className="price">39,99 €</strong><p>Arbeitswert für den Prototyp. Finale Freigabe bleibt offen.</p><button className="primary">7 TAGE TESTEN</button></article>
    </section>
  </main>;
}
