import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const approve = body.approve !== false;

  const organiser = await prisma.organiserProfile.update({
    where: { id },
    data: {
      isApproved: approve,
      kycStatus: approve ? "APPROVED" : "REJECTED",
      approvedAt: approve ? new Date() : null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(organiser);
}
