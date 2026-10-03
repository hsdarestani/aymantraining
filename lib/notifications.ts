import { prisma } from "./db";

function minutes(value: string | null | undefined) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function inQuietHours(now: Date, from?: string | null, to?: string | null) {
  const start = minutes(from);
  const end = minutes(to);
  if (start == null || end == null) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export async function queueNotification(input: {
  userId: string;
  category: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null>;
  urgent?: boolean;
}) {
  const pref = await prisma.pushPreference.findUnique({
    where: { userId_category: { userId: input.userId, category: input.category } }
  });
  if (pref && !pref.enabled) return null;

  const now = new Date();
  if (!input.urgent && inQuietHours(now, pref?.quietFrom, pref?.quietTo)) return null;

  const settings = await prisma.systemSetting.findUnique({ where: { key: "notification_limits" } });
  const dailyMax = Number((settings?.value as { dailyMax?: number } | null)?.dailyMax ?? 3);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const count = await prisma.notification.count({ where: { userId: input.userId, createdAt: { gte: start } } });
  if (!input.urgent && count >= dailyMax) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      data: input.data,
      sendAt: now
    }
  });
}
