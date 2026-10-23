import {Copy} from "../../components/Locale";
import Link from "next/link";
import {requireUser} from "../../../lib/auth";
import AthleteTests from "./AthleteTests";
import "./tests.css";
export const dynamic="force-dynamic";
export default async function TestsPage(){
 const user=await requireUser();
 return <main className="sub-shell journey-tests">
  <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link>
   <nav><Link href="/dashboard"><Copy text={"STARTSEITE"}/></Link><Link href="/training"><Copy text={"TRAINING"}/></Link><Link className="active" href="/journey/tests"><Copy text={"DEIN WEG"}/></Link></nav>
  </header>
  <section className="journey-tests-content">
   <span className="eyebrow"><Copy text={"DEINE ENTWICKLUNGSREISE"}/></span><h1><Copy text={"Dein nächster Schritt."}/></h1>
   <p><Copy text={"Hier siehst du deine bestätigten Kapitel, Abschlusstests und die Rückmeldung deines Trainers."}/></p>
   {user.role!=="ATHLETE"?<article className="panel"><Copy text={"Diese Ansicht ist für Athleten vorgesehen."}/></article>:
    process.env.JOURNEY_TESTS_ENABLED==="true"?<AthleteTests/>:
    <article className="panel"><h2><Copy text={"Trainingsweg in Vorbereitung"}/></h2><p><Copy text={"Deine bisherige Trainingsansicht bleibt unverändert. Die neuen Kapitel werden erst nach Freigabe angezeigt."}/></p></article>}
  </section>
 </main>;
}
