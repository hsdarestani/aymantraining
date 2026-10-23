import {Copy} from "../../components/Locale";
import {requireRole} from "../../../lib/auth";
import Link from "next/link";
import JourneyBuilder from "./JourneyBuilder";
import "./journeys.css";
export default async function CoachJourneysPage(){
 await requireRole(["COACH","ADMIN"]);
 return <main className="admin-content journey-admin">
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"BE DIFFERENT · ENTWICKLUNGSREISE"}/></span><h1><Copy text={"Trainingswege & Kapitel"}/></h1><p><Copy text={"Ein zusammenhängender Weg für kombinierte Ziele. Neue Versionen werden erst nach Prüfung freigegeben."}/></p></div><Link href="/admin" className="ghost"><Copy text={"← Trainerzentrale"}/></Link></header>
  {process.env.JOURNEY_EDITOR_ENABLED==="true"?<JourneyBuilder/>:
   <article className="panel journey-warning"><h2><Copy text={"Der Wegeditor wird vorbereitet"}/></h2><p><Copy text={"Die neue Datenbank wird vor der Live-Freigabe geprüft. Bestehende Trainingspläne und Kundendaten bleiben unverändert."}/></p></article>}
 </main>;
}
