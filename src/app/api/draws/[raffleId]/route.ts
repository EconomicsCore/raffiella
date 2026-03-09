import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ raffleId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  const { raffleId } = await params;

  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    include: {
      prizes: { orderBy: { position: "asc" } },
      tickets: { where: { status: "CONFIRMED" } },
    },
  });

  if (!raffle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Raffle is not active" }, { status: 400 });
  }

  const totalTickets = raffle.tickets.reduce((sum, t) => sum + t.quantity, 0);

  // Check minimum tickets
  if (totalTickets < raffle.minTickets) {
    // Cancel raffle and refund all tickets
    await prisma.$transaction([
      prisma.raffle.update({ where: { id: raffleId }, data: { status: "CANCELLED" } }),
      prisma.ticket.updateMany({ where: { raffleId, status: "CONFIRMED" }, data: { status: "REFUNDED" } }),
    ]);
    // TODO: trigger Stripe refunds via webhook/job
    return NextResponse.json({ cancelled: true, reason: "Minimum tickets not met" });
  }

  // Build ticket pool (each ticket entry repeated by quantity)
  const pool: string[] = [];
  for (const ticket of raffle.tickets) {
    for (let i = 0; i < ticket.quantity; i++) {
      pool.push(ticket.id);
    }
  }

  // Cryptographically random draw
  const animSeed = crypto.randomBytes(16).toString("hex");
  const winners: { ticketId: string; prizeId: string }[] = [];
  const usedTickets = new Set<string>();

  for (const prize of raffle.prizes) {
    const available = pool.filter((t) => !usedTickets.has(t));
    if (available.length === 0) break;
    const idx = crypto.randomInt(0, available.length);
    const winningTicketId = available[idx];
    usedTickets.add(winningTicketId);
    winners.push({ ticketId: winningTicketId, prizeId: prize.id });
  }

  const draw = await prisma.$transaction(async (tx) => {
    const newDraw = await tx.draw.create({
      data: {
        raffleId,
        animSeed,
        winners: { create: winners },
      },
      include: {
        winners: {
          include: {
            prize: true,
            ticket: { include: { user: { select: { name: true, email: true, isAnonymous: true } } } },
          },
        },
      },
    });
    await tx.raffle.update({ where: { id: raffleId }, data: { status: "DRAWN" } });
    return newDraw;
  });

  return NextResponse.json(draw);
}
