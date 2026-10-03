import Link from "next/link";

const plans=[
  ["ATHLETE BASE 01","4 Tage","12 Kunden","ACTIVE"],
  ["FOOTBALL SPEED","3 Tage","7 Kunden","ACTIVE"],
  ["CALISTHENICS START","3 Tage","9 Kunden","TEMPLATE"],
  ["RECOVERY WEEK","5 Einheiten","4 Kunden","TEMPLATE"]
];

export default function PlansAdmin(){
  return <main className="admin-content" style={{margin:"0 auto"}}>
    <header className="admin-header"><div><span className="eyebrow">COACH PANEL</span><h1>Trainingspläne</h1></div><Link href="/admin" className="ghost">← Dashboard</Link></header>
    <section className="admin-cols">
      <article className="panel">
        <div className="panel-head"><div><span className="eyebrow">PLAN BUILDER</span><h2>Vorlagen & aktive Pläne</h2></div><button className="primary compact">+ PLAN</button></div>
        <div className="athlete-table">
          {plans.map(([name,days,clients,status])=><div className="athlete-row" key={name}>
            <i className="risk good"/><strong>{name}</strong><span>{days}</span><span>{clients}</span><small>{status}</small><button>OPEN</button>
          </div>)}
        </div>
      </article>
      <article className="panel">
        <span className="eyebrow">PROGRESSION</span><h2>Planlogik</h2><p className="muted">Progressionsregeln, Deloads und Vorlagen werden coachseitig gepflegt. Automatische Vorschläge ändern den Plan nicht ohne Coach Freigabe.</p>
        <button className="secondary full">REGELN ÖFFNEN</button>
      </article>
    </section>
  </main>;
}
