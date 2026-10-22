import Link from "next/link";
import {requireUser} from "../../lib/auth";
import JourneyOverview from "./JourneyOverview";
import "./journey.css";
export const dynamic="force-dynamic";
export default async function JourneyHomePage(){
 const user=await requireUser();
 return <main className="sub-shell j7-page">
  <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard">STARTSEITE</Link><Link href="/training">TRAINING</Link><Link className="active" href="/journey">DEIN WEG</Link></nav></header>
  <section className="j7-container"><span className="eyebrow">DEINE ENTWICKLUNGSREISE</span><h1>Dein Weg. Dein Fortschritt.</h1><p>Fünf Leistungsstufen. Entdecke deinen nächsten Schritt.</p>
   {user.role!=="ATHLETE"?<article className="panel">Dieser Bereich ist für Athleten vorgesehen.</article>:
    process.env.JOURNEY_OVERVIEW_ENABLED==="true"?<JourneyOverview/>:<article className="panel"><h2>Trainingsweg in Vorbereitung</h2><p>Deine bisherigen Trainingspläne und Leistungen bleiben unverändert.</p></article>}
  </section>
 </main>;
}
