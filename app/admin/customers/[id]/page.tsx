import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "../../../../lib/db";
import AssignPlan from "./AssignPlan";

export const dynamic="force-dynamic";

export default async function Customer({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const [u,plans,body,wearables,nutrition,tests,checkins,media,recommendations]=await Promise.all([
  prisma.user.findUnique({where:{id},include:{
   goals:{where:{active:true}},scoreSnapshots:{orderBy:{date:"desc"},take:30},dailyChecks:{orderBy:{date:"desc"},take:30},
   workouts:{orderBy:{scheduledAt:"desc"},take:40},assignments:{where:{active:true},include:{plan:true}},consents:{orderBy:{grantedAt:"desc"}}
  }}),
  prisma.trainingPlan.findMany({where:{active:true},orderBy:{name:"asc"}}),
  prisma.bodyMetric.findMany({where:{userId:id},orderBy:{date:"desc"},take:30}),
  prisma.wearableDaily.findMany({where:{userId:id},orderBy:{date:"desc"},take:30}),
  prisma.nutritionDaily.findMany({where:{userId:id},orderBy:{date:"desc"},take:14}),
  prisma.performanceTest.findMany({where:{userId:id},include:{results:true},orderBy:{createdAt:"desc"},take:30}),
  prisma.weeklyCheckIn.findMany({where:{userId:id},orderBy:{weekStart:"desc"},take:16}),
  prisma.mediaAsset.findMany({where:{relatedUserId:id},orderBy:{createdAt:"desc"},take:80}),
  prisma.recommendation.findMany({where:{userId:id},orderBy:{createdAt:"desc"},take:30})
 ]);
 if(!u)notFound();
 const latest=u.scoreSnapshots[0],latestBody=body[0],latestWearable=wearables[0];
 const photos=media.filter(x=>x.kind==="PROGRESS_PHOTO");
 const videos=media.filter(x=>x.kind==="TECHNIQUE_VIDEO"||x.kind==="TEST_VIDEO");
 return <main className="admin-content" style={{margin:"0 auto"}}>
  <header className="admin-header"><div><span className="eyebrow">ATHLET</span><h1>{u.name||u.email}</h1></div><div className="row-actions"><Link href={`/admin/inbox/${u.id}`} className="primary compact">NACHRICHTEN</Link><Link href="/admin/customers" className="ghost">← KUNDEN</Link></div></header>
  <div className="kpis">
   <div><span>PLAN</span><strong style={{fontSize:18}}>{u.assignments[0]?.plan.name||"Keine Angabe"}</strong><small>aktiv</small></div>
   <div><span>LEISTUNGSWERT</span><strong>{latest?.total??"Keine Angabe"}</strong><small>aktuell</small></div>
   <div><span>REGENERATION</span><strong>{latest?.recovery??"Keine Angabe"}</strong><small>aktuell</small></div>
   <div><span>TRAINING</span><strong>{u.workouts.filter(w=>w.completedAt).length}</strong><small>letzte 40 Einheiten</small></div>
  </div>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow">PROFIL</span><h2>Basis und Ziele</h2><div className="body-stats">
    <div><span>E MAIL</span><strong>{u.email}</strong></div><div><span>GEBURT</span><strong>{u.birthDate?.toLocaleDateString("de-DE")||"Keine Angabe"}</strong></div><div><span>GRÖSSE</span><strong>{u.heightCm?u.heightCm+" cm":"Keine Angabe"}</strong></div><div><span>GEWICHT</span><strong>{latestBody?.weightKg?latestBody.weightKg+" kg":"Keine Angabe"}</strong></div><div><span>ZIELE</span><strong>{u.goals.map(g=>g.type).join(", ")||"Keine Angabe"}</strong></div><div><span>TRAININGSTAGE</span><strong>{u.availabilityPerWeek??"Keine Angabe"}</strong></div>
   </div></article>
   <aside className="stack"><AssignPlan userId={u.id} plans={plans.map(p=>({id:p.id,name:p.name}))}/><article className="panel"><span className="eyebrow">EINWILLIGUNGEN</span><h2>Datenschutz</h2><p className="muted">Gesundheitsdaten: {u.consents.find(c=>c.type==="health_data"&&c.granted)?"erlaubt":"nicht erlaubt"}</p><p className="muted">Fotos und Videos: {u.consents.find(c=>c.type==="media_processing"&&c.granted)?"erlaubt":"nicht erlaubt"}</p></article></aside>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow">LEISTUNGSWERT</span><h2>Verlauf</h2>{u.scoreSnapshots.map(s=><div className="history-row" key={s.id}><strong>{s.total}%</strong><span>{s.date.toLocaleDateString("de-DE")} · Kraft {s.strength??"Keine Angabe"} · Regeneration {s.recovery??"Keine Angabe"} · Daten {s.completeness}%</span></div>)}</article>
   <article className="panel"><span className="eyebrow">TRAINER RADAR</span><h2>Hinweise</h2>{recommendations.length?recommendations.map(x=><div className="history-row" key={x.id}><strong>{x.title}</strong><span>{x.date.toLocaleDateString("de-DE")} · {x.severity.toUpperCase()}</span><small>{x.action}</small></div>):<p className="muted">Keine Hinweise.</p>}</article>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow">WOCHENCHECKS</span><h2>Check ins</h2>{checkins.length?checkins.map(c=><div className="history-row" key={c.id}><strong>{c.weekStart.toLocaleDateString("de-DE")}</strong><span>Gewicht {c.weightKg??"Keine Angabe"} · Energie {c.energy??"Keine Angabe"} · Regeneration {c.recovery??"Keine Angabe"} · Training {c.training??"Keine Angabe"}</span><small>{c.note||c.questions||"Keine Notiz"}</small></div>):<p className="muted">Noch keine Check ins.</p>}</article>
   <article className="panel"><span className="eyebrow">GESUNDHEITSDATEN</span><h2>Letzte Werte</h2><div className="body-stats">
    <div><span>SCHRITTE</span><strong>{latestWearable?.steps?.toLocaleString("de-DE")??"Keine Angabe"}</strong></div><div><span>SCHLAF</span><strong>{latestWearable?.sleepMinutes?Math.round(latestWearable.sleepMinutes/60*10)/10+" h":"Keine Angabe"}</strong></div><div><span>HRV</span><strong>{latestWearable?.hrv??"Keine Angabe"}</strong></div><div><span>RUHEPULS</span><strong>{latestWearable?.restingHr??"Keine Angabe"}</strong></div><div><span>VO2 MAX</span><strong>{latestWearable?.vo2max??"Keine Angabe"}</strong></div><div><span>QUELLE</span><strong>{latestWearable?.source||"Keine Angabe"}</strong></div>
   </div></article>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow">KÖRPERWERTE</span><h2>Maße</h2>{body.length?body.map(x=><div className="history-row" key={x.id}><strong>{x.date.toLocaleDateString("de-DE")}</strong><span>Gewicht {x.weightKg??"Keine Angabe"} kg · Taille {x.waistCm??"Keine Angabe"} cm · Brust {x.chestCm??"Keine Angabe"} cm · Körperfett {x.bodyFat??"Keine Angabe"}</span></div>):<p className="muted">Keine Werte.</p>}</article>
   <article className="panel"><span className="eyebrow">ERNÄHRUNG</span><h2>Letzte Tage</h2>{nutrition.length?nutrition.map(x=><div className="history-row" key={x.id}><strong>{x.date.toLocaleDateString("de-DE")}</strong><span>{x.calories??"Keine Angabe"} kcal · Protein {x.proteinG??"Keine Angabe"} g · Wasser {x.waterMl??"Keine Angabe"} ml · Leistungswert {x.fuelScore??"Keine Angabe"}</span></div>):<p className="muted">Keine Daten.</p>}</article>
  </section>
  <article className="panel"><span className="eyebrow">TRAININGSVERLAUF</span><h2>Einheiten</h2>{u.workouts.map(w=><div className="history-row" key={w.id}><strong>{w.title}</strong><span>{w.scheduledAt?.toLocaleDateString("de-DE")||"Ohne Datum"} · {w.completedAt?"ABGESCHLOSSEN":"OFFEN"} · RPE {w.rpe??"Keine Angabe"}</span></div>)}</article>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow">LEISTUNGSTESTS</span><h2>Tests</h2>{tests.length?tests.map(t=><div className="history-row" key={t.id}><strong>{t.name}</strong><span>{t.completedAt?.toLocaleDateString("de-DE")||"GEPLANT"} · {t.results.map(z=>z.metric+" "+z.value+" "+z.unit).join(" · ")||"Noch keine Ergebnisse"}</span></div>):<p className="muted">Keine Tests.</p>}</article>
   <article className="panel"><span className="eyebrow">FORTSCHRITTSBILDER</span><h2>{photos.length} Bilder</h2><div className="asset-grid">{photos.map(x=><div className="asset" key={x.id}><a href={`/api/media/${x.id}`} target="_blank"><img src={`/api/media/${x.id}`} alt="Fortschrittsbild"/></a><small>{x.createdAt.toLocaleString("de-DE")}</small></div>)}</div></article>
  </section>
  <article className="panel"><span className="eyebrow">TECHNIKVIDEOS</span><h2>{videos.length} Videos</h2>{videos.length?videos.map(x=><div className="history-row" key={x.id}><strong>{x.originalName}</strong><span>{x.createdAt.toLocaleString("de-DE")}</span><a className="secondary" href={`/api/media/${x.id}`} target="_blank">ÖFFNEN</a></div>):<p className="muted">Keine Videos.</p>}</article>
 </main>;
}
