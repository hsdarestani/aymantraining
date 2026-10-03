import Link from "next/link";

const week=[
  ["MO","28","DONE"],["DI","29","DONE"],["MI","30","RECOVERY"],
  ["DO","01","TODAY"],["FR","02","PLANNED"],["SA","03","REST"],["SO","04","PLANNED"]
];
const exercises=[
  ["01","Incline Dumbbell Press","4 × 8–10","32.5 kg","RPE 8"],
  ["02","Cable Fly","3 × 12","18 kg","RPE 8"],
  ["03","Seated Shoulder Press","4 × 8","27.5 kg","RPE 8"],
  ["04","Lateral Raise","3 × 15","10 kg","RPE 7"],
  ["05","Face Pull","3 × 15","25 kg","RPE 7"]
];

export default function TrainingPage(){
  return <main className="sub-shell">
    <header className="sub-top">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <nav><Link href="/">HOME</Link><Link className="active" href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav>
    </header>

    <section className="page-hero compact-hero">
      <div><span className="eyebrow">TRAINING</span><h1>Dein Plan. Klar. Messbar.</h1><p>Jede Einheit baut auf deinem letzten Training, deinem Ziel und deiner aktuellen Recovery auf.</p></div>
      <div className="hero-stat"><span>PLAN ERFÜLLT</span><strong>4/5</strong><small>DIESE WOCHE</small></div>
    </section>

    <section className="week-strip">
      {week.map(([d,n,s])=><div key={d} className={s==="TODAY"?"day today":"day"}>
        <span>{d}</span><strong>{n}</strong><small>{s}</small>
      </div>)}
    </section>

    <section className="content-grid">
      <article className="panel big-panel">
        <div className="panel-head">
          <div><span className="eyebrow">TODAY · CHEST & SHOULDERS</span><h2>52 Minuten · Ziel RPE 8</h2></div>
          <span className="tag">OFFLINE READY</span>
        </div>
        <div className="exercise-list">
          {exercises.map(([nr,name,sets,last,rpe])=><div className="exercise-row" key={nr}>
            <span className="exercise-nr">{nr}</span>
            <div><strong>{name}</strong><small>Letzter Wert {last}</small></div>
            <span>{sets}</span><span>{rpe}</span><button>START</button>
          </div>)}
        </div>
      </article>

      <aside className="stack">
        <article className="panel callout">
          <span className="signal">COACH NOTE</span>
          <h2>Heute kontrolliert.</h2>
          <p>Kein Satz bis zum absoluten Versagen. Recovery liegt unter deinem 30 Tage Normalwert.</p>
        </article>
        <article className="panel">
          <span className="eyebrow">AFTER WORKOUT</span>
          <h2>RPE Check</h2>
          <p className="muted">Nach jeder Einheit bewertest du die Belastung von 1 bis 10. Das fließt in die Trainingslast ein.</p>
          <div className="rpe-scale">{[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n}>{n}</button>)}</div>
        </article>
      </aside>
    </section>
  </main>;
}
