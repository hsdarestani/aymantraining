
import {Copy} from "../../components/Locale";
import Link from "next/link";import {prisma} from "../../../lib/db";import RulesClient from "./RulesClient";export const dynamic="force-dynamic";
export default async function Rules(){
 const [rules,wrow,frow,rrow]=await Promise.all([prisma.coachingRule.findMany({orderBy:{priority:"asc"}}),prisma.systemSetting.findUnique({where:{key:"score_weights"}}),prisma.systemSetting.findUnique({where:{key:"score_formula"}}),prisma.systemSetting.findUnique({where:{key:"radar_thresholds"}})]);
 const weights=(wrow?.value||{strength:20,endurance:15,athleticism:15,mobility:10,recovery:15,fuel:10,consistency:15}) as any;
 const formula={sleepTargetHours:8,proteinTargetGPerKg:1.6,waterTargetMl:2500,checkinsPerWeek:5,performanceChangeMultiplier:125,...((frow?.value as object)||{})};
 const radar={green:80,amber:60,...((rrow?.value as object)||{})};
 return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINERBEREICH"}/></span><h1><Copy text={"REGELN UND LEISTUNGSWERT"}/></h1></div><Link href="/admin" className="ghost">← Dashboard</Link></header><RulesClient rules={rules.map(r=>({id:r.id,key:r.key,title:r.title,enabled:r.enabled,priority:r.priority,conditions:r.conditions as Record<string,unknown>,action:r.action as Record<string,unknown>}))} weights={weights} engine={{formula,radar}}/></main>;
}