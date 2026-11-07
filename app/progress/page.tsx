import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import {getDailyProfile} from "../../lib/daily-profile-service";
import {Copy, LocalizedValue} from "../components/Locale";
import ProgressClient from "./ProgressClient";
import BeforeAfter from "./BeforeAfter";
import ScoreTrace from "./ScoreTrace";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireUser();
  const milestones = process.env.MILESTONES_ENABLED === "true";
  const [daily, metrics, photos, details, timeline, completed, awards] = await Promise.all([
    getDailyProfile(user.id),
    prisma.bodyMetric.findMany({where:{userId:user.id},orderBy:[{date:"desc"},{createdAt:"desc"}],take:30}),
    prisma.mediaAsset.findMany({
      where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"},take:user.subscriptionTier==="FREE"?3:60,select:{id:true},
    }),
    hasFeature(user.subscriptionTier,"score_details"),
    hasFeature(user.subscriptionTier,"performance_timeline"),
    prisma.workout.count({where:{userId:user.id,completedAt:{not:null}}}),
    milestones ? prisma.milestoneAward.findMany({where:{userId:user.id},orderBy:{achievedAt:"desc"},take:4}) : Promise.resolve([]),
  ]);
  const [scores, tests] = await Promise.all([
    details ? prisma.scoreSnapshot.findMany({
      where:{userId:user.id,completeness:{gt:0}},orderBy:{date:"desc"},take:120,select:{date:true,total:true},
    }) : Promise.resolve([]),
    timeline ? prisma.performanceTest.findMany({where:{userId:user.id},include:{results:true},orderBy:{completedAt:"desc"},take:30}) : Promise.resolve([]),
  ]);
  const profile = daily.profile;
  const measurements = [
    {label:"Gewicht",unit:"kg",entry:metrics.find(m=>m.weightKg!=null),key:"weightKg"},
    {label:"Taille",unit:"cm",entry:metrics.find(m=>m.waistCm!=null),key:"waistCm"},
    {label:"Brust",unit:"cm",entry:metrics.find(m=>m.chestCm!=null),key:"chestCm"},
  ] as const;

  return <main className="bd-field bd-progress-wall" data-bd-screen="progress">
    <section className="bd-performance-board">
      <header>
        <span className="bd-kicker"><Copy text="FORTSCHRITT"/></span>
        <h1><Copy text="Deine Entwicklung"/></h1>
      </header>
      <div className="bd-scoreboard">
        <div className="bd-scoreboard-value">
          <span className="bd-kicker"><Copy text="BD SCORE"/></span>
          <div><strong>{profile.value ?? "—"}</strong>{profile.value != null && <span>/ 100</span>}</div>
          <p><Copy text={profile.value == null ? "Noch kein Messwert" : "Langfristiges Leistungsprofil"}/></p>
          {profile.recordedDate && <span className="bd-kicker"><Copy text="Messstand"/> <LocalizedValue value={new Date(profile.recordedDate+"T00:00:00Z")} format="toLocaleDateString" options={{timeZone:"UTC"}}/></span>}
          {profile.freshness === "OLD" && <span className="bd-kicker"><Copy text="Älterer Messwert"/></span>}
        </div>
        {details && scores.length ? <ScoreTrace points={scores.slice().reverse()} today={new Date(daily.date+"T00:00:00Z")}/> :
          <div className="bd-scoreboard-note">
            <span className="bd-kicker"><Copy text="MESSREIHE"/></span>
            <h2><Copy text={details ? "Dein erster Messpunkt" : "Verlauf mit PRO"}/></h2>
            <p><Copy text={details ? "Sobald ein Messwert vorliegt, beginnt hier dein Verlauf." : "Mit PRO kannst du deine Messwerte im Zeitverlauf vergleichen."}/></p>
            <Link href={details ? "/tests" : "/pricing"} className="bd-text-link"><Copy text={details ? "Zu den Leistungstests" : "PRO ansehen"}/></Link>
          </div>}
      </div>
    </section>
    <section className="bd-evidence-wall">
      <header className="bd-evidence-head"><h2><Copy text="Deine Nachweise"/></h2><span><strong>{completed}</strong> <Copy text="Einheiten abgeschlossen"/></span></header>
      <dl className="bd-measure-strip">
        {measurements.map(({label,unit,entry,key})=><div key={key}>
          <dt><Copy text={label}/></dt>
          <dd>{entry?<><LocalizedValue value={entry[key]} options={{maximumFractionDigits:1}}/> <small>{unit}</small></>:"—"}</dd>
          {entry&&<time><LocalizedValue value={entry.date} format="toLocaleDateString" options={{timeZone:"UTC"}}/></time>}
        </div>)}
      </dl>
      {milestones && <section className="bd-achievement-log">
        <div><h3><Copy text="Meilensteine"/></h3><Link className="bd-text-link" href="/milestones"><Copy text="Alle Meilensteine"/></Link></div>
        {awards.length ? <ol>{awards.map(award => <li key={award.id}>
          <time><LocalizedValue value={award.achievedAt} format="toLocaleDateString" options={{day:"numeric",month:"short",timeZone:daily.timeZone}}/></time><strong><Copy text={award.title}/></strong>
        </li>)}</ol> : <p><Copy text="Deine verdienten Meilensteine erscheinen hier."/></p>}
      </section>}
      <section className="bd-test-ledger">
        <div><h3><Copy text="Leistungstests"/></h3><Link className="bd-text-link" href="/tests"><Copy text="Zu den Leistungstests"/></Link></div>
        {timeline && tests.length ? <ol>{tests.map(test=><li key={test.id}>
          <time><LocalizedValue value={test.completedAt} format="toLocaleDateString" options={{timeZone:daily.timeZone}}/></time>
          <div><strong><Copy text={test.name}/></strong>
            <p>{test.results.map(result=><span key={result.id}><Copy text={result.metric}/> <b><LocalizedValue value={result.value}/> {result.unit}</b></span>)}</p></div>
        </li>)}</ol> : <p><Copy text={timeline ? "Noch kein Leistungstest gespeichert." : "Den vollständigen Testverlauf siehst du mit PRO."}/></p>}
      </section>
      {user.subscriptionTier !== "FREE" && photos.length >= 2 && <BeforeAfter beforeId={photos[photos.length-1].id} afterId={photos[0].id}/>}
      <details className="bd-record-tools">
        <summary><Copy text="Maße oder Fortschrittsfoto hinzufügen"/></summary>
        <ProgressClient/>
      </details>
    </section>
  </main>;
}
