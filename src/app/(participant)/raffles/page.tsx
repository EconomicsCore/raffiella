import { Suspense } from "react";
import RaffleFilters from "@/components/raffles/RaffleFilters";
import RaffleCard from "@/components/raffles/RaffleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import type { RaffleWithDetails } from "@/types";

async function getRaffles(searchParams: Record<string, string>) {
  const where: Record<string, unknown> = { isPublic: true };

  if (searchParams.status === "ACTIVE") where.status = "ACTIVE";
  else if (searchParams.status === "UPCOMING") where.status = "DRAFT";
  else where.status = { in: ["ACTIVE", "DRAFT"] };

  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.region) where.region = searchParams.region;
  if (searchParams.featured === "true") where.isFeatured = true;

  const orderBy: Record<string, string> = {};
  if (searchParams.sort === "price_asc") orderBy.ticketPrice = "asc";
  else if (searchParams.sort === "price_desc") orderBy.ticketPrice = "desc";
  else if (searchParams.sort === "newest") orderBy.createdAt = "desc";
  else orderBy.drawDate = "asc";

  return prisma.raffle.findMany({
    where,
    orderBy,
    include: {
      organiser: { include: { user: { select: { name: true, image: true } } } },
      prizes: { orderBy: { position: "asc" }, include: { images: { orderBy: { order: "asc" }, take: 1 } } },
      _count: { select: { tickets: { where: { status: "CONFIRMED" } } } },
    },
  }) as unknown as Promise<RaffleWithDetails[]>;
}

function RaffleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border bg-white">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function RafflesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const raffles = await getRaffles(params);

  const featured = raffles.filter((r) => r.isFeatured);
  const regular = raffles.filter((r) => !r.isFeatured);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Raffles</h1>
        <p className="mt-1 text-gray-500">Discover and enter raffles from across South Africa</p>
      </div>

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-xl" />}>
        <RaffleFilters />
      </Suspense>

      {raffles.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">🎟️</div>
          <h3 className="text-lg font-semibold text-gray-700">No raffles found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                ⭐ Featured Raffles
              </h2>
              <Suspense fallback={<RaffleGridSkeleton />}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((r) => <RaffleCard key={r.id} raffle={r} />)}
                </div>
              </Suspense>
            </div>
          )}
          <div className="mt-8">
            {featured.length > 0 && <h2 className="mb-4 text-lg font-semibold text-gray-900">All Raffles</h2>}
            <Suspense fallback={<RaffleGridSkeleton />}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regular.map((r) => <RaffleCard key={r.id} raffle={r} />)}
              </div>
            </Suspense>
          </div>
          <p className="mt-8 text-center text-sm text-gray-400">{raffles.length} raffle{raffles.length !== 1 ? "s" : ""} found</p>
        </>
      )}
    </div>
  );
}
