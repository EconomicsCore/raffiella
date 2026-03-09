import Link from "next/link";
import { Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <Trophy className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-blue-600">Raffiela</span>
            </Link>
            <p className="text-sm text-gray-500">South Africa&apos;s trusted digital raffle platform.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/raffles" className="hover:text-blue-600 transition-colors">Browse Raffles</Link></li>
              <li><Link href="/register?role=ORGANISER" className="hover:text-blue-600 transition-colors">Run a Raffle</Link></li>
              <li><Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/disputes" className="hover:text-blue-600 transition-colors">Dispute Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Raffiela. All rights reserved. | Operated in compliance with South African law.
        </div>
      </div>
    </footer>
  );
}
