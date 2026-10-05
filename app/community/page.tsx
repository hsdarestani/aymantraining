
import {Copy} from "../components/Locale";
import Link from "next/link";
import {requireUser} from "../../lib/auth";
import {prisma} from "../../lib/db";
import {gamificationSnapshot,improvementLeaderboard} from "../../lib/gamification";
import CommunityClient from "./CommunityClient";
export const dynamic="force-dynamic";

export default async function Community(){
  const user=await requireUser();const now=new Date();
  const [challenges,gamification,leaderboard]=await Promise.all([
    prisma.challenge.findMany({where:{startsAt:{lte:now},endsAt:{gte:now},...(user.subscriptionTier==="FREE"?{proOnly:false}:{})},orderBy:{startsAt:"desc"}}),
    gamificationSnapshot(user.id),
    improvementLeaderboard()
  ]);
  return <main className="sub-shell">
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard"><Copy text={"BEGINN"}/></Link><Link href="/athlete"><Copy text={"ATHLET"}/></Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow"><Copy text={"GEMEINSCHAFT"}/></span><h1><Copy text={"Gemeinsam weiter."}/></h1><p><Copy text={"Aufgaben belohnen Fortschritt und Beständigkeit. Die Rangliste zählt Verbesserung statt absoluter Leistung."}/></p></div><div className="hero-stat"><span><Copy text={"SERIE"}/></span><strong>{gamification.streak}</strong><small><Copy text={"TAGE IN FOLGE"}/></small></div></section>
    <CommunityClient challenges={challenges} entries={gamification.entries.map(e=>({challengeId:e.challengeId,progress:e.progress,completedAt:e.completedAt?.toISOString()||null}))} badges={gamification.badges.map(b=>({id:b.id,name:b.name}))} leaderboard={leaderboard}/>
  </main>;
}