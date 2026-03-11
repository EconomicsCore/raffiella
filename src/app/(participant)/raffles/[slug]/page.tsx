"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DrawAnimation from "@/components/raffles/DrawAnimation";
import { formatZAR, formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket, Trophy, Users, Minus, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

// Paystack inline JS global type
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string; status: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export default function RaffleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [showDraw, setShowDraw] = useState(false);

  // Load Paystack inline JS once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    fetch(`/api/raffles/${slug}`)
      .then((r) => r.json())
      .then((data) => { setRaffle(data); setLoading(false); });
  }, [slug]);

  const purchase = async () => {
    if (!session) { toast.error("Sign in to purchase tickets"); return; }
    setPurchasing(true);

    try {
      // Step 1 — create pending ticket + initialize Paystack transaction
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raffleId: raffle.id, quantity }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error); setPurchasing(false); return; }

      // Step 2 — open Paystack inline popup
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: session.user?.email!,
        amount: data.amountInKobo,
        currency: "ZAR",
        ref: data.reference,
        metadata: { ticketId: data.ticketId },

        // Step 3 — on success, verify from our backend as well
        callback: async (response) => {
          const verifyRes = await fetch(`/api/tickets/verify?reference=${response.reference}`);
          if (verifyRes.ok) {
            toast.success(`🎉 ${quantity} ticket${quantity > 1 ? "s" : ""} confirmed!`);
          } else {
            toast.info("Payment received — your ticket will be confirmed shortly.");
          }
          setPurchasing(false);
        },

        onClose: () => {
          toast.warning("Payment cancelled.");
          setPurchasing(false);
        },
      });

      handler.openIframe();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!raffle || raffle.error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-700">Raffle not found</h1>
        <Button asChild className="mt-4"><Link href="/raffles">Browse Raffles</Link></Button>
      </div>
    );
  }

  const isActive = raffle.status === "ACTIVE";
  const isDrawn = raffle.status === "DRAWN";
  const confirmedTickets = raffle._count?.tickets ?? 0;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/raffles/${raffle.slug}`;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/raffles" className="hover:text-blue-600">Raffles</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{raffle.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prize image */}
          {(raffle.prizes[0]?.images[0]?.url || raffle.coverImage) && (
            <div className="overflow-hidden rounded-2xl">
              <img
                src={raffle.prizes[0]?.images[0]?.url ?? raffle.coverImage}
                alt={raffle.prizes[0]?.name ?? raffle.title}
                className="h-64 w-full object-cover sm:h-80"
              />
            </div>
          )}

          {/* Title & meta */}
          <div>
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <Badge className={isActive ? "bg-green-100 text-green-700" : isDrawn ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}>
                {isActive ? "🟢 Live" : isDrawn ? "✅ Drawn" : raffle.status}
              </Badge>
              {raffle.isFeatured && <Badge className="bg-amber-100 text-amber-700">⭐ Featured</Badge>}
              {raffle.category && <Badge variant="outline">{raffle.category}</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{raffle.title}</h1>
            <p className="mt-1 text-gray-500">
              by <span className="font-medium">{raffle.organiser.businessName}</span>
              {raffle.region && <span className="ml-2 flex items-center inline-flex gap-1"><MapPin className="h-3 w-3" />{raffle.region}</span>}
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{raffle.description}</p>

          {/* Prizes */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Trophy className="h-5 w-5 text-blue-600" /> Prizes
            </h2>
            <div className="space-y-3">
              {raffle.prizes.map((prize: { id: string; position: number; name: string; description?: string; value?: number; showValue?: boolean; images: { url: string }[]; winner?: { ticket: { user: { name?: string; isAnonymous?: boolean } } } }) => (
                <div key={prize.id} className="flex gap-4 rounded-xl border p-4">
                  {prize.images[0] && (
                    <img src={prize.images[0].url} alt={prize.name} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {prize.position}
                      </span>
                      <span className="font-semibold">{prize.name}</span>
                      {prize.value && prize.showValue !== false && <span className="text-sm text-gray-500">({formatZAR(prize.value)})</span>}
                    </div>
                    {prize.description && <p className="mt-1 text-sm text-gray-600">{prize.description}</p>}
                    {isDrawn && prize.winner && (
                      <div className="mt-2 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        🏆 Winner: {prize.winner.ticket.user.isAnonymous ? "Anonymous" : prize.winner.ticket.user.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Draw Animation */}
          {isDrawn && raffle.draw && showDraw && (
            <DrawAnimation
              winners={raffle.draw.winners.map((w: { prize: { name: string; position: number }; ticket: { user: { name?: string; isAnonymous?: boolean } } }) => ({
                name: w.ticket.user.name ?? "Winner",
                prize: w.prize.name,
                position: w.prize.position,
                isAnonymous: w.ticket.user.isAnonymous,
              }))}
            />
          )}
          {isDrawn && raffle.draw && !showDraw && (
            <Button variant="outline" onClick={() => setShowDraw(true)} className="w-full">
              🎬 Watch Draw Animation
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Purchase card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enter this Raffle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Ticket price</span>
                <span className="text-lg font-bold text-blue-600">{formatZAR(raffle.ticketPrice)}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Quantity</span>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold text-blue-700">{formatZAR(Number(raffle.ticketPrice) * quantity)}</span>
              </div>
              {isActive ? (
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={purchase} disabled={purchasing}>
                  <Ticket className="mr-2 h-4 w-4" />
                  {purchasing ? "Opening payment…" : session ? "Buy Tickets" : "Sign in to Buy"}
                </Button>
              ) : (
                <Button disabled className="w-full">{isDrawn ? "Draw Complete" : "Not Available"}</Button>
              )}
              {raffle.maxPerPerson && (
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <Info className="h-3 w-3" /> Max {raffle.maxPerPerson} tickets per person
                </p>
              )}
              <p className="text-center text-xs text-gray-400">Secured by Paystack 🔒</p>
            </CardContent>
          </Card>

          {/* Draw details */}
          <Card>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Draw Date</p>
                  <p className="text-gray-500">{formatDate(raffle.drawDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Tickets Sold</p>
                  <p className="text-gray-500">{confirmedTickets} / min {raffle.minTickets}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Trophy className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Prizes</p>
                  <p className="text-gray-500">{raffle.prizes.length} winner{raffle.prizes.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share / QR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Share this raffle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center rounded-lg bg-white p-3">
                <QRCode value={shareUrl} size={140} />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}
              >
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
