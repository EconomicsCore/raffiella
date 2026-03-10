import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/webhooks/paystack
 * Paystack sends a charge.success event when payment is confirmed.
 * Verified using HMAC-SHA512 with PAYSTACK_SECRET_KEY.
 *
 * Add this URL in your Paystack dashboard → Settings → Webhooks:
 *   https://www.raffiella.org/api/webhooks/paystack
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Verify Paystack signature
  const expectedHash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  if (expectedHash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      status: string;
      reference: string;
      amount: number;
      metadata: Record<string, unknown>;
    };
  };

  if (event.event === "charge.success" && event.data.status === "success") {
    const { reference } = event.data;

    // Confirm the ticket with this Paystack reference
    await prisma.ticket.updateMany({
      where: { paymentIntentId: reference, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
  }

  if (event.event === "charge.failed") {
    const { reference } = event.data;
    // Remove the pending ticket so the user can try again
    await prisma.ticket.deleteMany({
      where: { paymentIntentId: reference, status: "PENDING" },
    });
  }

  return NextResponse.json({ received: true });
}
