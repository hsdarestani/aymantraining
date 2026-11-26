import Link from "next/link";
import {requireRole} from "../../../lib/auth";
import AudioManager from "./AudioManager";
export const dynamic="force-dynamic";
export default async function Page(){
 await requireRole(["ADMIN"]);
 return <main className="admin-content" style={{maxWidth:1200,margin:"0 auto",padding:24}}>
 <header className="admin-header"><div><span className="eyebrow">BE DIFFERENT · AUDIO</span><h1>Audio Management / Sprachbegleitung</h1></div><Link href="/admin">← Dashboard</Link></header>
 <AudioManager/>
 </main>;
}
