
import {Copy} from "../../components/Locale";
import Link from "next/link";import {prisma} from "../../../lib/db";
import {getCurrentUser} from "../../../lib/auth";import NormForm from "./NormForm";export const dynamic="force-dynamic";export default async function Norms(){const viewer=await getCurrentUser();const demo=viewer?.role==="ADMIN"&&viewer?.email==="admin@bedifferent.smarbiz.sbs";const items=await prisma.referenceNorm.findMany({orderBy:[{metric:"asc"},{minAge:"asc"}]});return <main className="admin-content" style={{margin:"0 auto"}}><header className="admin-header"><div><span className="eyebrow"><Copy text={"TRAINERBEREICH"}/></span><h1>Reference Norms</h1></div><Link href="/admin/rules" className="ghost">← Rules</Link></header><section className="admin-cols"><article className="panel"><span className="eyebrow">NORMALIZATION</span><h2>{items.length}<Copy text={"Referenzbereiche"}/></h2>{items.map(x=><div className="history-row" key={x.id}><strong>{x.metric} · {x.sex||"alle"}</strong><span>Age {x.minAge??"—"}–{x.maxAge??"—"} · Weight {x.minWeight??"—"}–{x.maxWeight??"—"} · {x.lowValue} → {x.highValue}</span></div>)}</article>{demo&&items.length===0&&<article className="panel">
 <span className="eyebrow">DEMO · REFERENZWERTE</span>
 <h2>Beispiel einer Normenübersicht</h2>
 <p className="muted">Nur zur Darstellung. Diese Beispielwerte sind nicht als Trainingsnorm gespeichert und beeinflussen keine Leistungsberechnung.</p>
 {[
  ["Liegestütze","18 bis 30 Wdh.","Kraftausdauer"],
  ["Plank","60 bis 120 s","Core"],
  ["Mobilität","60 bis 85 Punkte","Beweglichkeit"],
  ["Ruhepuls","55 bis 70 bpm","Regeneration"]
 ].map(([name,range,category])=><div className="history-row" key={name}><strong>{name}</strong><span>{range} · {category} · DEMO</span></div>)}
</article>}
 <NormForm/></section></main>;}