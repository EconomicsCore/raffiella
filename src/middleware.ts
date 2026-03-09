import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always accessible
  const publicRoutes = ["/", "/login", "/register", "/raffles"];
  const isPublicRaffle = pathname.startsWith("/raffles/");
  const isPublic = publicRoutes.includes(pathname) || isPublicRaffle || pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  // Auth required from here
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Organiser routes
  if (pathname.startsWith("/organiser") && role !== "ORGANISER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
