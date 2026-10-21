import Link from "next/link";
import {requireRole} from "../../../lib/auth";
import JourneyReviews from "./JourneyReviews";
import "./review.css";
export const dynamic="force-dynamic";
export default async function JourneyReviewPage(){
 await requireRole(["COACH","ADMIN"]);
 return <main className="admin-shell"><section className="admin-content journey-review-page">
  <header className="admin-header"><div><span className="eyebrow">BE DIFFERENT · TRAINERZENTRALE</span>
   <h1>Aufstiegstests prüfen</h1><p>Jede Prüfung wird individuell bewertet. Nur bestätigte Ergebnisse schalten weitere Kapitel frei.</p></div>
   <Link className="ghost" href="/admin">← Trainerzentrale</Link></header>
  {process.env.JOURNEY_TESTS_ENABLED==="true"?<JourneyReviews/>:
   <article className="panel"><h2>Prüfungen werden vorbereitet</h2><p>Erst nach sicherer Datenbankumstellung freigeben. Bestehende Testlisten bleiben unverändert.</p></article>}
 </section></main>;
}
