
import {LocalizedValue} from "../components/Locale";

import {Copy} from "../components/Locale";
import Link from "next/link";
import {getCurrentUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import TrialButton from "./TrialButton";import WaitlistButton from "./WaitlistButton";
export const dynamic="force-dynamic";
export default async function Pricing(){
  const [user,row]=await Promise.all([getCurrentUser(),prisma.systemSetting.findUnique({where:{key:"app_settings"}})]);
  const settings={proMonthly:39.99,proYearly:399,proCapacity:50,waitlist:true,...((row?.value as any)||{})};
  const proCount=await prisma.user.count({where:{role:"ATHLETE",subscriptionTier:"PRO"}});
  const full=settings.proCapacity>0&&proCount>=settings.proCapacity;
  return <main className="sub-shell"><header className="sub-top"><Link href={user?"/dashboard":"/login"} className="brand">BE <span>DIFFERENT</span></Link></header>
  <section className="page-hero compact-hero"><div><span className="eyebrow"><Copy text={"MITGLIEDSCHAFT"}/></span><h1><Copy text={"KOSTENLOS zeigt was möglich ist. PRO macht es persönlich."}/></h1><p><Copy text={"PRO verbindet Tracking mit persönlicher Betreuung, Trainer Radar, laufender Plananpassung und direktem Feedback."}/></p></div><div className="hero-stat"><span>PRO TEST</span><strong>7</strong><small><Copy text={"TAGE GRATIS"}/></small></div></section>
  <section className="pricing-grid">
    <article className="panel price-card"><span className="eyebrow"><Copy text={"KOSTENLOS"}/></span><h2><Copy text={"Anders starten"}/></h2><strong className="price">0 €</strong><p><Copy text={"Trainingserfassung, Basisbibliothek, Vorlagen und Gesamtwert."}/></p><Link className="secondary full" href={user?"/dashboard":"/register"}><Copy text={"KOSTENLOS STARTEN"}/></Link></article>
    <article className="panel price-card pro"><span className="signal">PRO</span><h2><Copy text={"Dein Athlet"}/></h2><strong className="price"><LocalizedValue value={Number(settings.proMonthly)} format="toLocaleString" options={{minimumFractionDigits:2,maximumFractionDigits:2}}/> €</strong><p><Copy text={"Monatlich. Jährlich"}/><LocalizedValue value={Number(settings.proYearly)} format="toLocaleString" options={{maximumFractionDigits:2}}/><Copy text={"€. Einstellungen werden im Trainerbereich verwaltet."}/></p>{full&&settings.waitlist?<><div className="tag amber"><Copy text={"PRO KAPAZITÄT ERREICHT"}/></div>{user?<WaitlistButton/>:<Link className="primary" href="/login"><Copy text={"ANMELDEN →"}/></Link>}</>:user?<TrialButton/>:<Link className="primary" href="/register"><Copy text={"KONTO ERSTELLEN →"}/></Link>}</article>
  </section></main>;
}
