import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyTransaction } from "@/lib/paystack";

/**
 * GET /api/tickets/verify?reference=xxx
 * Called by the frontend after Paystack popup closes with a success response.
 * Acts as a fast confirmation — the webhook is the authoritative source.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const result = await verifyTransaction(reference);

    if (!result.status || result.data.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 402 });
    }

    // Confirm ticket matching this reference (stored in paymentIntentId field)
    const updated = await prisma.ticket.updateMany({
      where: {
        paymentIntentId: reference,
        userId: session.user.id,
        status: "PENDING",
      },
      data: { status: "CONFIRMED" },
    });

    if (updated.count === 0) {
      // Already confirmed (e.g. by webhook) — still return success
      return NextResponse.json({ confirmed: true, alreadyProcessed: true });
    }

    return NextResponse.json({ confirmed: true });
  } catch (err) {
    console.error("Paystack verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
