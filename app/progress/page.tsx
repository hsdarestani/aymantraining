import Link from "next/link";

const tests=[
  ["TEST 01","Push-ups","24","START"],
  ["TEST 02","Push-ups","31","+7"],
  ["TEST 03","Push-ups","38","+7"],
  ["TEST 04","Push-ups","42","+4"]
];

export default function ProgressPage(){
  return <main className="sub-shell">
    <header className="sub-top">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link className="active" href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav>
    </header>

    <section className="page-hero compact-hero">
      <div><span className="eyebrow">PROGRESS</span><h1>Leistung wird sichtbar.</h1><p>Vergleiche Tests, Körperdaten und Trends. Langsame Säulen werden über mehrere Wochen bewertet, Tageswerte reagieren schneller.</p></div>
      <div className="hero-stat"><span>90 DAY CHANGE</span><strong>+18%</strong><small>OVERALL</small></div>
    </section>

    <section className="progress-cards">
      <article className="panel chart-panel">
        <div className="panel-head"><div><span className="eyebrow">PERFORMANCE</span><h2>Strength Trend</h2></div><span className="tag">+12%</span></div>
        <div className="fake-chart">
          <i style={{height:"34%"}}/><i style={{height:"43%"}}/><i style={{height:"51%"}}/><i style={{height:"58%"}}/><i style={{height:"66%"}}/><i style={{height:"77%"}}/><i style={{height:"86%"}}/>
        </div>
        <div className="chart-labels"><span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span></div>
      </article>

      <article className="panel">
        <span className="eyebrow">BODY</span><h2>Current</h2>
        <div className="body-stats"><div><span>WEIGHT</span><strong>82.4 kg</strong><small>-1.8 kg</small></div><div><span>WAIST</span><strong>84 cm</strong><small>-3 cm</small></div><div><span>PHOTOS</span><strong>3</strong><small>private</small></div></div>
      </article>
    </section>

    <article className="panel timeline-panel">
      <div className="panel-head"><div><span className="eyebrow">BE DIFFERENT TEST</span><h2>Performance Timeline</h2></div><button className="secondary">TEST STARTEN</button></div>
      <div className="test-timeline">
        {tests.map(([test,name,value,delta])=><div className="test-card" key={test}><span>{test}</span><strong>{value}</strong><small>{name}</small><b>{delta}</b></div>)}
      </div>
    </article>
  </main>;
}
