import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import AssignPlan from "./AssignPlan";

export const dynamic = "force-dynamic";

export default async function Customer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [u, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        scoreSnapshots: { orderBy: { date: "desc" }, take: 12 },
        dailyChecks: { orderBy: { date: "desc" }, take: 14 },
        workouts: { orderBy: { scheduledAt: "desc" }, take: 20 },
        assignments: { where: { active: true }, include: { plan: true } },
        consents: { orderBy: { grantedAt: "desc" } }
      }
    }),
    prisma.trainingPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } })
  ]);

  if (!u) notFound();

  return <main className="admin-content" style={{ margin: "0 auto" }}>
    <header className="admin-header">
      <div><span className="eyebrow">ATHLETE</span><h1>{u.name || u.email}</h1></div>
      <Link href="/admin/customers" className="ghost">← Kunden</Link>
    </header>
    <div className="kpis">
      <div><span>PLAN</span><strong style={{ fontSize: 18 }}>{u.assignments[0]?.plan.name || "—"}</strong><small>aktiv</small></div>
      <div><span>SCORE</span><strong>{u.scoreSnapshots[0]?.total ?? "—"}</strong><small>aktuell</small></div>
      <div><span>RECOVERY</span><strong>{u.scoreSnapshots[0]?.recovery ?? "—"}</strong><small>aktuell</small></div>
      <div><span>WORKOUTS</span><strong>{u.workouts.filter(w => w.completedAt).length}</strong><small>letzte 20</small></div>
    </div>
    <section className="admin-cols">
      <article className="panel">
        <span className="eyebrow">RECENT WORKOUTS</span><h2>Verlauf</h2>
        {u.workouts.map(w => <div className="history-row" key={w.id}>
          <strong>{w.title}</strong>
          <span>{w.scheduledAt?.toLocaleDateString("de-DE")} · {w.completedAt ? "DONE" : "OPEN"} · RPE {w.rpe ?? "—"}</span>
        </div>)}
      </article>
      <aside className="stack">
        <AssignPlan userId={u.id} plans={plans.map(p => ({ id: p.id, name: p.name }))} />
        <article className="panel">
          <span className="eyebrow">CONSENT</span><h2>Health Data</h2>
          <p className="muted">{u.consents.find(c => c.type === "health_data" && c.granted) ? "Einwilligung vorhanden" : "Noch keine Einwilligung"}</p>
        </article>
      </aside>
    </section>
  </main>;
}
