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
  <section className="page-hero compact-hero"><div><span className="eyebrow">MEMBERSHIP</span><h1>FREE zeigt was möglich ist. PRO macht es persönlich.</h1><p>PRO verbindet Tracking mit persönlicher Betreuung, Coach Radar, laufender Plananpassung und direktem Feedback.</p></div><div className="hero-stat"><span>PRO TEST</span><strong>7</strong><small>TAGE GRATIS</small></div></section>
  <section className="pricing-grid">
    <article className="panel price-card"><span className="eyebrow">FREE</span><h2>Start Different</h2><strong className="price">0 €</strong><p>Workout Tracking, Basis Bibliothek, Templates und Gesamt Score.</p><Link className="secondary full" href={user?"/dashboard":"/register"}>FREE STARTEN</Link></article>
    <article className="panel price-card pro"><span className="signal">PRO</span><h2>Build Your Athlete</h2><strong className="price">{Number(settings.proMonthly).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})} €</strong><p>Monatlich. Jährlich {Number(settings.proYearly).toLocaleString("de-DE",{maximumFractionDigits:2})} €. Einstellungen werden im Coach Panel verwaltet.</p>{full&&settings.waitlist?<><div className="tag amber">PRO KAPAZITÄT ERREICHT</div>{user?<WaitlistButton/>:<Link className="primary" href="/login">ANMELDEN →</Link>}</>:user?<TrialButton/>:<Link className="primary" href="/register">KONTO ERSTELLEN →</Link>}</article>
  </section></main>;
}
