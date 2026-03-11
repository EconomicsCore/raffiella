import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["PARTICIPANT", "ORGANISER"]),
  // Organiser-specific fields
  businessName: z.string().optional(),
  businessType: z.enum(["BUSINESS", "CHARITY", "INDIVIDUAL"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user first
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });

    // Create organiser profile in a separate query (avoids nested transaction issues with pooler)
    if (data.role === "ORGANISER" && data.businessName && data.businessType) {
      await prisma.organiserProfile.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          businessType: data.businessType,
        },
      });
    }

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    // Log and surface enough detail to diagnose DB / config issues
    const message = err instanceof Error ? err.message : String(err);
    console.error("[register] error:", message);
    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 }
    );
  }
}
