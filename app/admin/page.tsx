import Link from "next/link";

const athletes=[
  {name:"Luca M.",score:77,recovery:42,issue:"Recovery sinkt 4 Tage",status:"critical"},
  {name:"Mert K.",score:69,recovery:58,issue:"2 Workouts verpasst",status:"warning"},
  {name:"Sarah L.",score:84,recovery:81,issue:"Check-in heute",status:"good"},
  {name:"Noah B.",score:62,recovery:73,issue:"Videoanalyse offen",status:"neutral"}
];

const weights=[["STRENGTH",20],["ENDURANCE",15],["ATHLETICISM",15],["MOBILITY",10],["RECOVERY",15],["FUEL",10],["CONSISTENCY",15]] as const;

export default function Admin(){
  return <main className="admin-shell">
    <aside className="sidebar">
      <Link href="/" className="brand">BE <span>DIFFERENT</span></Link>
      <div className="coach-mini"><div>A</div><span>COACH<br/><strong>AYMAN</strong></span></div>
      <nav>
        <Link className="active" href="/admin">Attention Queue</Link>
        <a>Kunden</a>
        <Link href="/admin/plans">Trainingspläne</Link>
        <Link href="/admin/exercises">Übungen</Link>
        <a>Tests</a>
        <Link href="/admin/inbox">Inbox</Link>
        <Link href="/admin/rules">Rules &amp; Score</Link>
        <a>Push Campaigns</a>
        <a>Subscriptions</a>
      </nav>
      <Link className="back-link" href="/">← Athlete View</Link>
    </aside>

    <section className="admin-content">
      <header className="admin-header">
        <div><span className="eyebrow">COACH COMMAND CENTER</span><h1>Wer braucht heute Aufmerksamkeit?</h1></div>
        <Link href="/admin/plans" className="primary compact">+ NEUER PLAN</Link>
      </header>

      <div className="kpis">
        <div><span>PRO CLIENTS</span><strong>24</strong><small>3 waiting</small></div>
        <div><span>NEEDS ATTENTION</span><strong>4</strong><small>2 critical</small></div>
        <div><span>CHECK-INS OPEN</span><strong>7</strong><small>this week</small></div>
        <div><span>AVG. SCORE</span><strong>73%</strong><small>+2% vs last week</small></div>
      </div>

      <div className="admin-cols">
        <article className="panel">
          <div className="panel-head"><div><span className="eyebrow">PRIORITY INBOX</span><h2>Attention Queue</h2></div><Link href="/admin/inbox" className="tag">LIVE</Link></div>
          <div className="athlete-table">
            {athletes.map(a=><div className="athlete-row" key={a.name}>
              <i className={"risk "+a.status}/><strong>{a.name}</strong><span>Score {a.score}</span><span>Recovery {a.recovery}</span><small>{a.issue}</small><button>OPEN</button>
            </div>)}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><span className="eyebrow">CONFIGURABLE</span><h2>Score Weights</h2></div><span className="tag">100%</span></div>
          <p className="muted">Die Gewichte bleiben im Backend konfigurierbar und werden nicht fest in die App eingebaut.</p>
          <div className="weights">
            {weights.map(([name,value])=><div className="weight" key={name}>
              <span>{name}</span><div className="weight-track"><i style={{width:value*4+"%"}}/></div><strong>{value}%</strong>
            </div>)}
          </div>
          <Link className="secondary full" href="/admin/rules">REGELN BEARBEITEN</Link>
        </article>
      </div>
    </section>
  </main>;
}
