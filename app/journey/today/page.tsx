import {Copy} from "../../components/Locale";
import Link from "next/link";
import {requireUser} from "../../../lib/auth";
import TodayClient from "./TodayClient";
export const dynamic="force-dynamic";
export default async function TodayPage(){
 const user=await requireUser();
 return <main className="sub-shell"><header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text={"STARTSEITE"}/></Link><Link href="/journey"><Copy text={"DEIN WEG"}/></Link><Link className="active" href="/journey/today"><Copy text={"HEUTE"}/></Link></nav></header>
 <section style={{maxWidth:1050,margin:"0 auto",padding:"24px 16px 100px"}}>
 <span className="eyebrow"><Copy text={"DEINE PERSÖNLICHE TRAININGSREISE"}/></span><h1><Copy text={"Heute zählt, was wirklich ansteht."}/></h1>
 {user.role!=="ATHLETE"?<p><Copy text={"Diese Ansicht ist für Athleten vorgesehen."}/></p>:
 process.env.JOURNEY_DAILY_ENABLED==="true"?<TodayClient/>:
 <article className="panel"><h2><Copy text={"Dein täglicher Trainingsweg wird vorbereitet."}/></h2><p><Copy text={"Deine bisherigen Trainingsdaten bleiben bestehen."}/></p></article>}
 </section></main>
}