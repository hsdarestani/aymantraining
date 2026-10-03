import Link from "next/link";

const items=[
  ["Luca M.","Technikvideo","Kniebeuge · 0:18","HIGH"],
  ["Sarah L.","Weekly Check in","Gewicht + Foto","NORMAL"],
  ["Mert K.","Chat","Schulter fühlt sich müde an","HIGH"],
  ["Noah B.","Voice","0:32 min","NORMAL"]
];

export default function InboxAdmin(){
  return <main className="admin-content" style={{margin:"0 auto"}}>
    <header className="admin-header">
      <div><span className="eyebrow">COACH PANEL</span><h1>Inbox</h1></div>
      <Link href="/admin" className="ghost">← Dashboard</Link>
    </header>
    <article className="panel">
      <div className="panel-head">
        <div><span className="eyebrow">PRIORISIERT</span><h2>Nachrichten & Feedback</h2></div>
        <span className="tag">4 OPEN</span>
      </div>
      <div className="athlete-table">
        {items.map(([name,type,detail,priority])=><div className="athlete-row" key={name+type}>
          <i className={priority==="HIGH"?"risk warning":"risk good"}/>
          <strong>{name}</strong><span>{type}</span><span>{priority}</span><small>{detail}</small><button>OPEN</button>
        </div>)}
      </div>
    </article>
  </main>;
}
