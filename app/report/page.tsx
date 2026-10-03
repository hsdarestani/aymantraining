import Link from "next/link";

const top=["Training 5/5","Strength +4%","Consistency 91"];
const weak=["Schlaf Ø 6:10 h","Recovery 68","Wasserziel 3/7 Tage"];
export default function Report(){
  return <main className="sub-shell"><header className="sub-top"><Link href="/" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/">HOME</Link><Link href="/training">TRAINING</Link><Link href="/progress">PROGRESS</Link><Link href="/coach">COACH</Link><Link href="/athlete">ATHLETE</Link></nav></header>
  <section className="page-hero compact-hero"><div><span className="eyebrow">WEEKLY REPORT</span><h1>Diese Woche +3%.</h1><p>Der Report zeigt, was gut lief, was gebremst hat und was nächste Woche konkret zählt.</p></div><div className="hero-stat"><span>SCORE</span><strong>81</strong><small>+3 VS LAST WEEK</small></div></section>
  <section className="progress-cards"><article className="panel"><span className="eyebrow">TOP 3</span><h2>Was gut lief</h2>{top.map(x=><div className="report-line good" key={x}>{x}</div>)}</article><article className="panel"><span className="eyebrow">FOCUS</span><h2>Was gebremst hat</h2>{weak.map(x=><div className="report-line warn" key={x}>{x}</div>)}</article></section>
  <article className="panel"><span className="eyebrow">NEXT WEEK</span><h2>Dein Fokus</h2><div className="focus-grid"><div><strong>01</strong><span>4 Kraft Einheiten sauber abschließen</span></div><div><strong>02</strong><span>3 Nächte mindestens 7 Stunden Schlaf</span></div><div><strong>03</strong><span>Wasserziel täglich erreichen</span></div></div></article>
  </main>;
}
