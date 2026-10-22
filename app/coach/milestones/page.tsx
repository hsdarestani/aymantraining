import {requireUser} from "../../../lib/auth";
import Link from "next/link";
import MilestoneCoachClient from "./MilestoneCoachClient";
export const dynamic="force-dynamic";
export default async function CoachMilestones(){
 const coach=await requireUser();
 if(coach.role!=="COACH"&&coach.role!=="ADMIN")return <main className="sub-shell"><h1>Kein Trainerzugriff.</h1></main>;
 return <main className="sub-shell" style={{maxWidth:950}}>
  <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/coach">TRAINER</Link></nav></header>
  <section className="panel" style={{padding:24,marginTop:18}}>
   <span className="eyebrow">TRAINER · MEILENSTEINE</span><h1 style={{fontSize:34,margin:"13px 0"}}>ERFOLGE MIT BEDEUTUNG.</h1>
   <p>Eigene Kriterien und Texte pro Athlet. Erholung kann nur vorab geplant werden. Weder Leistungswert noch bestätigte Stufen werden automatisch geändert.</p>
   <MilestoneCoachClient/>
  </section></main>;
}
