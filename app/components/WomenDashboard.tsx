import Link from "next/link";
import type {DashboardPreference} from "../../lib/women-dashboard";

type Props={preference:DashboardPreference;confirmedLevel:string|null;
 completed:number;scheduled:number;energy:number|null;sleepHours:number|null;goals:string[]};
const goalLabels:Record<string,string>={
 muscle_building:"Muskelaufbau",fat_loss:"Fettabbau",athleticism:"Athletik",
 football:"Fußball",calisthenics:"Calisthenics",health:"Gesundheit"
};
export default function WomenDashboard({preference,confirmedLevel,completed,scheduled,energy,sleepHours,goals}:Props){
 if(!preference.enabled||preference.mode!=="WOMEN")return null;
 const training=scheduled===0?"Keine Einheit eingetragen":
  completed===scheduled?"Alle geplanten Einheiten erledigt":completed+" von "+scheduled+" Einheiten geschafft";
 return <section className="bd-women-home" aria-label="Persönliche Trainingsansicht">
  <div className="bd-women-heading">
   <span>DEINE ANSICHT · DEINE ENTSCHEIDUNG</span>
   <h2>STARK IN DEINEM TEMPO.</h2>
   <p>Deine Trainingsziele und deine echten Messwerte bleiben im Mittelpunkt. Alle Sportarten stehen dir offen.</p>
   <Link href="/settings">ANSICHT ANPASSEN →</Link>
  </div>
  <div className="bd-women-tiles">
   <article><small>HEUTE</small><strong>{training}</strong><Link href="/training">TRAININGSPLAN ANSEHEN →</Link></article>
   <article><small>DEINE TAGESFORM</small><strong>Energie: {energy??"Keine Angabe"}</strong>
     <p>Schlaf: {sleepHours==null?"Keine Angabe":sleepHours+" h"}</p><Link href="/lifestyle">TAGESCHECK ÖFFNEN →</Link></article>
   <article><small>DEIN BESTÄTIGTER STAND</small><strong>{confirmedLevel?.replaceAll("_"," ")??"Noch keine Einstufung"}</strong>
    <Link href="/journey">TRAININGSWEG ANSEHEN →</Link></article>
  </div>
  {goals.length>0&&<div className="bd-women-goals"><small>DEINE ZIELE</small><p>{goals.map(g=>goalLabels[g]??g).join(" · ")}</p></div>}
  <p className="bd-women-foot">Aufnahmen mit Trainerinnen werden bevorzugt angezeigt, sofern freigegebenes Material verfügbar ist. Keine Übungen werden aufgrund dieser Ansicht gesperrt.</p>
 </section>;
}
