import Link from "next/link";
import {requireRole} from "../../../lib/auth";
import AudioManager from "./AudioManager";
export const dynamic="force-dynamic";
export default async function Page(){
 await requireRole(["ADMIN"]);
 return <main className="admin-content" style={{maxWidth:1200,margin:"0 auto",padding:"clamp(88px, 12vw, 120px) 24px 24px"}}>
 <header className="admin-header"><div><span className="eyebrow">BE DIFFERENT · AUDIO</span><h1>Sprachbegleitung</h1></div><Link href="/admin">Dashboard</Link></header>
 <AudioManager/>
 </main>;
}
