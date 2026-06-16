import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { sendReminder24h, sendReminderDay } from "@/modules/emails/sendEmail";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const shifts24h = await prisma.shiftReplacement.findMany({
    where: { state: "CONFIRMED", requesterStart: { gte: now, lte: in24h } },
  });

  for (const shift of shifts24h) {
    const coverages = await prisma.shiftCoverage.findMany({ where: { shiftReplacementId: shift.id } });
    const userIds = [shift.requesterId, ...coverages.map((c) => c.applicantId)];
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(userIds)] } }, select: { id: true, name: true, email: true } });
    const specialty = await prisma.specialty.findUnique({ where: { id: shift.specialtyId }, select: { name: true } });
    const userById = new Map(users.map((u) => [u.id, u]));

    const startStr = shift.requesterStart.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const endStr = shift.requesterEnd.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    for (const userId of userIds) {
      const user = userById.get(userId);
      if (user?.email) {
        try {
          await sendReminder24h(user.email, user.name, specialty?.name ?? "", startStr, endStr);
        } catch (e) {
          console.error("Failed to send 24h reminder:", e);
        }
      }
    }
  }

  const shiftsToday = await prisma.shiftReplacement.findMany({
    where: { state: "CONFIRMED", requesterStart: { gte: startOfDay, lt: endOfDay } },
  });

  for (const shift of shiftsToday) {
    const coverages = await prisma.shiftCoverage.findMany({ where: { shiftReplacementId: shift.id } });
    const userIds = [shift.requesterId, ...coverages.map((c) => c.applicantId)];
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(userIds)] } }, select: { id: true, name: true, email: true } });
    const specialty = await prisma.specialty.findUnique({ where: { id: shift.specialtyId }, select: { name: true } });
    const userById = new Map(users.map((u) => [u.id, u]));

    const startStr = shift.requesterStart.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const endStr = shift.requesterEnd.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    for (const userId of userIds) {
      const user = userById.get(userId);
      if (user?.email) {
        try {
          await sendReminderDay(user.email, user.name, specialty?.name ?? "", startStr, endStr);
        } catch (e) {
          console.error("Failed to send day reminder:", e);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, reminders24h: shifts24h.length, remindersToday: shiftsToday.length });
}