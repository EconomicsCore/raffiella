import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Zap, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 py-24 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-blue-700 text-blue-100 border-blue-600">South Africa&apos;s #1 Raffle Platform</Badge>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Win Big. <br className="sm:hidden" />
            <span className="text-amber-400">Run Better Raffles.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100">
            Raffiela connects participants with exciting prize draws and gives organisations the tools to run secure, transparent raffles. Fully automated draws. Instant payouts.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-amber-400 text-gray-900 hover:bg-amber-300 font-bold px-8" asChild>
              <Link href="/raffles">Browse Raffles <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/register?role=ORGANISER">Run a Raffle</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/20 pt-12">
            {[["100%", "Automated Draws"], ["0%", "Manipulation Risk"], ["ZAR", "Local Currency"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-2xl font-extrabold text-amber-400 sm:text-3xl">{val}</div>
                <div className="text-sm text-blue-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">How Raffiela Works</h2>
            <p className="mt-2 text-gray-500">Simple, transparent, and fair for everyone</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: <Trophy className="h-8 w-8 text-blue-600" />, title: "Browse Raffles", desc: "Discover active raffles from charities, businesses, and individuals across South Africa." },
              { icon: <Zap className="h-8 w-8 text-blue-600" />, title: "Enter Instantly", desc: "Buy tickets securely online with card, EFT, Apple Pay or Google Pay. Entries confirmed instantly." },
              { icon: <Shield className="h-8 w-8 text-blue-600" />, title: "Automated Draw", desc: "Winners are selected cryptographically at the scheduled time. No human interference." },
            ].map(({ icon, title, desc }, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">{icon}</div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Organisers */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700">For Organisations</Badge>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Everything you need to run a successful raffle</h2>
              <ul className="space-y-3">
                {[
                  "Set ticket price, min/max tickets, and draw date",
                  "Multiple prizes (1st, 2nd, 3rd place)",
                  "Upload prize photos and descriptions",
                  "Get your own shareable URL and QR code",
                  "Automated draw with winner animation",
                  "Dashboard with real-time ticket sales",
                  "5% platform fee — no upfront costs",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/register?role=ORGANISER">Start for free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
              <Users className="mb-4 h-10 w-10 text-blue-200" />
              <h3 className="mb-2 text-xl font-bold">Who can run a raffle?</h3>
              <div className="space-y-3">
                {[
                  ["🏢 Businesses", "Product launches, brand awareness, customer loyalty"],
                  ["❤️ Charities", "Fundraising events, community support, awareness campaigns"],
                  ["👤 Individuals", "Personal fundraisers, birthday raffles, community events"],
                ].map(([title, desc]) => (
                  <div key={String(title)} className="rounded-lg bg-white/10 p-3">
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-blue-200">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-white px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-10 text-2xl font-bold text-gray-900">Built for trust and compliance</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: "🔒", title: "Secure Payments", desc: "Stripe-powered, PCI compliant" },
              { icon: "⚖️", title: "SA Compliant", desc: "POPIA & Lotteries Act aware" },
              { icon: "🎲", title: "Fair Draws", desc: "Cryptographically random" },
              { icon: "💰", title: "Instant Refunds", desc: "If minimums aren't met" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border p-4">
                <div className="mb-2 text-2xl">{icon}</div>
                <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 px-4 py-16 text-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mb-8 text-blue-100">Join thousands of participants and organisers on Raffiela.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 font-bold" asChild>
              <Link href="/raffles">Browse Raffles</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
