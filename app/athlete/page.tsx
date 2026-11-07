import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import {getDailyProfile} from "../../lib/daily-profile-service";
import {displayJourneyLevel} from "../../lib/journey-onboarding";
import {Copy, LocalizedValue} from "../components/Locale";
import TwinConsole from "./TwinConsole";

export const dynamic = "force-dynamic";

export default async function AthletePage() {
  const user = await requireUser();
  const [daily, details, digital, badges, connection, wearable] = await Promise.all([
    getDailyProfile(user.id),
    hasFeature(user.subscriptionTier,"score_details"),
    hasFeature(user.subscriptionTier,"digital_twin"),
    prisma.badge.findMany({where:{userId:user.id},orderBy:{unlockedAt:"desc"},take:8}),
    prisma.wearableConnection.findFirst({where:{userId:user.id,status:"CONNECTED"},orderBy:{lastSyncAt:{sort:"desc",nulls:"last"}},select:{provider:true,lastSyncAt:true}}),
    prisma.wearableDaily.findFirst({where:{userId:user.id},orderBy:{date:"desc"},select:{steps:true,restingHr:true,date:true,source:true}}),
  ]);
  const today = new Date(daily.date + "T00:00:00Z");
  const [nutrition, check, photo, scores] = await Promise.all([
    prisma.nutritionDaily.findUnique({where:{userId_date:{userId:user.id,date:today}},select:{proteinG:true}}),
    prisma.dailyCheck.findUnique({where:{userId_date:{userId:user.id,date:today}},select:{proteinG:true}}),
    prisma.mediaAsset.findFirst({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"},select:{id:true}}),
    details || digital ? prisma.scoreSnapshot.findMany({
      where:{userId:user.id,date:{gte:new Date(+today-90*86400000)},completeness:{gt:0}},
      orderBy:{date:"desc"},take:90,
    }) : Promise.resolve([]),
  ]);
  const score = scores[0];
  const oldest = scores.at(-1);
  const days = oldest && score ? (+score.date - +oldest.date) / 86400000 : 0;
  const projection = digital && oldest && score && days > 0
    ? Math.max(0,Math.min(100,Math.round(score.total + (score.total-oldest.total)/days*84)))
    : null;
  const strengths = [
    ["KRAFT",score?.strength],["AUSDAUER",score?.endurance],["ATHLETIK",score?.athleticism],
    ["BEWEGLICHKEIT",score?.mobility],["REGENERATION",score?.recovery],["ERNÄHRUNG",score?.fuel],
    ["BESTÄNDIGKEIT",score?.consistency],
  ] as const;
  const providerNames: Record<string,string> = {APPLE:"Apple Health",HEALTH_CONNECT:"Health Connect",SAMSUNG:"Samsung Health",GARMIN:"Garmin",XIAOMI:"Xiaomi"};

  return <main className="bd-field bd-athlete-profile" data-bd-screen="athlete">
    <header className="bd-athlete-id">
      <div><span className="bd-kicker"><Copy text="ATHLETENPROFIL"/></span><h1>{user.name || <Copy text="Athlet"/>}</h1></div>
      <Link href="/athlete/photos" className="bd-athlete-portrait" aria-label="Athletenfotos">
        {photo ? <img src={"/api/media/"+photo.id} alt=""/> : <span aria-hidden="true">{user.name?.trim().slice(0,1).toUpperCase() || "BD"}</span>}
      </Link>
    </header>
    <TwinConsole sleep={{value:daily.today.sleepHours,unit:"h"}} protein={{value:nutrition?.proteinG??check?.proteinG??null,unit:"g"}}
      energy={{value:daily.today.energy,unit:"/ 10"}} hasCheckIn={daily.today.hasCheckIn}/>
    <div className="bd-athlete-notes">
      <section className="bd-wearable-line">
        <span className="bd-kicker"><Copy text="GERÄTE"/></span>
        <h2>{connection ? providerNames[connection.provider.toUpperCase()] ?? connection.provider : <Copy text="Wearables verbinden"/>}</h2>
        {connection?.lastSyncAt && <p><Copy text="Zuletzt synchronisiert"/> <LocalizedValue value={connection.lastSyncAt}/></p>}
        {wearable && <dl>
          {wearable.steps != null && <div><dt><Copy text="Schritte"/></dt><dd><LocalizedValue value={wearable.steps}/></dd></div>}
          {wearable.restingHr != null && <div><dt><Copy text="Ruhepuls"/></dt><dd>{Math.round(wearable.restingHr)} bpm</dd></div>}
          <div><dt><Copy text={wearable.source==="demo_preview"?"Beispieldaten":"Messstand"}/></dt>
            <dd><LocalizedValue value={wearable.date} format="toLocaleDateString" options={{timeZone:"UTC"}}/></dd></div>
        </dl>}
        <Link className="bd-text-link" href="/wearables"><Copy text="Geräte verwalten"/></Link>
      </section>
      <section className="bd-athlete-bio">
        <span className="bd-kicker"><Copy text="LEISTUNGSPROFIL"/></span>
        <div className="bd-athlete-bio-score"><strong>{daily.profile.value ?? "—"}</strong><span><Copy text="BD SCORE"/></span></div>
        <p><Copy text="BESTÄTIGTE STUFE"/> · {daily.journey.confirmedLevel ? displayJourneyLevel(daily.journey.confirmedLevel) : <Copy text="Einstufung offen"/>}</p>
        {details ? <details className="bd-profile-details"><summary><Copy text="Leistungsbereiche ansehen"/></summary>
          <dl>{strengths.map(([label,value])=><div key={label}><dt><Copy text={label}/></dt><dd>{value??"—"}</dd></div>)}</dl>
          {projection != null && <p><Copy text="Rechnerischer Trend in 12 Wochen"/> {projection} / 100</p>}
        </details> : <Link className="bd-text-link" href="/pricing"><Copy text="Leistungsdetails mit PRO"/></Link>}
      </section>
    </div>
    {badges.length > 0 && <section className="bd-athlete-badges"><h2><Copy text="Deine Abzeichen"/></h2><ul>{badges.map(b => <li key={b.id}>{b.name}</li>)}</ul></section>}
    <footer className="bd-field-links">
      <Link href="/athlete/photos"><Copy text="Athletenfotos"/></Link>
      <Link href="/api/story" target="_blank" rel="noopener"><Copy text="Fortschrittsbild"/></Link>
      <Link href="/community"><Copy text="Gemeinschaft"/></Link>
      <Link href="/coach"><Copy text="Zum Coach"/></Link>
      <Link href="/settings"><Copy text="Einstellungen"/></Link>
    </footer>
  </main>;
}
