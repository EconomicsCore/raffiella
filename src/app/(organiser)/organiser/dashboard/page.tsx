import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatZAR, formatDate } from "@/lib/utils";
import { Plus, Ticket, DollarSign, Trophy, Clock, AlertCircle } from "lucide-react";


const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  DRAWN: "bg-purple-100 text-purple-700",
};

export default async function OrganiserDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let organiser: any = null;
  try {
    organiser = await prisma.organiserProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        raffles: {
          include: {
            _count: { select: { tickets: { where: { status: "CONFIRMED" } } } },
            prizes: { orderBy: { position: "asc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (err) {
    console.error("Organiser dashboard DB error:", err);
  }

  if (!organiser) redirect("/register?role=ORGANISER");

  // Stats
  const totalTickets = organiser.raffles.reduce((s: number, r: any) => s + r._count.tickets, 0);
  const totalRevenue = organiser.raffles.reduce((s: number, r: any) => {
    return s + r._count.tickets * Number(r.ticketPrice);
  }, 0);
  const activeCount = organiser.raffles.filter((r: any) => r.status === "ACTIVE").length;
  const platformFee = totalRevenue * 0.05;
  const netRevenue = totalRevenue - platformFee;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{organiser.businessName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={organiser.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
              {organiser.isApproved ? "✓ Approved" : "⏳ Pending Approval"}
            </Badge>
            <Badge variant="outline">{organiser.businessType}</Badge>
          </div>
        </div>
        {organiser.isApproved && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/organiser/raffles/new"><Plus className="mr-2 h-4 w-4" /> New Raffle</Link>
          </Button>
        )}
      </div>

      {!organiser.isApproved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Account pending approval</p>
            <p className="text-sm text-amber-700">Our team will review your application and notify you by email. Once approved, you can create raffles.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Active Raffles", value: activeCount, icon: <Trophy className="h-5 w-5 text-blue-500" /> },
          { label: "Total Tickets", value: totalTickets, icon: <Ticket className="h-5 w-5 text-green-500" /> },
          { label: "Gross Revenue", value: formatZAR(totalRevenue), icon: <DollarSign className="h-5 w-5 text-emerald-500" /> },
          { label: "Net Revenue (est.)", value: formatZAR(netRevenue), icon: <DollarSign className="h-5 w-5 text-purple-500" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-5">
              {icon}
              <div>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raffles table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Raffles</CardTitle>
          {organiser.isApproved && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/organiser/raffles/new"><Plus className="mr-1 h-3.5 w-3.5" /> New</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {organiser.raffles.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">No raffles yet. Create your first one!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raffle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Draw Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {organiser.raffles.map((raffle: any) => {
                  const revenue = raffle._count.tickets * Number(raffle.ticketPrice);
                  return (
                    <TableRow key={raffle.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900 line-clamp-1">{raffle.title}</p>
                        <p className="text-xs text-gray-400">{formatZAR(String(raffle.ticketPrice))} / ticket</p>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[raffle.status]}`}>
                          {raffle.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{raffle._count.tickets}</span>
                        <span className="text-xs text-gray-400"> / min {raffle.minTickets}</span>
                      </TableCell>
                      <TableCell className="font-medium">{formatZAR(revenue)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(raffle.drawDate)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/organiser/raffles/${raffle.id}`}>Manage</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
