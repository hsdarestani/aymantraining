import Link from "next/link";
import {notFound} from "next/navigation";
import {requireUser} from "../../../lib/auth";
import {prisma} from "../../../lib/db";
import WorkoutSession from "./WorkoutSession";
export const dynamic="force-dynamic";

export default async function WorkoutPage({params}:{params:Promise<{id:string}>}){
  const user=await requireUser();const {id}=await params;
  const workout=await prisma.workout.findFirst({where:{id,userId:user.id},include:{exercises:{include:{exercise:true},orderBy:{orderIndex:"asc"}},sets:true}});
  if(!workout)notFound();
  const exerciseIds=workout.exercises.map(x=>x.exerciseId);
  const prior=await prisma.setLog.findMany({where:{exerciseId:{in:exerciseIds},workout:{userId:user.id,id:{not:id},completedAt:{not:null}}},orderBy:{completedAt:"desc"},take:500});
  const seen=new Set<string>();const previous=prior.filter(s=>{const key=`${s.exerciseId}:${s.setNumber}`;if(seen.has(key))return false;seen.add(key);return true;});
  return <main className="sub-shell workout-page"><header className="sub-top"><Link href="/dashboard" className="brand">BE <span>DIFFERENT</span></Link><nav><Link href="/training">← TRAINING</Link></nav></header><section className="page-hero compact-hero"><div><span className="eyebrow">WORKOUT MODE</span><h1>{workout.title}</h1><p>Letzte Werte werden vorausgefüllt. Satzdaten bleiben bei Netzverlust lokal in der Outbox und werden beim nächsten Online Moment synchronisiert.</p></div><div className="hero-stat"><span>EXERCISES</span><strong>{workout.exercises.length}</strong><small>{workout.startedAt?"IN PROGRESS":"READY"}</small></div></section><WorkoutSession workoutId={workout.id} exercises={workout.exercises} existing={workout.sets} previous={previous}/></main>;
}