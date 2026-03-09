"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RAFFLE_CATEGORIES, SA_REGIONS } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

export default function RaffleFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const set = (key: string, val: string) => {
    const params = new URLSearchParams(sp.toString());
    if (val && val !== "all") params.set(key, val);
    else params.delete(key);
    router.push(`/raffles?${params.toString()}`);
  };

  const clear = () => router.push("/raffles");
  const hasFilters = sp.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </div>

      <Select value={sp.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="w-[140px] text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Raffles</SelectItem>
          <SelectItem value="ACTIVE">Live Now</SelectItem>
          <SelectItem value="UPCOMING">Upcoming</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sp.get("category") ?? "all"} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="w-[160px] text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {RAFFLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={sp.get("region") ?? "all"} onValueChange={(v) => set("region", v)}>
        <SelectTrigger className="w-[160px] text-sm">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {SA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={sp.get("sort") ?? "drawDate"} onValueChange={(v) => set("sort", v)}>
        <SelectTrigger className="w-[160px] text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="drawDate">Draw Date (Soonest)</SelectItem>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="price_asc">Price: Low to High</SelectItem>
          <SelectItem value="price_desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="text-gray-500 hover:text-red-500">
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
