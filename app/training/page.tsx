import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {displayWorkoutTitle} from "../../lib/workout-title";
import {getJourneyOverview} from "../../lib/journey-reader";
import {Copy, LocalizedValue} from "../components/Locale";
import JourneyOverview from "../journey/JourneyOverview";
import "../journey/journey.css";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await requireUser();
  const now = new Date();
  const cutoff = new Date(+now - 12 * 3600000);
  const [upcoming, history, journey] = await Promise.all([
    prisma.workout.findMany({
      where: {userId: user.id, completedAt: null, OR: [{startedAt: {not: null}}, {scheduledAt: null}, {scheduledAt: {gte: cutoff}}]},
      select: {id: true, title: true, startedAt: true, scheduledAt: true, _count: {select: {exercises: true}}},
      orderBy: {scheduledAt: "asc"},
      take: 120,
    }),
    prisma.workout.findMany({
      where: {userId: user.id, completedAt: user.subscriptionTier === "FREE" ? {gte: new Date(+now - 30 * 86400000)} : {not: null}},
      select: {id: true, title: true, completedAt: true, rpe: true},
      orderBy: {completedAt: "desc"},
      take: user.subscriptionTier === "FREE" ? 30 : 100,
    }),
    user.role === "ATHLETE" && process.env.JOURNEY_OVERVIEW_ENABLED === "true" ? getJourneyOverview(user.id) : null,
  ]);
  const next = upcoming.find(w => w.startedAt) ?? upcoming[0];

  return <main className="bd-field bd-training" data-bd-screen="training">
    <header className="bd-training-lead">
      <div><span className="bd-kicker"><Copy text="TRAINING"/></span><h1><Copy text="Der Trainingsweg"/></h1></div>
      {next && <Link href={"/training/" + next.id} className="bd-training-next">
        <span className="bd-kicker"><Copy text={next.startedAt ? "LAUFENDE EINHEIT" : "NÄCHSTE EINHEIT"}/></span>
        <strong><Copy text={displayWorkoutTitle(next.title)}/></strong>
        <span className="bd-text-link"><Copy text={next.startedAt ? "Training fortsetzen" : "Einheit öffnen"}/></span>
      </Link>}
    </header>
    {journey && <section className="bd-training-journey">
      <JourneyOverview initial={journey} embedded/>
      <div className="bd-field-links">
        {journey.legacy.transitionAvailable && <Link href="/journey"><Copy text="Trainingsweg wählen"/></Link>}
        {journey.intake && <Link href="/journey"><Copy text="Dein Einstieg"/></Link>}
        {journey.testsEnabled && !journey.enrollments.length && <Link href="/journey/tests"><Copy text="Tests und Rückmeldungen"/></Link>}
      </div>
    </section>}
    <div className="bd-training-log">
      <section>
        <h2><Copy text="Deine Einheiten"/></h2>
        {upcoming.length ? <ol className="bd-session-list">
          {upcoming.map(w => <li key={w.id}><Link href={"/training/" + w.id}>
            <span className="bd-kicker">{w.startedAt ? <Copy text="GESTARTET"/> : w.scheduledAt
              ? <LocalizedValue value={w.scheduledAt} format="toLocaleDateString" options={{weekday:"short", day:"numeric", month:"numeric"}}/>
              : <Copy text="Ohne Termin"/>}</span>
            <strong><Copy text={displayWorkoutTitle(w.title)}/></strong><span>{w._count.exercises} <Copy text="Übungen"/></span>
          </Link></li>)}
        </ol> : <p><Copy text="Keine Einheit geplant."/></p>}
        <div className="bd-field-links"><Link href="/plans"><Copy text="Trainingspläne"/></Link><Link href="/library"><Copy text="Übungsbibliothek"/></Link></div>
      </section>
      <section>
        <h2><Copy text="Trainingsverlauf"/></h2>
        {user.subscriptionTier === "FREE" && <span className="bd-kicker"><Copy text="Letzte 30 Tage"/></span>}
        {history.length ? <ol className="bd-session-list bd-session-history">
          {history.map(w => <li key={w.id}>
            <time><LocalizedValue value={w.completedAt} format="toLocaleDateString" options={{day:"numeric", month:"numeric"}}/></time>
            <strong><Copy text={displayWorkoutTitle(w.title)}/></strong>
            {w.rpe != null && <span>RPE {w.rpe}</span>}
          </li>)}
        </ol> : <p><Copy text="Hier erscheinen deine abgeschlossenen Einheiten."/></p>}
      </section>
    </div>
  </main>;
}
