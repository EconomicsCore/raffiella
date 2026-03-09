"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket, Trophy, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const role = session?.user?.role;

  const dashboardHref =
    role === "ADMIN" ? "/admin/dashboard" :
    role === "ORGANISER" ? "/organiser/dashboard" :
    "/dashboard";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-600">Raffiela</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/raffles" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Browse Raffles
          </Link>
          {!session && (
            <Link href="/register?role=ORGANISER" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Run a Raffle
            </Link>
          )}
          {role === "ORGANISER" && (
            <Link href="/organiser/raffles/new" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              New Raffle
            </Link>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image ?? ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {role}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref} className="cursor-pointer">
                    <Ticket className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                {role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/raffles" className="text-sm font-medium" onClick={() => setOpen(false)}>Browse Raffles</Link>
            {session ? (
              <>
                <Link href={dashboardHref} className="text-sm font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                <button className="text-left text-sm font-medium text-red-600" onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false); }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/register" className="text-sm font-medium text-blue-600" onClick={() => setOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
