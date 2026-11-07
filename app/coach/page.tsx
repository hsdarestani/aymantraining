import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import {currentCoach, publishedCoachBrief} from "../../lib/coach-context";
import {Copy, LocalizedValue} from "../components/Locale";
import CoachClient from "./CoachClient";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const user = await requireUser();
  const [allowed, assignment, brief, review] = await Promise.all([
    hasFeature(user.subscriptionTier, "coach_chat"),
    currentCoach(user.id),
    publishedCoachBrief(user.subscriptionTier),
    prisma.videoFeedback.findFirst({
      where:{athleteId:user.id,status:"REVIEWED",reviewedAt:{not:null}},
      orderBy:{reviewedAt:"desc"},select:{reviewedAt:true,annotations:true},
    }),
  ]);
  const canWrite = user.role === "ATHLETE";
  const [recent, consent] = await Promise.all([
    allowed ? prisma.message.findMany({
      where:{athleteId:user.id},orderBy:[{createdAt:"desc"},{id:"desc"}],take:41,
    }) : Promise.resolve([]),
    allowed && canWrite ? prisma.consentRecord.findFirst({
      where:{userId:user.id,type:"media_processing"},orderBy:[{grantedAt:"desc"},{id:"desc"}],select:{granted:true},
    }) : Promise.resolve(null),
  ]);
  const messages = recent.slice(0,40).reverse();
  const feedback = review?.annotations as {coachNote?:string;nextSession?:{focus?:string;advice?:string}} | null;
  const hasFeedback = Boolean(feedback?.coachNote || feedback?.nextSession?.focus || feedback?.nextSession?.advice);
  const canSeeDay = canWrite && process.env.JOURNEY_DAILY_ENABLED === "true";
  const coachName = assignment?.coach.name;

  return <main className="bd-field bd-coaching" data-bd-screen="coach">
    <header className="bd-coach-intro">
      <span className="bd-kicker"><span className="bd-signal"/><Copy text="COACH"/></span>
      <h1>{coachName || <Copy text="Dein Coach"/>}</h1>
      <div className="bd-coach-intro-links">
        {allowed && canWrite && <a href="#coach-dialogue" className="bd-text-link"><Copy text="Zum Gespräch"/></a>}
        <Link href="/checkin" className="bd-text-link"><Copy text="Wochencheck öffnen"/></Link>
      </div>
    </header>
    <div className="bd-coach-columns">
      <section className="bd-coach-letter">
        {hasFeedback ? <>
          <div className="bd-letter-kicker"><span className="bd-kicker"><Copy text="TECHNIKFEEDBACK"/></span>
            {review?.reviewedAt && <time><LocalizedValue value={review.reviewedAt} format="toLocaleDateString"/></time>}</div>
          <h2><Copy text="Für deine nächste Einheit"/></h2>
          {feedback?.coachNote && <blockquote>{feedback.coachNote}</blockquote>}
          {feedback?.nextSession?.focus && <strong>{feedback.nextSession.focus}</strong>}
          {feedback?.nextSession?.advice && <p>{feedback.nextSession.advice}</p>}
          {canSeeDay && <Link href="/journey/today" className="bd-text-link"><Copy text="Tagesplan ansehen"/></Link>}
        </> : brief ? <>
          <div className="bd-letter-kicker"><span className="bd-kicker"><Copy text="VOM COACH"/></span>
            <time><LocalizedValue value={brief.publishAt} format="toLocaleDateString"/></time></div>
          <h2><Copy text={brief.title}/></h2>
          {brief.body && <p><Copy text={brief.body}/></p>}
          {brief.mediaId && <audio controls preload="none" src={"/api/media/"+brief.mediaId} aria-label="Sprachnachricht"/>}
          {brief.coach.name && <span className="bd-coach-signature">{brief.coach.name}</span>}
        </> : <>
          <span className="bd-kicker"><Copy text="DEIN WOCHENCHECK"/></span>
          <h2><Copy text="Wie läuft dein Training?"/></h2>
          <p><Copy text="Halte fest, was gut lief und was du beim nächsten Mal ändern möchtest."/></p>
          <Link href="/checkin" className="bd-text-link"><Copy text="Wochencheck starten"/></Link>
        </>}
      </section>
      <aside className="bd-coach-side">
        <span className="bd-kicker"><Copy text="VORBEREITUNG"/></span>
        <h2><Copy text="Vor der nächsten Einheit"/></h2>
        <p><Copy text="Bring eine konkrete Frage oder ein kurzes Technikvideo mit."/></p>
        <Link className="bd-text-link" href={canSeeDay ? "/journey/today" : "/training"}><Copy text="Deinen Plan ansehen"/></Link>
        {hasFeedback && brief && <details><summary><Copy text="Aktuelle Mitteilung vom Coach"/></summary>
          <strong><Copy text={brief.title}/></strong>{brief.body && <p><Copy text={brief.body}/></p>}
          {brief.mediaId && <audio controls preload="none" src={"/api/media/"+brief.mediaId} aria-label="Sprachnachricht"/>}
        </details>}
      </aside>
    </div>
    {allowed ? <CoachClient userId={user.id} initial={messages} initialCursor={recent.length > 40 ? messages[0].id : null} canWrite={canWrite} initialVideoConsent={consent?.granted??false}/> :
      <section className="bd-coach-locked" id="coach-dialogue">
        <div><span className="bd-kicker">PRO</span><h2><Copy text="Persönlicher Austausch"/></h2><p><Copy text="Schick deinem Coach eine Frage, eine Sprachnachricht oder ein Technikvideo."/></p></div>
        <Link href="/pricing" className="bd-action"><Copy text="PRO ansehen"/><span className="bd-action-mark" aria-hidden="true"/></Link>
      </section>}
    {!canWrite && process.env.MILESTONES_ENABLED==="true" && <footer className="bd-field-links">
      <Link href="/coach/milestones"><Copy text="Meilensteine für Athleten planen"/></Link>
    </footer>}
  </main>;
}
