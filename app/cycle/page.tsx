import {Copy} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import CycleClient from "./CycleClient";
import "./cycle.css";
export const dynamic="force-dynamic";
export default async function CyclePage(){
 await requireUser();
 return <main className="sub-shell cycle-shell"><header className="sub-top">
  <Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link>
  <nav><Link href="/dashboard"><Copy text={"STARTSEITE"}/></Link><Link href="/settings"><Copy text={"EINSTELLUNGEN"}/></Link></nav></header>
  <CycleClient/>
 </main>;
}
