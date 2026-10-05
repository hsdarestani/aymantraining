
import {LocalizedValue} from "../../../components/Locale";

import {Copy,LocalizedElement} from "../../../components/Locale";
import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "../../../../lib/db";
import {requireRole} from "../../../../lib/auth";
import {canCoachAccess} from "../../../../lib/coach-access";
import AssignPlan from "./AssignPlan";

export const dynamic="force-dynamic";

export default async function Customer({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const actor=await requireRole(["COACH","ADMIN"]);if(!await canCoachAccess(actor,id))notFound();
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
  <header className="admin-header"><div><span className="eyebrow"><Copy text={"ATHLET"}/></span><h1>{u.name||u.email}</h1></div><div className="row-actions"><Link href={`/admin/inbox/${u.id}`} className="primary compact"><Copy text={"NACHRICHTEN"}/></Link><Link href="/admin/customers" className="ghost"><Copy text={"← KUNDEN"}/></Link></div></header>
  <div className="kpis">
   <div><span>PLAN</span><strong style={{fontSize:18}}>{u.assignments[0]?.plan.name||"Keine Angabe"}</strong><small><Copy text={"aktiv"}/></small></div>
   <div><span><Copy text={"LEISTUNGSWERT"}/></span><strong>{latest?.total??"Keine Angabe"}</strong><small><Copy text={"aktuell"}/></small></div>
   <div><span><Copy text={"REGENERATION"}/></span><strong>{latest?.recovery??"Keine Angabe"}</strong><small><Copy text={"aktuell"}/></small></div>
   <div><span>TRAINING</span><strong>{u.workouts.filter(w=>w.completedAt).length}</strong><small><Copy text={"letzte 40 Einheiten"}/></small></div>
  </div>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow"><Copy text={"PROFIL"}/></span><h2><Copy text={"Basis und Ziele"}/></h2><div className="body-stats">
    <div><span><Copy text={"E MAIL"}/></span><strong>{u.email}</strong></div><div><span><Copy text={"GEBURT"}/></span><strong>{u.birthDate?.toLocaleDateString("de-DE")||"Keine Angabe"}</strong></div><div><span><Copy text={"GRÖSSE"}/></span><strong><Copy text={u.heightCm?u.heightCm+" cm":"Keine Angabe"}/></strong></div><div><span><Copy text={"GEWICHT"}/></span><strong><Copy text={latestBody?.weightKg?latestBody.weightKg+" kg":"Keine Angabe"}/></strong></div><div><span><Copy text={"ZIELE"}/></span><strong>{u.goals.map(g=>g.type).join(", ")||"Keine Angabe"}</strong></div><div><span><Copy text={"TRAININGSTAGE"}/></span><strong>{u.availabilityPerWeek??"Keine Angabe"}</strong></div>
   </div></article>
   <aside className="stack"><AssignPlan userId={u.id} plans={plans.map(p=>({id:p.id,name:p.name}))}/><article className="panel"><span className="eyebrow"><Copy text={"EINWILLIGUNGEN"}/></span><h2><Copy text={"Datenschutz"}/></h2><p className="muted"><Copy text={"Gesundheitsdaten:"}/><Copy text={u.consents.find(c=>c.type==="health_data"&&c.granted)?"erlaubt":"nicht erlaubt"}/></p><p className="muted"><Copy text={"Fotos und Videos:"}/><Copy text={u.consents.find(c=>c.type==="media_processing"&&c.granted)?"erlaubt":"nicht erlaubt"}/></p></article></aside>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow"><Copy text={"LEISTUNGSWERT"}/></span><h2><Copy text={"Verlauf"}/></h2>{u.scoreSnapshots.map(s=><div className="history-row" key={s.id}><strong>{s.total}%</strong><span><LocalizedValue value={s.date} format="toLocaleDateString"/><Copy text={"· Kraft"}/>{s.strength??"Keine Angabe"}<Copy text={"· Regeneration"}/>{s.recovery??"Keine Angabe"}<Copy text={"· Daten"}/>{s.completeness}%</span></div>)}</article>
   <article className="panel"><span className="eyebrow"><Copy text={"TRAINER RADAR"}/></span><h2><Copy text={"Hinweise"}/></h2>{recommendations.length?recommendations.map(x=><div className="history-row" key={x.id}><strong>{x.title}</strong><span><LocalizedValue value={x.date} format="toLocaleDateString"/> · {x.severity.toUpperCase()}</span><small>{x.action}</small></div>):<p className="muted"><Copy text={"Keine Hinweise."}/></p>}</article>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow"><Copy text={"WOCHENCHECKS"}/></span><h2>Check ins</h2>{checkins.length?checkins.map(c=><div className="history-row" key={c.id}><strong><LocalizedValue value={c.weekStart} format="toLocaleDateString"/></strong><span><Copy text={"Gewicht"}/>{c.weightKg??"Keine Angabe"}<Copy text={"· Energie"}/>{c.energy??"Keine Angabe"}<Copy text={"· Regeneration"}/>{c.recovery??"Keine Angabe"} · Training {c.training??"Keine Angabe"}</span><small>{c.note||c.questions||"Keine Notiz"}</small></div>):<p className="muted"><Copy text={"Noch keine Check ins."}/></p>}</article>
   <article className="panel"><span className="eyebrow"><Copy text={"GESUNDHEITSDATEN"}/></span><h2><Copy text={"Letzte Werte"}/></h2><div className="body-stats">
    <div><span><Copy text={"SCHRITTE"}/></span><strong>{latestWearable?.steps?.toLocaleString("de-DE")??"Keine Angabe"}</strong></div><div><span><Copy text={"SCHLAF"}/></span><strong><Copy text={latestWearable?.sleepMinutes?Math.round(latestWearable.sleepMinutes/60*10)/10+" h":"Keine Angabe"}/></strong></div><div><span>HRV</span><strong>{latestWearable?.hrv??"Keine Angabe"}</strong></div><div><span><Copy text={"RUHEPULS"}/></span><strong>{latestWearable?.restingHr??"Keine Angabe"}</strong></div><div><span>VO2 MAX</span><strong>{latestWearable?.vo2max??"Keine Angabe"}</strong></div><div><span><Copy text={"QUELLE"}/></span><strong>{latestWearable?.source||"Keine Angabe"}</strong></div>
   </div></article>
  </section>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow"><Copy text={"KÖRPERWERTE"}/></span><h2><Copy text={"Maße"}/></h2>{body.length?body.map(x=><div className="history-row" key={x.id}><strong><LocalizedValue value={x.date} format="toLocaleDateString"/></strong><span><Copy text={"Gewicht"}/>{x.weightKg??"Keine Angabe"}<Copy text={"kg · Taille"}/>{x.waistCm??"Keine Angabe"}<Copy text={"cm · Brust"}/>{x.chestCm??"Keine Angabe"}<Copy text={"cm · Körperfett"}/>{x.bodyFat??"Keine Angabe"}</span></div>):<p className="muted"><Copy text={"Keine Werte."}/></p>}</article>
   <article className="panel"><span className="eyebrow"><Copy text={"ERNÄHRUNG"}/></span><h2><Copy text={"Letzte Tage"}/></h2>{nutrition.length?nutrition.map(x=><div className="history-row" key={x.id}><strong><LocalizedValue value={x.date} format="toLocaleDateString"/></strong><span>{x.calories??"Keine Angabe"} kcal · Protein {x.proteinG??"Keine Angabe"}<Copy text={"g · Wasser"}/>{x.waterMl??"Keine Angabe"}<Copy text={"ml · Leistungswert"}/>{x.fuelScore??"Keine Angabe"}</span></div>):<p className="muted"><Copy text={"Keine Daten."}/></p>}</article>
  </section>
  <article className="panel"><span className="eyebrow"><Copy text={"TRAININGSVERLAUF"}/></span><h2><Copy text={"Einheiten"}/></h2>{u.workouts.map(w=><div className="history-row" key={w.id}><strong>{w.title}</strong><span>{w.scheduledAt?.toLocaleDateString("de-DE")||"Ohne Datum"} · <Copy text={w.completedAt?"ABGESCHLOSSEN":"OFFEN"}/> · RPE {w.rpe??"Keine Angabe"}</span></div>)}</article>
  <section className="admin-cols">
   <article className="panel"><span className="eyebrow"><Copy text={"LEISTUNGSTESTS"}/></span><h2>Tests</h2>{tests.length?tests.map(t=><div className="history-row" key={t.id}><strong>{t.name}</strong><span>{t.completedAt?.toLocaleDateString("de-DE")||"GEPLANT"} · {t.results.map(z=>z.metric+" "+z.value+" "+z.unit).join(" · ")||"Noch keine Ergebnisse"}</span></div>):<p className="muted"><Copy text={"Keine Tests."}/></p>}</article>
   <article className="panel"><span className="eyebrow"><Copy text={"FORTSCHRITTSBILDER"}/></span><h2>{photos.length}<Copy text={"Bilder"}/></h2><div className="asset-grid">{photos.map(x=><div className="asset" key={x.id}><a href={`/api/media/${x.id}`} target="_blank"><LocalizedElement as="img" src={`/api/media/${x.id}`} alt="Fortschrittsbild"/></a><small><LocalizedValue value={x.createdAt} format="toLocaleString"/></small></div>)}</div></article>
  </section>
  <article className="panel"><span className="eyebrow"><Copy text={"TECHNIKVIDEOS"}/></span><h2>{videos.length} Videos</h2>{videos.length?videos.map(x=><div className="history-row" key={x.id}><strong>{x.originalName}</strong><span><LocalizedValue value={x.createdAt} format="toLocaleString"/></span><a className="secondary" href={`/api/media/${x.id}`} target="_blank"><Copy text={"ÖFFNEN"}/></a></div>):<p className="muted"><Copy text={"Keine Videos."}/></p>}</article>
 </main>;
}
