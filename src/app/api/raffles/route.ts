import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") || "drawDate";
  const featured = searchParams.get("featured");
  const organiserId = searchParams.get("organiserId");

  const where: Record<string, unknown> = {
    isPublic: true,
    status: { in: ["ACTIVE", "DRAFT"] },
  };

  if (status === "ACTIVE") where.status = "ACTIVE";
  if (status === "UPCOMING") where.status = "DRAFT";
  if (category) where.category = category;
  if (region) where.region = region;
  if (featured === "true") where.isFeatured = true;
  if (organiserId) {
    where.isPublic = undefined;
    where.organiserId = organiserId;
    where.status = undefined;
  }

  const orderBy: Record<string, string> = {};
  if (sort === "price_asc") orderBy.ticketPrice = "asc";
  else if (sort === "price_desc") orderBy.ticketPrice = "desc";
  else if (sort === "newest") orderBy.createdAt = "desc";
  else orderBy.drawDate = "asc";

  const raffles = await prisma.raffle.findMany({
    where,
    orderBy,
    include: {
      organiser: {
        include: { user: { select: { name: true, image: true } } },
      },
      prizes: {
        orderBy: { position: "asc" },
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
      },
      _count: { select: { tickets: { where: { status: "CONFIRMED" } } } },
    },
  });

  return NextResponse.json(raffles);
}

const createRaffleSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  ticketPrice: z.number().positive(),
  minTickets: z.number().int().positive(),
  maxPerPerson: z.number().int().positive().nullable().optional(),
  drawDate: z.string(),
  isPublic: z.boolean().default(false),
  category: z.string().optional(),
  region: z.string().optional(),
  coverImage: z.string().optional(),
  prizes: z.array(
    z.object({
      position: z.number().int().positive(),
      name: z.string().min(2),
      description: z.string().optional(),
      value: z.number().nullable().optional(),
      showValue: z.boolean().default(true),
      images: z.array(z.object({ url: z.string(), order: z.number() })).optional(),
    })
  ).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ORGANISER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createRaffleSchema.parse(body);

    const organiser = await prisma.organiserProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organiser || !organiser.isApproved) {
      return NextResponse.json({ error: "Organiser not approved" }, { status: 403 });
    }

    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.raffle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const raffle = await prisma.raffle.create({
      data: {
        organiserId: organiser.id,
        title: data.title,
        description: data.description,
        ticketPrice: data.ticketPrice,
        minTickets: data.minTickets,
        maxPerPerson: data.maxPerPerson ?? null,
        drawDate: new Date(data.drawDate),
        isPublic: data.isPublic,
        category: data.category,
        region: data.region,
        coverImage: data.coverImage,
        slug,
        status: "DRAFT",
        prizes: {
          create: data.prizes.map((p) => ({
            position: p.position,
            name: p.name,
            description: p.description,
            value: p.value,
            showValue: p.showValue ?? true,
            images: p.images?.length
              ? { create: p.images }
              : undefined,
          })),
        },
      },
      include: { prizes: { include: { images: true } } },
    });

    return NextResponse.json(raffle, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
