import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["supabase.co", "res.cloudinary.com", "images.unsplash.com"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "www.raffiella.org", "raffiella.org"],
    },
  },
};

export default nextConfig;
