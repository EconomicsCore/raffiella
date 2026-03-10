import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";
import { z } from "zod";
import crypto from "crypto";

const ticketSchema = z.object({
  raffleId: z.string(),
  quantity: z.number().int().positive().max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Sign in to purchase tickets" }, { status: 401 });

  try {
    const body = await req.json();
    const { raffleId, quantity } = ticketSchema.parse(body);

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: { _count: { select: { tickets: { where: { status: "CONFIRMED" } } } } },
    });

    if (!raffle || raffle.status !== "ACTIVE") {
      return NextResponse.json({ error: "Raffle not available" }, { status: 400 });
    }

    // Check per-person limit
    if (raffle.maxPerPerson) {
      const existing = await prisma.ticket.aggregate({
        where: { raffleId, userId: session.user.id, status: "CONFIRMED" },
        _sum: { quantity: true },
      });
      const alreadyHas = existing._sum.quantity ?? 0;
      if (alreadyHas + quantity > raffle.maxPerPerson) {
        return NextResponse.json(
          { error: `Maximum ${raffle.maxPerPerson} tickets per person` },
          { status: 400 }
        );
      }
    }

    const totalAmount = Number(raffle.ticketPrice) * quantity;
    const amountInKobo = Math.round(totalAmount * 100); // Paystack uses smallest currency unit

    // Unique reference for this transaction
    const reference = `raffle_${raffleId}_${crypto.randomBytes(8).toString("hex")}`;

    // Initialize Paystack transaction
    const paystack = await initializeTransaction({
      email: session.user.email!,
      amount: amountInKobo,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/raffles`,
      metadata: {
        raffleId,
        userId: session.user.id,
        quantity: String(quantity),
      },
    });

    if (!paystack.status) {
      return NextResponse.json({ error: "Payment initialisation failed" }, { status: 500 });
    }

    // Create pending ticket — confirmed by webhook once payment succeeds
    const ticket = await prisma.ticket.create({
      data: {
        raffleId,
        userId: session.user.id,
        quantity,
        totalAmount,
        paymentIntentId: reference, // reusing field to store Paystack reference
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ticketId: ticket.id,
      reference: paystack.data.reference,
      accessCode: paystack.data.access_code,
      amount: totalAmount,
      amountInKobo,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raffleId = searchParams.get("raffleId");

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: session.user.id,
      ...(raffleId ? { raffleId } : {}),
    },
    include: {
      raffle: {
        include: {
          prizes: { orderBy: { position: "asc" }, include: { images: { take: 1 } } },
          organiser: { select: { businessName: true } },
        },
      },
      winners: { include: { prize: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}
