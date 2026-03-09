import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  const organisers = await prisma.organiserProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      _count: { select: { raffles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(organisers);
}
