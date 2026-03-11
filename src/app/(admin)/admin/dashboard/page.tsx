import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatZAR, formatDate } from "@/lib/utils";
import { Users, Trophy, DollarSign, AlertTriangle, Shield } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  let pendingOrganisers: Awaited<ReturnType<typeof prisma.organiserProfile.findMany>> = [];
  let allOrganisers:     Awaited<ReturnType<typeof prisma.organiserProfile.findMany>> = [];
  let allRaffles:        Awaited<ReturnType<typeof prisma.raffle.findMany>>           = [];
  let disputes:          Awaited<ReturnType<typeof prisma.dispute.findMany>>          = [];

  try {
    [pendingOrganisers, allOrganisers, allRaffles, disputes] = await Promise.all([
      prisma.organiserProfile.findMany({
        where: { isApproved: false },
        include: { user: { select: { name: true, email: true, createdAt: true } }, _count: { select: { raffles: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organiserProfile.findMany({
        include: { user: { select: { name: true, email: true } }, _count: { select: { raffles: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.raffle.findMany({
        include: {
          organiser: { select: { businessName: true } },
          _count: { select: { tickets: { where: { status: "CONFIRMED" } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.dispute.findMany({
        where: { status: { in: ["OPEN", "INVESTIGATING"] } },
        include: { raffle: { select: { title: true } }, raisedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
  } catch (err) {
    console.error("[admin] dashboard DB error:", err);
  }

  const totalRevenue = allRaffles.reduce((s, r) => s + r._count.tickets * Number(r.ticketPrice), 0);
  const platformRevenue = totalRevenue * 0.05;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform management overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Pending Approvals", value: pendingOrganisers.length, icon: <Users className="h-5 w-5 text-amber-500" />, color: pendingOrganisers.length > 0 ? "border-amber-300" : "" },
          { label: "Total Organisers", value: allOrganisers.length, icon: <Users className="h-5 w-5 text-blue-500" /> },
          { label: "Active Raffles", value: allRaffles.filter((r) => r.status === "ACTIVE").length, icon: <Trophy className="h-5 w-5 text-green-500" /> },
          { label: "Platform Revenue (est.)", value: formatZAR(platformRevenue), icon: <DollarSign className="h-5 w-5 text-emerald-500" /> },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} className={color}>
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

      <Tabs defaultValue="approvals">
        <TabsList className="mb-6">
          <TabsTrigger value="approvals">
            Approvals {pendingOrganisers.length > 0 && <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingOrganisers.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="organisers">Organisers ({allOrganisers.length})</TabsTrigger>
          <TabsTrigger value="raffles">Raffles ({allRaffles.length})</TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes {disputes.length > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{disputes.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Pending Organiser Approvals</CardTitle></CardHeader>
            <CardContent>
              {pendingOrganisers.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No pending approvals</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrganisers.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <p className="font-medium">{org.businessName}</p>
                          <p className="text-xs text-gray-500">{org.user.email}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{org.businessType}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(org.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={{ PENDING: "bg-gray-100 text-gray-600", SUBMITTED: "bg-blue-100 text-blue-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-600" }[org.kycStatus] ?? ""}>
                            {org.kycStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ApproveButton id={org.id} approve={true} />
                            <ApproveButton id={org.id} approve={false} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Organisers */}
        <TabsContent value="organisers">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raffles</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrganisers.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <p className="font-medium">{org.businessName}</p>
                        <p className="text-xs text-gray-500">{org.user.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{org.businessType}</Badge></TableCell>
                      <TableCell>
                        <Badge className={org.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                          {org.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{org._count.raffles}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(org.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raffles */}
        <TabsContent value="raffles">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raffle</TableHead>
                    <TableHead>Organiser</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRaffles.map((raffle) => (
                    <TableRow key={raffle.id}>
                      <TableCell>
                        <p className="font-medium line-clamp-1">{raffle.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(raffle.drawDate)}</p>
                      </TableCell>
                      <TableCell className="text-sm">{raffle.organiser.businessName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{raffle.status}</Badge>
                      </TableCell>
                      <TableCell>{raffle._count.tickets}</TableCell>
                      <TableCell>{formatZAR(raffle._count.tickets * Number(raffle.ticketPrice))}</TableCell>
                      <TableCell>
                        <FeatureButton raffleId={raffle.id} isFeatured={raffle.isFeatured} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/raffles/${raffle.slug}`} target="_blank">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes */}
        <TabsContent value="disputes">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Open Disputes</CardTitle></CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No open disputes</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Raffle</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <p className="font-medium">{d.subject}</p>
                          <p className="text-xs text-gray-500">{d.raffle.title}</p>
                        </TableCell>
                        <TableCell className="text-sm">{d.raisedBy.name ?? d.raisedBy.email}</TableCell>
                        <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(d.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApproveButton({ id, approve }: { id: string; approve: boolean }) {
  return (
    <form action={async () => {
      "use server";
      const { prisma: db } = await import("@/lib/prisma");
      await db.organiserProfile.update({
        where: { id },
        data: { isApproved: approve, kycStatus: approve ? "APPROVED" : "REJECTED", approvedAt: approve ? new Date() : null },
      });
    }}>
      <Button
        type="submit"
        size="sm"
        variant={approve ? "default" : "outline"}
        className={approve ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "text-red-500 border-red-200 h-7 text-xs"}
      >
        {approve ? "Approve" : "Reject"}
      </Button>
    </form>
  );
}

function FeatureButton({ raffleId, isFeatured }: { raffleId: string; isFeatured: boolean }) {
  return (
    <form action={async () => {
      "use server";
      const { prisma: db } = await import("@/lib/prisma");
      await db.raffle.update({ where: { id: raffleId }, data: { isFeatured: !isFeatured } });
    }}>
      <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
        {isFeatured ? "⭐ Unfeature" : "☆ Feature"}
      </Button>
    </form>
  );
}
