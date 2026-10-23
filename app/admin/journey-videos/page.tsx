import {Copy} from "../../components/Locale";
import {requireRole} from "../../../lib/auth";
import Link from "next/link";
import VideoQueue from "./VideoQueue";
export default async function Page(){
 await requireRole(["COACH","ADMIN"]);
 return <main className="admin-content" style={{maxWidth:1200,margin:"0 auto",padding:24}}>
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"BE DIFFERENT · TRAINERZENTRALE"}/></span>
  <h1><Copy text={"Technikvideos prüfen"}/></h1><p><Copy text={"Individuelles Feedback mit konkreter Vorbereitung auf die nächste Einheit."}/></p></div>
  <Link href="/admin"><Copy text={"← ZURÜCK"}/></Link></header>
  {process.env.JOURNEY_DAILY_ENABLED==="true"?<VideoQueue/>:<p><Copy text={"Wird vorbereitet."}/></p>}
 </main>
}
