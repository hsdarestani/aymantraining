import Link from "next/link";

const exercises=[
  ["BD-LEG-012","Bulgarische Kniebeuge","Kraft","Level 2","FREE"],
  ["BD-STR-004","Incline Dumbbell Press","Kraft","Level 2","FREE"],
  ["BD-MOB-008","90/90 Hip Switch","Mobility","Level 1","FREE"],
  ["BD-ATH-014","Box Jump","Explosivität","Level 2","PRO"]
];

export default function ExercisesAdmin(){
  return <main className="admin-content" style={{margin:"0 auto"}}>
    <header className="admin-header"><div><span className="eyebrow">COACH PANEL</span><h1>Übungsbibliothek</h1></div><Link href="/admin" className="ghost">← Dashboard</Link></header>
    <article className="panel">
      <div className="panel-head"><div><span className="eyebrow">LIBRARY</span><h2>Übungen verwalten</h2></div><button className="primary compact">+ ÜBUNG</button></div>
      <div className="exercise-list">
        {exercises.map(([id,name,cat,level,tier])=><div className="exercise-row" key={id}>
          <span className="exercise-nr">{id.slice(-2)}</span><div><strong>{name}</strong><small>{id} · {cat}</small></div><span>{level}</span><span>{tier}</span><button>EDIT</button>
        </div>)}
      </div>
    </article>
  </main>;
}
