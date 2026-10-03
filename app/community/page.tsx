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
    <header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/dashboard">HOME</Link><Link href="/athlete">ATHLETE</Link></nav></header>
    <section className="page-hero compact-hero"><div><span className="eyebrow">COMMUNITY</span><h1>Different together.</h1><p>Challenges belohnen Fortschritt und Consistency. Die Rangliste zählt Verbesserung statt absoluter Leistung.</p></div><div className="hero-stat"><span>STREAK</span><strong>{gamification.streak}</strong><small>DAYS DIFFERENT</small></div></section>
    <CommunityClient challenges={challenges} entries={gamification.entries.map(e=>({challengeId:e.challengeId,progress:e.progress,completedAt:e.completedAt?.toISOString()||null}))} badges={gamification.badges.map(b=>({id:b.id,name:b.name}))} leaderboard={leaderboard}/>
  </main>;
}