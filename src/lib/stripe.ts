import Stripe from "stripe";

// Lazy singleton — only initialised at runtime when first used,
// not at build time when STRIPE_SECRET_KEY is unavailable.
let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

// Proxy keeps the same `stripe.xxx` API everywhere — no call-site changes needed.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getStripeClient(), prop);
  },
});
