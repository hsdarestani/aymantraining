import Link from "next/link";
import {requireUser} from "../../lib/auth";
import FocusTimer from "./FocusTimer";
import styles from "./focus.module.css";
export const dynamic="force-dynamic";
export default async function FocusPage(){
 await requireUser();
 return <main className={styles.shell}>
  <header className={styles.top}><Link className="brand" href="/dashboard">BE <span>DIFFERENT</span></Link><Link className={styles.back} href="/dashboard">← ZURÜCK ZUM START</Link></header>
  <section className={styles.intro}>
   <span className={styles.introEyebrow}>BE FOCUSED / RESET YOUR MIND</span>
   <h1 className={styles.heading}>DEIN MOMENT.<br/><em>DEIN FOKUS.</em></h1>
   <p className={styles.introBody}>Zwei Minuten bewusst atmen. Ohne Leistungsdruck. Ein klarer Kopf beginnt mit einem ruhigen Moment.</p>
  </section>
  <FocusTimer/>
 </main>;
}
