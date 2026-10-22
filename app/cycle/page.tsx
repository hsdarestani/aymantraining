import Link from "next/link";
import {requireUser} from "../../lib/auth";
import CycleClient from "./CycleClient";
import "./cycle.css";
export const dynamic="force-dynamic";
export default async function CyclePage(){
 await requireUser();
 return <main className="sub-shell cycle-shell"><header className="sub-top">
  <Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link>
  <nav><Link href="/dashboard">STARTSEITE</Link><Link href="/settings">EINSTELLUNGEN</Link></nav></header>
  <CycleClient/>
 </main>;
}
