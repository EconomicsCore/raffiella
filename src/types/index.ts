import type { Role, RaffleStatus, BusinessType, KycStatus, TicketStatus, DisputeStatus } from "@prisma/client";

export type { Role, RaffleStatus, BusinessType, KycStatus, TicketStatus, DisputeStatus };

export interface RaffleWithDetails {
  id: string;
  title: string;
  description: string;
  ticketPrice: string | number;
  minTickets: number;
  maxPerPerson: number | null;
  drawDate: Date;
  status: RaffleStatus;
  isPublic: boolean;
  isFeatured: boolean;
  category: string | null;
  region: string | null;
  slug: string;
  coverImage: string | null;
  createdAt: Date;
  organiser: {
    id: string;
    businessName: string;
    businessType: BusinessType;
    user: { name: string | null; image: string | null };
  };
  prizes: {
    id: string;
    position: number;
    name: string;
    description: string | null;
    value: string | number | null;
    images: { url: string; order: number }[];
  }[];
  _count: {
    tickets: number;
  };
}
