import Link from "next/link";
import {Copy} from "./Locale";
import type {DashboardPreference} from "../../lib/women-dashboard";

type Props={preference:DashboardPreference;journeyEnabled:boolean;confirmedLevel:string|null;
 completed:number;scheduled:number;energy:number|null;sleepHours:number|null;goals:string[]};
const goalLabels:Record<string,string>={
 muscle_building:"Muskelaufbau",fat_loss:"Fettabbau",athleticism:"Athletik",
 football:"Fußball",calisthenics:"Calisthenics",health:"Gesundheit"
};
export default function WomenDashboard({preference,journeyEnabled,confirmedLevel,completed,scheduled,energy,sleepHours,goals}:Props){
 if(!preference.enabled||preference.mode!=="WOMEN")return null;
 const training=scheduled===0?"Keine Einheit eingetragen":
  completed===scheduled?"Alle geplanten Einheiten erledigt":completed+" von "+scheduled+" Einheiten geschafft";
 return <section className="bd-women-home" aria-label="Persönliche Trainingsansicht">
  <div className="bd-women-heading">
   <span><Copy text="DEINE ANSICHT · DEINE ENTSCHEIDUNG"/></span>
   <h2><Copy text="STARK IN DEINEM TEMPO."/></h2>
   <p><Copy text="Deine Trainingsziele und deine echten Messwerte bleiben im Mittelpunkt. Alle Sportarten stehen dir offen."/></p>
   <Link href="/settings"><Copy text="ANSICHT ANPASSEN →"/></Link>
  </div>
  <div className="bd-women-tiles">
   <article><small><Copy text="HEUTE"/></small><strong>{training}</strong><Link href="/training"><Copy text="TRAININGSPLAN ANSEHEN →"/></Link></article>
   <article><small><Copy text="DEINE TAGESFORM"/></small><strong>Energie: {energy??"Keine Angabe"}</strong>
     <p>Schlaf: {sleepHours==null?"Keine Angabe":sleepHours+" h"}</p><Link href="/lifestyle"><Copy text="TAGESCHECK ÖFFNEN →"/></Link></article>
   <article><small><Copy text="DEIN BESTÄTIGTER STAND"/></small><strong>{confirmedLevel?.replaceAll("_"," ")??"Noch keine Einstufung"}</strong>
    <Link href={journeyEnabled?"/journey":"/training"}><Copy text={journeyEnabled?"TRAININGSWEG ANSEHEN →":"TRAININGSPLAN ANSEHEN →"}/></Link></article>
  </div>
  {goals.length>0&&<div className="bd-women-goals"><small><Copy text="DEINE ZIELE"/></small><p>{goals.map(g=>goalLabels[g]??g).join(" · ")}</p></div>}
  <p className="bd-women-foot"><Copy text={preference.presenterPreference==="TRAINERIN"
  ?"Aufnahmen mit Trainerinnen werden bevorzugt angezeigt, sofern freigegebenes Material verfügbar ist. Keine Übungen werden aufgrund dieser Ansicht gesperrt."
  :"In den Einstellungen kannst du Aufnahmen mit Trainerinnen bevorzugen, sofern verfügbar. Keine Übung wird dadurch gesperrt."}/></p>
 </section>;
}
