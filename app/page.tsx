import Link from "next/link";

const pillars = [
  ["STRENGTH",86,"+4"],["ENDURANCE",74,"+2"],["ATHLETICISM",79,"+5"],
  ["MOBILITY",72,"+1"],["RECOVERY",68,"-6"],["CONSISTENCY",91,"+3"]
] as const;

function ScoreRing(){
  return <div className="score-ring">
    <div className="score-inner">
      <span className="eyebrow">BE DIFFERENT SCORE</span>
      <strong>81%</strong>
      <span className="level">BE DIFFERENT</span>
    </div>
  </div>;
}

function Radar(){
  return <svg className="radar" viewBox="0 0 220 200" aria-label="Coach Radar">
    <g className="radar-grid">
      <polygon points="110,18 191,65 191,135 110,182 29,135 29,65"/>
      <polygon points="110,42 170,77 170,123 110,158 50,123 50,77"/>
      <polygon points="110,66 149,88 149,112 110,134 71,112 71,88"/>
      <line x1="110" y1="18" x2="110" y2="182"/>
      <line x1="29" y1="65" x2="191" y2="135"/>
      <line x1="191" y1="65" x2="29" y2="135"/>
    </g>
    <polygon className="radar-value" points="110,31 175,75 164,124 110,144 47,127 55,77"/>
  </svg>;
}

export default function Home(){
  return <main className="shell">
    <header className="topbar">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <div className="top-actions">
        <Link href="/onboarding" className="ghost">Onboarding</Link>
        <Link href="/admin" className="ghost">Coach Panel</Link>
        <div className="avatar">AY</div>
      </div>
    </header>

    <section className="hero">
      <div>
        <span className="eyebrow">GOOD MORNING, AYMAN</span>
        <h1>BUILD YOUR<br/><em>ATHLETE.</em></h1>
        <p>Deine Daten werden zu einer klaren Entscheidung für heute. Training, Recovery, Schlaf und Leistung in einem System.</p>
        <div className="live"><i/> COACH ONLINE · LAST SYNC 07:42</div>
      </div>
      <ScoreRing/>
    </section>

    <section className="grid">
      <article className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">COACH RADAR</span><h2>Heute intelligent trainieren.</h2></div>
          <span className="tag amber">RECOVERY 68</span>
        </div>
        <div className="radar-wrap">
          <Radar/>
          <div>
            <span className="signal">TODAY'S CALL</span>
            <h3>Kein Maximaltraining.</h3>
            <p>Deine Leistung steigt, aber die Recovery fällt. Heute Fokus auf Mobility und leichtes Conditioning.</p>
            <Link href="/training" className="secondary">PLAN ANSEHEN</Link>
          </div>
        </div>
      </article>

      <article className="panel workout">
        <div className="panel-head">
          <div><span className="eyebrow">TODAY'S WORKOUT</span><h2>Chest &amp; Shoulders</h2></div>
          <span className="tag">52 MIN</span>
        </div>
        <div className="workout-visual">
          <span className="number">01</span>
          <div><span className="signal">NEXT EXERCISE</span><h3>Incline Dumbbell Press</h3><p>4 Sätze · 8–10 Wdh. · RPE 8</p></div>
        </div>
        <Link href="/training" className="primary">START WORKOUT <b>→</b></Link>
      </article>

      <article className="panel">
        <div className="panel-head"><div><span className="eyebrow">TODAY</span><h2>Daily Signals</h2></div></div>
        <div className="metrics">
          <div><span>SLEEP</span><strong>6:12</strong><small>−48 min vs Ziel</small></div>
          <div><span>STEPS</span><strong>6.240</strong><small>62% von 10.000</small></div>
          <div><span>WATER</span><strong>1.4L</strong><small>1.6L fehlen</small></div>
          <div><span>PROTEIN</span><strong>92g</strong><small>58g fehlen</small></div>
        </div>
      </article>

      <article className="panel coach">
        <div className="coach-head"><div className="coach-pic">A</div><div><span className="eyebrow">YOUR COACH</span><h2>Ayman</h2></div><span className="online">ONLINE</span></div>
        <blockquote>“Recovery is training too. Heute reduzieren wir das Volumen und gewinnen morgen Leistung.”</blockquote>
        <div className="coach-actions"><Link href="/coach" className="secondary">VOICE MESSAGE</Link><Link href="/coach" className="secondary">CHECK IN</Link></div>
      </article>
    </section>

    <section className="pillars">
      <div className="section-head"><div><span className="eyebrow">YOUR ATHLETE</span><h2>Du trainierst nicht. Du entwickelst dich.</h2></div><Link href="/progress" className="week">THIS WEEK +3%</Link></div>
      <div className="pillar-grid">
        {pillars.map(([name,value,delta])=><div className="pillar" key={name}>
          <div><span>{name}</span><strong>{value}</strong></div>
          <div className="bar"><i style={{width:value+"%"}}/></div>
          <small className={delta.startsWith("-")?"bad":""}>{delta}% this cycle</small>
        </div>)}
      </div>
    </section>

    <nav className="mobile-nav">
      <Link className="active" href="/">HOME</Link>
      <Link href="/training">TRAINING</Link>
      <Link href="/progress">PROGRESS</Link>
      <Link href="/coach">COACH</Link>
      <Link href="/athlete">ATHLETE</Link>
    </nav>
  </main>;
}
