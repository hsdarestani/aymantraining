import Link from "next/link";
import {requireRole} from "../../../lib/auth";
import TechniqueReviewQueue from "./TechniqueReviewQueue";
export const dynamic="force-dynamic";
export default async function TechniqueReviewsPage(){
 await requireRole(["ADMIN","COACH"]);
 return <main className="admin-shell"><section className="admin-content" style={{maxWidth:1000,margin:"auto",padding:25}}>
  <header className="admin-header"><div><span className="eyebrow">PERSÖNLICHES COACHING</span><h1>Technikvideos prüfen</h1><p>Deine Antwort beeinflusst die nächste Einheit erst nach fachlicher Freigabe.</p></div>
   <Link className="secondary" href="/admin">TRAINERZENTRALE</Link></header>
  {process.env.STEP09_ENABLED==="true"?<TechniqueReviewQueue/>:<article className="panel">Coaching wird vorbereitet.</article>}
 </section></main>;
}