// TEMPORARY DEBUG ENDPOINT — DELETE AFTER TESTING
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Can we reach the DB at all?
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr) {
      return NextResponse.json({ step: "db_query", error: String(dbErr) }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ step: "user_lookup", found: false, email });
    }

    // 2. Does the password match?
    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password ?? "");
    } catch (bcryptErr) {
      return NextResponse.json({ step: "bcrypt", error: String(bcryptErr) }, { status: 500 });
    }

    return NextResponse.json({
      step: "done",
      found: true,
      role: user.role,
      hasPassword: !!user.password,
      passwordHashPrefix: (user.password ?? "").substring(0, 7), // e.g. "$2b$10$"
      passwordValid: valid,
    });
  } catch (err) {
    return NextResponse.json({ step: "unknown", error: String(err) }, { status: 500 });
  }
}
