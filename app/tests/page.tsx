
import {LocalizedValue} from "../components/Locale";

import {Copy} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {hasFeature} from "../../lib/entitlements";
import TestComplete from "./TestComplete";
export const dynamic="force-dynamic";
type Block={metric:string;label:string;unit:string;instructions?:string};
export default async function Tests(){
 const user=await requireUser();const timeline=await hasFeature(user.subscriptionTier,"performance_timeline");
 const items=await prisma.performanceTest.findMany({where:{userId:user.id},include:{results:true},orderBy:[{completedAt:"desc"},{scheduledAt:"desc"}],take:50});
 const due=items.find(x=>!x.completedAt);
 const definition=due&&Array.isArray(due.definition)?due.definition as unknown as Block[]:[];
 return <main className="sub-shell"><header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text={"BEGINN"}/></Link><Link href="/progress"><Copy text={"FORTSCHRITT"}/></Link></nav></header><section className="page-hero compact-hero"><div><span className="eyebrow">BE DIFFERENT TEST</span><h1><Copy text={"Testen. Vergleichen. Entwickeln."}/></h1><p><Copy text={"Standardisierte Tests machen Fortschritt über 4 bis 6 Wochen sichtbar."}/></p></div><div className="hero-stat"><span>TESTS</span><strong>{items.filter(x=>x.completedAt).length}</strong><small><Copy text={timeline?"VERLAUF":"STARTTEST"}/></small></div></section>{due&&<TestComplete id={due.id} name={due.name} definition={definition}/>}<article className="panel" style={{marginTop:18}}><span className="eyebrow"><Copy text={"VERLAUF"}/></span><h2><Copy text={timeline?"Deine Tests":"KOSTENLOSER STARTTEST"}/></h2><div className="test-timeline">{items.filter(x=>x.completedAt).slice(0,timeline?50:1).map((t,i)=><div className="test-card" key={t.id}><span>TEST {String(items.length-i).padStart(2,"0")}</span><strong>{t.results[0]?.value??"Keine Angabe"}</strong><small>{t.results[0]?.metric} · {t.results[0]?.unit}</small><b><LocalizedValue value={t.completedAt} format="toLocaleDateString"/></b></div>)}</div>{!timeline&&<Link href="/pricing" className="secondary"><Copy text={"PERFORMANCE VERLAUF FREISCHALTEN"}/></Link>}</article></main>;
}