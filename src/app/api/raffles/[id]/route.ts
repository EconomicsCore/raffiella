import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const raffle = await prisma.raffle.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      organiser: {
        include: { user: { select: { name: true, image: true } } },
      },
      prizes: {
        orderBy: { position: "asc" },
        include: { images: { orderBy: { order: "asc" } } },
      },
      draw: { include: { winners: { include: { prize: true, ticket: { include: { user: { select: { name: true, isAnonymous: true } } } } } } } },
      _count: { select: { tickets: { where: { status: "CONFIRMED" } } } },
    },
  });

  if (!raffle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(raffle);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const raffle = await prisma.raffle.findUnique({ where: { id }, include: { organiser: true } });
  if (!raffle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only organiser (owner) or admin can update
  const isOwner = raffle.organiser.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.raffle.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.isFeatured !== undefined && isAdmin && { isFeatured: body.isFeatured }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
    },
  });

  return NextResponse.json(updated);
}
