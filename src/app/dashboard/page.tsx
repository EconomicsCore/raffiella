import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatZAR, formatDate } from "@/lib/utils";
import { Ticket, Trophy, Clock } from "lucide-react";

export default async function ParticipantDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ORGANISER") redirect("/organiser/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tickets: any[] = [];
  try {
    tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
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
  } catch (err) {
    console.error("Dashboard DB error:", err);
  }

  const active = tickets.filter((t) => t.status === "CONFIRMED" && ["ACTIVE", "DRAFT"].includes(t.raffle.status));
  const won = tickets.filter((t) => t.winners.length > 0);
  const past = tickets.filter((t) => ["DRAWN", "CANCELLED"].includes(t.raffle.status));

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-gray-500">Welcome back, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Active Entries", value: active.length, icon: <Ticket className="h-5 w-5 text-blue-500" /> },
          { label: "Raffles Won", value: won.length, icon: <Trophy className="h-5 w-5 text-amber-500" /> },
          { label: "Total Entered", value: tickets.length, icon: <Clock className="h-5 w-5 text-gray-400" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-5">
              {icon}
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="won">Won 🏆 ({won.length})</TabsTrigger>
          <TabsTrigger value="past">History ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {active.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-500">No active entries yet</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700"><Link href="/raffles">Browse Raffles</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="won">
          {won.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No wins yet — keep entering!</div>
          ) : (
            <div className="space-y-3">
              {won.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <div>
                      <p className="font-semibold">{ticket.raffle.title}</p>
                      <p className="text-sm text-amber-700">
                        Won: {ticket.winners.map((w: any) => w.prize.name).join(", ")}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-amber-100 text-amber-700">Winner!</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No history yet</div>
          ) : (
            <div className="space-y-3">
              {past.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} showStatus />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TicketRow({ ticket, showStatus }: { ticket: any; showStatus?: boolean }) {
  const img = ticket.raffle.prizes[0]?.images[0]?.url;
  return (
    <Link href={`/raffles/${ticket.raffle.slug}`}>
      <div className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow-md transition-shadow cursor-pointer">
        {img ? (
          <img src={img} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
            <Trophy className="h-6 w-6 text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{ticket.raffle.title}</p>
          <p className="text-xs text-gray-500">{ticket.raffle.organiser.businessName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""} · {formatZAR(ticket.totalAmount)} · {formatDate(ticket.createdAt)}
          </p>
        </div>
        {showStatus && (
          <Badge variant="outline" className={ticket.raffle.status === "CANCELLED" ? "text-red-500 border-red-200" : "text-gray-500"}>
            {ticket.raffle.status}
          </Badge>
        )}
        {!showStatus && (
          <div className="text-right text-xs text-gray-400">
            <p>Draw</p>
            <p className="font-medium text-gray-600">{formatDate(ticket.raffle.drawDate)}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
