
import {Copy,ExerciseName,LocalizedElement} from "../components/Locale";


import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
export const dynamic="force-dynamic";

export default async function Library({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
  const user=await requireUser();const params=await searchParams;const full=await hasFeature(user.subscriptionTier,"exercise_library_full");
  const where:any={active:true,...(!full?{freeAccess:true}:{})};
  if(params.q)where.OR=[{nameDe:{contains:params.q,mode:"insensitive"}},{nameEn:{contains:params.q,mode:"insensitive"}},{equipment:{contains:params.q,mode:"insensitive"}}];
  if(params.category)where.category=params.category;
  const [items,categories]=await Promise.all([prisma.exercise.findMany({where,orderBy:[{category:"asc"},{nameDe:"asc"}],take:200}),prisma.exercise.findMany({where:{active:true,...(!full?{freeAccess:true}:{})},select:{category:true},distinct:["category"],orderBy:{category:"asc"}})]);
  return <main className="sub-shell"><header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow"><Copy text={"ÜBUNGSBIBLIOTHEK"}/></span><h1><Copy text={"Sehen. Verstehen. Sauber ausführen."}/></h1><p><Copy text={"Jede Übung mit drei Positionen, Trainer Hinweise, Fehlern und kurzem Video sobald das Trainer Material hinterlegt ist."}/></p></div><div className="hero-stat"><span><Copy text={"ZUGANG"}/></span><strong>{items.length}</strong><small><Copy text={full?"VOLLSTÄNDIGE PRO BIBLIOTHEK":"KOSTENLOSE BASIS"}/></small></div></section>
    <form className="library-filter"><label className="brand-field"><span><Copy text={"Übung, Equipment…"}/></span><LocalizedElement as="input" name="q" defaultValue={params.q||""} placeholder="Übung, Equipment…"/></label><select name="category" defaultValue={params.category||""}><option value=""><Copy text={"Alle Kategorien"}/></option>{categories.map(x=><option key={x.category}>{x.category}</option>)}</select><button className="secondary"><Copy text={"FILTERN"}/></button></form>
    <section className="library-grid">{items.map(x=><Link className="panel exercise-card" href={`/exercise/${x.id}`} key={x.id}><div className="exercise-cover">{x.imageMiddle?<img src={x.imageMiddle} alt=""/>:<span>{x.id.slice(-3)}</span>}<b><Copy text={x.freeAccess?"KOSTENLOS":"PRO"}/></b></div><span className="eyebrow">{x.category}<Copy text={"· STUFE"}/>{x.level}</span><h2><ExerciseName exercise={x}/></h2><p>{x.equipment||"Ohne Equipment"}</p><strong><Copy text={"ÖFFNEN →"}/></strong></Link>)}</section>
    {!full&&<article className="panel library-upsell"><div><span className="eyebrow"><Copy text={"PRO BIBLIOTHEK"}/></span><h2><Copy text={"Spezialübungen freischalten."}/></h2></div><Link className="primary compact" href="/pricing"><Copy text={"PRO TESTEN"}/></Link></article>}
  </main>
}