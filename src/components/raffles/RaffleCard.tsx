"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatZAR, formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket, Star, Trophy } from "lucide-react";
import type { RaffleWithDetails } from "@/types";
import { useEffect, useState } from "react";

interface Props {
  raffle: RaffleWithDetails;
}

function Countdown({ drawDate }: { drawDate: Date }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(drawDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [drawDate]);

  return (
    <div className="flex gap-1 text-xs">
      {[["d", time.d], ["h", time.h], ["m", time.m], ["s", time.s]].map(([label, val]) => (
        <span key={label} className="flex flex-col items-center rounded bg-blue-50 px-1.5 py-0.5 font-mono">
          <span className="font-bold text-blue-700">{String(val).padStart(2, "0")}</span>
          <span className="text-gray-400 text-[9px]">{label}</span>
        </span>
      ))}
    </div>
  );
}

export default function RaffleCard({ raffle }: Props) {
  const firstPrizeImage = raffle.prizes[0]?.images[0]?.url ?? raffle.coverImage;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
        {firstPrizeImage ? (
          <img
            src={firstPrizeImage}
            alt={raffle.prizes[0]?.name ?? raffle.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Trophy className="h-16 w-16 text-blue-300" />
          </div>
        )}
        {raffle.isFeatured && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-white shadow">
            <Star className="h-3 w-3" /> Featured
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge variant="secondary" className="bg-white/90 text-xs font-medium">
            {formatZAR(raffle.ticketPrice)} / ticket
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category + Region */}
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          {raffle.category && <span className="rounded bg-gray-100 px-2 py-0.5">{raffle.category}</span>}
          {raffle.region && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {raffle.region}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
          {raffle.title}
        </h3>

        {/* Organiser */}
        <p className="mb-3 text-xs text-gray-500">
          by <span className="font-medium">{raffle.organiser.businessName}</span>
        </p>

        {/* Prizes */}
        <div className="mb-3 space-y-1">
          {raffle.prizes.slice(0, 2).map((prize) => (
            <div key={prize.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {prize.position}
              </span>
              <span className="line-clamp-1">{prize.name}</span>
              {prize.value && <span className="ml-auto text-gray-400">{formatZAR(prize.value)}</span>}
            </div>
          ))}
          {raffle.prizes.length > 2 && (
            <p className="text-xs text-gray-400">+{raffle.prizes.length - 2} more prizes</p>
          )}
        </div>

        {/* Countdown */}
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" /> Draw: {formatDate(raffle.drawDate)}
          </div>
          <Countdown drawDate={raffle.drawDate} />
        </div>

        {/* Tickets sold */}
        <div className="mb-4 flex items-center gap-1 text-xs text-gray-500">
          <Ticket className="h-3 w-3" />
          <span>{raffle._count.tickets} ticket{raffle._count.tickets !== 1 ? "s" : ""} sold</span>
          {raffle.minTickets > 0 && (
            <span className="text-gray-400">/ min {raffle.minTickets}</span>
          )}
        </div>

        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
          <Link href={`/raffles/${raffle.slug}`}>Enter Raffle</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
