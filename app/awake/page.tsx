import Link from "next/link";
import {Copy} from "../components/Locale";
import {requireUser} from "../../lib/auth";
export const dynamic="force-dynamic";
const actions=[
 {number:"01",title:"BE FOCUSED",description:"Zwei Minuten Atmung für deinen Start",href:"/focus"},
 {number:"02",title:"BE RESTED",description:"Schlaf und Erholung ansehen",href:"/lifestyle"},
 {number:"03",title:"WOCHENCHECK",description:"Deine Woche und deinen Zustand reflektieren",href:"/checkin"},
 {number:"04",title:"GADGETS",description:"Gesundheitsdaten synchronisieren",href:"/wearables"}
];
export default async function Awake(){
 await requireUser();
 return <main className="sub-shell bd-awake-page">
  <header className="bd-awake-intro"><span className="eyebrow">MORGENROUTINE / 01</span><h1>BE <em>AWAKE.</em></h1><p><Copy text="Dein Tag beginnt mit Bewusstsein. Wähle deinen nächsten Schritt."/></p></header>
  <div className="bd-awake-steps">{actions.map(a=><Link href={a.href} key={a.number} className="bd-awake-step"><span>{a.number}</span><div><strong>{a.title}</strong><small><Copy text={a.description}/></small></div><b>↗</b></Link>)}</div>
  <p className="bd-awake-privacy"><Copy text="Deine Gerätewerte werden nur nach deiner Freigabe gelesen."/></p>
 </main>;
}
