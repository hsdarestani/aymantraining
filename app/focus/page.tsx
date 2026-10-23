import Link from "next/link";
import {requireUser} from "../../lib/auth";
import FocusTimer from "./FocusTimer";
import styles from "./focus.module.css";
import {Copy} from "../components/Locale";
export const dynamic="force-dynamic";
export default async function FocusPage(){
 await requireUser();
 return <main className={styles.shell}>
  <header className={styles.top}><Link className="brand" href="/dashboard">BE <span>DIFFERENT</span></Link><Link className={styles.back} href="/dashboard">← <Copy text="ZURÜCK ZUR ÜBERSICHT"/></Link></header>
  <section className={styles.intro}>
   <span className={styles.introEyebrow}><Copy text="BE FOCUSED / RUHE FINDEN"/></span>
   <h1 className={styles.heading}><Copy text="DEIN MOMENT."/><br/><em><Copy text="DEIN FOKUS."/></em></h1>
   <p className={styles.introBody}><Copy text="Zwei Minuten bewusst atmen. Ohne Leistungsdruck. Ein klarer Kopf beginnt mit einem ruhigen Moment."/></p>
  </section>
  <FocusTimer/>
 </main>;
}
