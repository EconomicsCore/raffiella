// Paystack API helpers — lazy init, safe at build time

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return process.env.PAYSTACK_SECRET_KEY;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number; // in kobo (cents)
    currency: string;
    metadata: Record<string, unknown>;
  };
}

/** Initialize a Paystack transaction — returns authorization_url and reference */
export async function initializeTransaction(params: {
  email: string;
  amount: number;    // in kobo (ZAR cents × 100 — e.g. R10.00 = 1000)
  reference: string; // unique per transaction
  currency?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ currency: "ZAR", ...params }),
  });
  return res.json();
}

/** Verify a completed transaction by reference */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: authHeaders() }
  );
  return res.json();
}
