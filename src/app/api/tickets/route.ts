import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

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
    const amountInCents = Math.round(totalAmount * 100);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "zar",
      metadata: {
        raffleId,
        userId: session.user.id,
        quantity: String(quantity),
      },
    });

    // Create pending ticket record
    const ticket = await prisma.ticket.create({
      data: {
        raffleId,
        userId: session.user.id,
        quantity,
        totalAmount,
        paymentIntentId: paymentIntent.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ticketId: ticket.id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
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
