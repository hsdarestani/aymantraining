import Link from "next/link";
import {getStep09Today} from "../../lib/step09-coaching";
export default async function TodayCoachPanel({userId}:{userId:string}){
 const d=await getStep09Today(userId),w=d.nextWorkout;
 const last=d.coach.submissions[0];
 return <section className="panel" style={{margin:"20px 0",padding:"22px",border:"1px solid #5f7557",borderRadius:14}}>
  <div className="panel-head"><div><span className="eyebrow">DEIN HEUTIGER PLAN</span><h2>{d.plan.label}</h2></div>
   <span className="tag">{d.journey?.level?.replaceAll("_"," ")||"TRAINING"}</span></div>
  <p className="muted">{d.plan.explanation}</p>
  {w&&<p><Link href={`/training/${w.id}`} className="primary compact">EINHEIT ANSEHEN → {w.title}</Link></p>}
  <div style={{display:"flex",flexWrap:"wrap",gap:18,marginTop:15}}>
   <div><span className="eyebrow">BEFINDEN</span><p>{d.readiness.hasCheckin?
    `Energie: ${d.readiness.energy??"–"} · Muskelgefühl: ${d.readiness.soreness??"–"}`:"Noch kein Tagescheck"}</p>
    <small className="muted">{d.readiness.note}</small></div>
   <div><span className="eyebrow">PERSÖNLICHER TRAINER</span><p>{d.coach.nextSessionCueDe||"Noch kein persönlicher Hinweis für die nächste Einheit."}</p>
    {d.coach.feedbackDe&&<small className="muted">{d.coach.feedbackDe}</small>}
   </div>
  </div>
  {last&&<p className="muted">Letztes Technikvideo: {last.status==="PENDING"?"Trainerprüfung läuft":"Trainerantwort vorhanden"}</p>}
  <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:18}}>
   <Link className="secondary" href="/checkin">TAGESCHECK</Link>
   {d.coach.canSendVideos&&<Link className="secondary" href="/coach">TECHNIKVIDEO SENDEN</Link>}
   {d.journey&&<Link className="secondary" href="/journey">DEIN WEG</Link>}
  </div>
 </section>;
}