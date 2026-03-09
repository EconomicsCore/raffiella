"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatZAR, formatDate } from "@/lib/utils";
import { ChevronLeft, Ticket, Users, Trophy, Copy, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

export default function OrganiserRaffleDetail() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/raffles/${id}`)
      .then((r) => r.json())
      .then((d) => { setRaffle(d); setLoading(false); });
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const res = await fetch(`/api/raffles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRaffle((r: typeof raffle) => ({ ...r, status: updated.status }));
      toast.success(`Raffle ${status === "ACTIVE" ? "activated" : "updated"}`);
    } else {
      toast.error("Failed to update");
    }
    setUpdating(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/raffles/${raffle.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="container mx-auto max-w-5xl px-4 py-12 animate-pulse"><div className="h-8 w-1/2 rounded bg-gray-200 mb-4" /><div className="h-64 rounded-xl bg-gray-200" /></div>;
  if (!raffle || raffle.error) return <div className="p-8 text-center text-gray-500">Raffle not found</div>;

  const confirmedTickets = raffle._count?.tickets ?? 0;
  const revenue = confirmedTickets * Number(raffle.ticketPrice);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/raffles/${raffle.slug}`;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link href="/organiser/dashboard" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ChevronLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{raffle.title}</h1>
          <div className="mt-2 flex gap-2">
            <Badge className={{ DRAFT: "bg-gray-100 text-gray-600", ACTIVE: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-600", DRAWN: "bg-purple-100 text-purple-700" }[raffle.status as string] ?? ""}>
              {raffle.status}
            </Badge>
            {raffle.isPublic && <Badge variant="outline">Public</Badge>}
            {raffle.isFeatured && <Badge className="bg-amber-100 text-amber-700">⭐ Featured</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {raffle.status === "DRAFT" && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus("ACTIVE")} disabled={updating}>
              Activate Raffle
            </Button>
          )}
          {raffle.status === "ACTIVE" && (
            <Button variant="outline" className="text-red-500 border-red-200" onClick={() => updateStatus("CANCELLED")} disabled={updating}>
              Cancel Raffle
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/raffles/${raffle.slug}`} target="_blank">View Public Page</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Tickets Sold", value: confirmedTickets, icon: <Ticket className="h-5 w-5 text-blue-500" />, sub: `min ${raffle.minTickets}` },
          { label: "Gross Revenue", value: formatZAR(revenue), icon: <Trophy className="h-5 w-5 text-emerald-500" />, sub: `net ~${formatZAR(revenue * 0.95)}` },
          { label: "Draw Date", value: formatDate(raffle.drawDate), icon: <Users className="h-5 w-5 text-purple-500" />, sub: raffle.prizes.length + " prizes" },
        ].map(({ label, value, icon, sub }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className="font-bold leading-tight">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Prizes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Prizes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {raffle.prizes.map((prize: { id: string; position: number; name: string; description?: string; value?: number }) => (
                  <div key={prize.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{prize.position}</span>
                    <div>
                      <p className="font-medium text-sm">{prize.name}</p>
                      {prize.description && <p className="text-xs text-gray-500">{prize.description}</p>}
                    </div>
                    {prize.value && <span className="ml-auto text-sm font-medium text-gray-600">{formatZAR(prize.value)}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ticket Holders ({confirmedTickets})</CardTitle></CardHeader>
            <CardContent>
              {(!raffle.tickets || raffle.tickets.length === 0) ? (
                <p className="py-6 text-center text-sm text-gray-400">No tickets sold yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {raffle.tickets.filter((t: { status: string }) => t.status === "CONFIRMED").map((ticket: { id: string; user: { name?: string; isAnonymous?: boolean; email?: string }; quantity: number; totalAmount: number; createdAt: string }) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.user.isAnonymous ? "Anonymous" : (ticket.user.name ?? ticket.user.email)}</TableCell>
                        <TableCell>{ticket.quantity}</TableCell>
                        <TableCell>{formatZAR(ticket.totalAmount)}</TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Share sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Share Your Raffle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center rounded-lg bg-gray-50 p-4">
                <QRCode value={shareUrl} size={150} />
              </div>
              <Button variant="outline" className="w-full" onClick={copyLink}>
                {copied ? <><Check className="mr-2 h-4 w-4 text-green-500" /> Copied!</> : <><Copy className="mr-2 h-4 w-4" /> Copy Link</>}
              </Button>
              <p className="text-xs text-gray-400 text-center break-all">{shareUrl}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Raffle Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Ticket Price", formatZAR(raffle.ticketPrice)],
                ["Min Tickets", raffle.minTickets],
                ["Max Per Person", raffle.maxPerPerson ?? "Unlimited"],
                ["Category", raffle.category ?? "—"],
                ["Region", raffle.region ?? "—"],
                ["Visibility", raffle.isPublic ? "Public" : "Private"],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
