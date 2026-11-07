import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {displayWorkoutTitle} from "../../lib/workout-title";
import {currentCoach, publishedCoachBrief} from "../../lib/coach-context";
import {getDailyProfile} from "../../lib/daily-profile-service";
import {localDateKey} from "../../lib/daily-profile";
import {displayJourneyLevel, JOURNEY_ONBOARDING_GOALS} from "../../lib/journey-onboarding";
import {getDashboardPreference} from "../../lib/women-dashboard";
import {privateCycle} from "../../lib/cycle-service";
import {Copy, LocalizedValue} from "../components/Locale";
import RhythmHorizon from "../components/RhythmHorizon";
import WomenDashboard from "../components/WomenDashboard";
import CelebrationOverlay from "../components/CelebrationOverlay";
import "../women-dashboard.css";

export const dynamic = "force-dynamic";

const dayMs = 86400000;
const offsetHour = 3600000;
const dayLabels = ["GESTERN", "HEUTE", "MORGEN"];

export default async function Dashboard() {
  const user = await requireUser();
  const [daily, preference, cycle, goals, assignment, brief] = await Promise.all([
    getDailyProfile(user.id),
    getDashboardPreference(user.id),
    privateCycle(user.id, {includeEntries: false}),
    prisma.goal.findMany({where: {userId: user.id, active: true}, select: {type: true}, orderBy: {createdAt: "asc"}, take: 12}),
    currentCoach(user.id),
    publishedCoachBrief(user.subscriptionTier),
  ]);
  const today = new Date(daily.date + "T00:00:00Z");
  const [scheduled, next, ongoing, recommendation] = await Promise.all([
    prisma.workout.findMany({
      where: {userId: user.id, scheduledAt: {gte: new Date(+today - dayMs - 14 * offsetHour), lt: new Date(+today + 2 * dayMs + 14 * offsetHour)}},
      select: {id: true, title: true, scheduledAt: true, completedAt: true},
      orderBy: {scheduledAt: "asc"},
    }),
    prisma.workout.findFirst({
      where: {userId: user.id, completedAt: null, scheduledAt: {gte: new Date()}},
      select: {id: true, title: true, scheduledAt: true, startedAt: true, _count: {select: {exercises: true}}},
      orderBy: {scheduledAt: "asc"},
    }),
    prisma.workout.findFirst({
      where: {userId: user.id, completedAt: null, startedAt: {not: null}},
      select: {id: true, title: true, scheduledAt: true, startedAt: true, _count: {select: {exercises: true}}},
      orderBy: {startedAt: "desc"},
    }),
    prisma.recommendation.findFirst({
      where: {userId: user.id, date: today, sourceRule: {not: "cycle_context"}, coachStatus: "APPROVED"},
      orderBy: {createdAt: "desc"},
      select: {title: true, action: true, sourceRule: true},
    }),
  ]);
  // A session scheduled earlier today is still available, even after its start time.
  const remainingToday = scheduled.find(w => !w.completedAt && w.scheduledAt && localDateKey(w.scheduledAt, daily.timeZone) === daily.date);
  const todayWorkout = remainingToday && remainingToday.id !== next?.id && remainingToday.id !== ongoing?.id
    ? await prisma.workout.findUnique({
      where: {id: remainingToday.id},
      select: {id: true, title: true, scheduledAt: true, startedAt: true, _count: {select: {exercises: true}}},
    })
    : null;
  const workout = ongoing ?? todayWorkout ?? next;
  const coach = assignment?.coach.name;
  const goal = goals[0]?.type;
  const goalLabel = JOURNEY_ONBOARDING_GOALS.find(item => item.slug === goal)?.label ?? goal;
  const journeyEnabled = process.env.JOURNEY_OVERVIEW_ENABLED === "true";
  const dayPlan = process.env.JOURNEY_DAILY_ENABLED === "true" && user.role === "ATHLETE" ? "/journey/today" : "/training";
  const timeline = dayLabels.map((label, index) => {
    const date = new Date(+today + (index - 1) * dayMs);
    return {
      label, date,
      workouts: scheduled
        .filter(w => w.scheduledAt && localDateKey(w.scheduledAt, daily.timeZone) === date.toISOString().slice(0, 10))
        .map(w => ({...w, title:displayWorkoutTitle(w.title), completed: Boolean(w.completedAt)})),
    };
  });

  return <main className="bd-field bd-start" data-bd-screen="start">
    {process.env.CELEBRATIONS_ENABLED === "true" && <CelebrationOverlay/>}
    <section className="bd-cockpit">
      <div className="bd-cockpit-track" aria-hidden="true">
        <svg viewBox="0 0 620 410" fill="none" preserveAspectRatio="xMidYMid slice">
          <path className="track-fill" d="M-50 342h344c138 0 216-72 216-178S432-15 294-15H-50z"/>
          <path d="M-50 388h350c159 0 250-96 250-224S459-60 300-60H-50M-50 364h350c147 0 226-84 226-200S447-36 300-36H-50M-50 340h350c135 0 202-72 202-176S435-12 300-12H-50M-50 316h350c123 0 178-60 178-152S423 12 300 12H-50M-50 292h350c111 0 154-48 154-128S411 36 300 36H-50M-50 268h350c99 0 130-36 130-104S399 60 300 60H-50"/>
          <path className="track-marker" d="M405 260l73 113M489 204l55 20M352 264l10 121"/>
        </svg>
      </div>
      <div className="bd-cockpit-content">
        <div className="bd-cockpit-identity">
          <span className="bd-kicker"><span className="bd-signal"/><Copy text="DEIN TAG"/></span>
          <time dateTime={daily.date}><LocalizedValue value={today} format="toLocaleDateString" options={{weekday:"short", day:"numeric", month:"short", timeZone:"UTC"}}/></time>
        </div>
        <p className="bd-cockpit-name">{user.name || <Copy text="Athlet"/>}</p>
        <span className="bd-kicker bd-cockpit-next"><Copy text={workout ? (workout.startedAt ? "LAUFENDE EINHEIT" : "NÄCHSTE EINHEIT") : "DEIN NÄCHSTER SCHRITT"}/></span>
        <h1><Copy text={workout ? displayWorkoutTitle(workout.title) : (daily.plan.status === "DONE" ? "Training erledigt." : "Plane dein Training.")}/></h1>
        {workout && <p className="bd-cockpit-meta">
          {workout.scheduledAt && <LocalizedValue value={workout.scheduledAt} options={{weekday:"short", hour:"2-digit", minute:"2-digit", timeZone:daily.timeZone}}/>}
          {workout.scheduledAt && " · "}{workout._count.exercises} <Copy text="Übungen"/>
        </p>}
        <Link className="bd-action" href={workout ? "/training/" + workout.id : dayPlan}>
          <Copy text={workout ? (workout.startedAt ? "Training fortsetzen" : "Einheit öffnen") : "Zum Trainingsplan"}/>
          <span className="bd-action-mark" aria-hidden="true"/>
        </Link>
      </div>
      <dl className="bd-cockpit-rail">
        <div><dt><Copy text="ZIEL"/></dt><dd><Copy text={goalLabel ?? "Offen"}/></dd></div>
        <div><dt><Copy text="BESTÄTIGTE STUFE"/></dt><dd>{daily.journey.confirmedLevel ? displayJourneyLevel(daily.journey.confirmedLevel) : <Copy text="Einstufung offen"/>}</dd></div>
        <div><dt><Copy text="BD SCORE"/></dt><dd><Link href="/progress">{daily.profile.value ?? "—"}</Link></dd></div>
      </dl>
    </section>

    <div className="bd-start-below">
      <RhythmHorizon days={timeline} timeZone={daily.timeZone}/>
      <aside className="bd-coach-signal">
        <span className="bd-kicker"><span className="bd-signal"/><Copy text="COACH"/></span>
        <h2>{coach || brief?.coach.name || <Copy text="Deine Betreuung"/>}</h2>
        {recommendation && <><span className="bd-kicker"><Copy text="HEUTE WICHTIG"/></span><strong><Copy text={recommendation.title}/></strong><p><Copy text={recommendation.action}/></p></>}
        {!recommendation && brief && <><strong><Copy text={brief.title}/></strong>{brief.body && <p className="bd-brief-excerpt"><Copy text={brief.body}/></p>}</>}
        {!recommendation && !brief && <p><Copy text="Halte fest, wie du dich fühlst. Dein Tagescheck hilft bei der nächsten Einheit."/></p>}
        <div className="bd-signal-actions">
          <Link className="bd-text-link" href="/coach"><Copy text="Zum Coach"/></Link>
          <Link className="bd-text-link" href={daily.today.hasCheckIn ? dayPlan : "/lifestyle"}><Copy text={daily.today.hasCheckIn ? "Tagesplan" : "Tagescheck"}/></Link>
        </div>
      </aside>
    </div>

    <WomenDashboard preference={preference} journeyEnabled={journeyEnabled} confirmedLevel={daily.journey.confirmedLevel}
      completed={daily.plan.completed} scheduled={daily.plan.scheduled} energy={daily.today.energy} sleepHours={daily.today.sleepHours}
      goals={goals.map(g => g.type)}/>
    <footer className="bd-field-links">
      <Link href="/athlete"><Copy text="Digital Twin"/></Link>
      <Link href="/focus"><Copy text="BE FOCUSED"/></Link>
      <Link href="/community"><Copy text="Gemeinschaft"/></Link>
      {process.env.MILESTONES_ENABLED === "true" && <Link href="/milestones"><Copy text="Meilensteine"/></Link>}
      {cycle.enabled && <Link href="/cycle"><Copy text="Privater Zykluskalender"/></Link>}
    </footer>
  </main>;
}
