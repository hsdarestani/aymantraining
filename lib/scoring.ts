import { prisma } from "./db";
import { dateOnly } from "./http";

export type Pillar = "strength" | "endurance" | "athleticism" | "mobility" | "recovery" | "fuel" | "consistency";

export const DEFAULT_WEIGHTS: Record<Pillar, number> = {
  strength: 20,
  endurance: 15,
  athleticism: 15,
  mobility: 10,
  recovery: 15,
  fuel: 10,
  consistency: 15
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function ratioScore(current: number | null, baseline: number | null, higherIsBetter = true) {
  if (current == null || baseline == null || baseline === 0) return null;
  const ratio = current / baseline;
  const change = higherIsBetter ? ratio - 1 : 1 - ratio;
  return clamp(50 + change * 125);
}

async function scoreSettings() {
  const row = await prisma.systemSetting.findUnique({ where: { key: "score_weights" } });
  const data = row?.value as Partial<Record<Pillar, number>> | undefined;
  return { ...DEFAULT_WEIGHTS, ...(data ?? {}) };
}

async function recentTestMetric(userId: string, names: string[]) {
  const rows = await prisma.testResult.findMany({
    where: { test: { userId }, metric: { in: names } },
    include: { test: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });
  if (!rows.length) return null;
  const latest = rows[0].value;
  const oldest = rows[rows.length - 1].value;
  return ratioScore(latest, oldest, !names.some((n) => /time|sprint|5k/i.test(n)));
}

export async function recomputeScoreForUser(userId: string, when = new Date()) {
  const end = when;
  const seven = new Date(end.getTime() - 7 * 86400000);
  const thirty = new Date(end.getTime() - 30 * 86400000);
  const fortyTwo = new Date(end.getTime() - 42 * 86400000);
  const eightyFour = new Date(end.getTime() - 84 * 86400000);

  const [wearables, checks, nutrition, recentSets, baselineSets, workouts, strengthTest, enduranceTest, athleticTest, mobilityTest] =
    await Promise.all([
      prisma.wearableDaily.findMany({ where: { userId, date: { gte: thirty, lte: end } }, orderBy: { date: "asc" } }),
      prisma.dailyCheck.findMany({ where: { userId, date: { gte: seven, lte: end } }, orderBy: { date: "asc" } }),
      prisma.nutritionDaily.findMany({ where: { userId, date: { gte: seven, lte: end } }, orderBy: { date: "asc" } }),
      prisma.setLog.findMany({ where: { workout: { userId }, completedAt: { gte: fortyTwo, lte: end } } }),
      prisma.setLog.findMany({ where: { workout: { userId }, completedAt: { gte: eightyFour, lt: fortyTwo } } }),
      prisma.workout.findMany({ where: { userId, scheduledAt: { gte: seven, lte: end } } }),
      recentTestMetric(userId, ["pushups", "pullups", "dips", "strength"]),
      recentTestMetric(userId, ["5k_time", "vo2max", "endurance"]),
      recentTestMetric(userId, ["30m_sprint", "jump", "athleticism"]),
      recentTestMetric(userId, ["mobility", "mobility_score"])
    ]);

  const recentVolume = recentSets.reduce((sum, s) => sum + (s.weightKg ?? 1) * (s.reps ?? 1), 0);
  const baselineVolume = baselineSets.reduce((sum, s) => sum + (s.weightKg ?? 1) * (s.reps ?? 1), 0);
  const strength = strengthTest ?? (recentSets.length && baselineSets.length ? ratioScore(recentVolume / 42, baselineVolume / 42) : null);

  const wearableVo2 = wearables.map((w) => w.vo2max).filter((v): v is number => v != null);
  const endurance = enduranceTest ?? (wearableVo2.length > 1 ? ratioScore(wearableVo2.at(-1)!, wearableVo2[0]) : null);
  const athleticism = athleticTest;
  const mobility = mobilityTest;

  const sleep = average(wearables.map((w) => (w.sleepMinutes == null ? NaN : w.sleepMinutes / 60)).filter(Number.isFinite));
  const hrvValues = wearables.map((w) => w.hrv).filter((v): v is number => v != null);
  const rhrValues = wearables.map((w) => w.restingHr).filter((v): v is number => v != null);
  const subjective = average(checks.flatMap((c) => [
    c.energy == null ? NaN : c.energy * 10,
    c.mood == null ? NaN : c.mood * 10,
    c.stress == null ? NaN : 110 - c.stress * 10,
    c.soreness == null ? NaN : 110 - c.soreness * 10
  ]).filter(Number.isFinite));

  const recoveryParts: number[] = [];
  if (sleep != null) recoveryParts.push(clamp((sleep / 8) * 100));
  if (hrvValues.length > 3) {
    const base = average(hrvValues.slice(0, Math.max(1, hrvValues.length - 3)));
    const cur = average(hrvValues.slice(-3));
    const s = ratioScore(cur, base);
    if (s != null) recoveryParts.push(s);
  }
  if (rhrValues.length > 3) {
    const base = average(rhrValues.slice(0, Math.max(1, rhrValues.length - 3)));
    const cur = average(rhrValues.slice(-3));
    const s = ratioScore(cur, base, false);
    if (s != null) recoveryParts.push(s);
  }
  if (subjective != null) recoveryParts.push(clamp(subjective));
  const recovery = average(recoveryParts);
  const recoveryScore = recovery == null ? null : clamp(recovery);

  const fuelParts: number[] = [];
  const protein = average(nutrition.map((n) => n.proteinG).filter((v): v is number => v != null));
  const water = average(nutrition.map((n) => n.waterMl).filter((v): v is number => v != null));
  if (protein != null) fuelParts.push(clamp((protein / 130) * 100));
  if (water != null) fuelParts.push(clamp((water / 2500) * 100));
  const directFuel = average(nutrition.map((n) => n.fuelScore).filter((v): v is number => v != null));
  if (directFuel != null) fuelParts.push(directFuel);
  const fuelAvg = average(fuelParts);
  const fuel = fuelAvg == null ? null : clamp(fuelAvg);

  const planned = workouts.filter((w) => w.scheduledAt != null).length;
  const completed = workouts.filter((w) => w.completedAt != null).length;
  const checkConsistency = Math.min(1, checks.length / 5);
  const planConsistency = planned ? completed / planned : null;
  const consistency = planConsistency == null && !checks.length
    ? null
    : clamp(((planConsistency ?? checkConsistency) * 0.75 + checkConsistency * 0.25) * 100);

  const values: Record<Pillar, number | null> = {
    strength, endurance, athleticism, mobility, recovery: recoveryScore, fuel, consistency
  };
  const weights = await scoreSettings();
  const present = (Object.keys(values) as Pillar[]).filter((key) => values[key] != null);
  const availableWeight = present.reduce((sum, key) => sum + weights[key], 0);
  const weighted = present.reduce((sum, key) => sum + (values[key] ?? 0) * weights[key], 0);
  const total = availableWeight ? clamp(weighted / availableWeight) : 0;
  const completeness = clamp(availableWeight);

  const explanations = present.map((key) => ({
    pillar: key,
    value: values[key],
    text: key === "recovery"
      ? "Recovery basiert auf Schlaf, persönlichen HRV/Ruhepuls-Trends und täglichem Befinden."
      : key === "consistency"
        ? "Consistency basiert auf Planerfüllung und Check-ins der letzten 7 Tage."
        : key === "fuel"
          ? "Fuel basiert auf vorhandenen Ernährungs- und Trinkdaten."
          : "Leistungssäulen verändern sich über Tests und mehrwöchige Trends."
  }));

  const snapshot = await prisma.scoreSnapshot.upsert({
    where: { userId_date: { userId, date: dateOnly(when) } },
    update: {
      total,
      strength, endurance, athleticism, mobility,
      recovery: recoveryScore, fuel, consistency, completeness,
      explanation: explanations
    },
    create: {
      userId,
      date: dateOnly(when),
      total,
      strength, endurance, athleticism, mobility,
      recovery: recoveryScore, fuel, consistency, completeness,
      explanation: explanations
    }
  });

  return snapshot;
}

export function levelForScore(score: number) {
  if (score >= 90) return "TRULY DIFFERENT";
  if (score >= 75) return "BE DIFFERENT";
  if (score >= 60) return "DIFFERENT";
  if (score >= 40) return "AWAKE";
  return "NORMAL";
}
