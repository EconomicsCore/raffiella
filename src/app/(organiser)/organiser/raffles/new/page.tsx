import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateRaffleForm from "@/components/raffles/CreateRaffleForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewRafflePage() {
  const session = await auth();
  if (!session || session.user.role !== "ORGANISER") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let organiser: any = null;
  try {
    organiser = await prisma.organiserProfile.findUnique({ where: { userId: session.user.id } });
  } catch (err) {
    console.error("New raffle page DB error:", err);
  }
  if (!organiser?.isApproved) redirect("/organiser/dashboard");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/organiser/dashboard" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Create a New Raffle</h1>
      <CreateRaffleForm />
    </div>
  );
}
