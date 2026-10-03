import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "./db";

export const DEFAULT_FLAGS: Record<string, { free: boolean; pro: boolean; elite: boolean }> = {
  workout_tracking: { free: true, pro: true, elite: true },
  exercise_library_full: { free: false, pro: true, elite: true },
  unlimited_history: { free: false, pro: true, elite: true },
  wearable_advanced: { free: false, pro: true, elite: true },
  progress_photos_unlimited: { free: false, pro: true, elite: true },
  score_details: { free: false, pro: true, elite: true },
  coach_radar_full: { free: false, pro: true, elite: true },
  recovery_warnings: { free: false, pro: true, elite: true },
  sleep_advanced: { free: false, pro: true, elite: true },
  nutrition_fuel: { free: false, pro: true, elite: true },
  performance_tests_unlimited: { free: false, pro: true, elite: true },
  coach_chat: { free: false, pro: true, elite: true },
  video_feedback: { free: false, pro: true, elite: true },
  weekly_checkin: { free: false, pro: true, elite: true },
  weekly_report_full: { free: false, pro: true, elite: true },
  performance_timeline: { free: false, pro: true, elite: true },
  digital_twin: { free: false, pro: true, elite: true },
  pro_challenges: { free: false, pro: true, elite: true }
};

export async function hasFeature(tier: SubscriptionTier, key: string) {
  const stored = await prisma.featureFlag.findUnique({ where: { key } });
  const flag = stored ?? DEFAULT_FLAGS[key];
  if (!flag) return false;
  if (tier === "ELITE") return flag.elite;
  if (tier === "PRO") return flag.pro;
  return flag.free;
}
