"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const defaultRole = sp.get("role") ?? "PARTICIPANT";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: defaultRole,
    businessName: "",
    businessType: "BUSINESS",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.role === "ORGANISER" && !form.businessName) { toast.error("Business name is required"); return; }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      const message = data.detail
        ? `${data.error}: ${data.detail}`
        : (data.error ?? "Registration failed");
      toast.error(message, { duration: 8000 });
      return;
    }

    // Auto sign in
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.error("Registered but couldn't sign in automatically. Please log in.");
      router.push("/login");
      return;
    }

    toast.success("Account created!");
    router.push(form.role === "ORGANISER" ? "/organiser/dashboard" : "/dashboard");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-gray-500">Join Raffiela and start winning</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Get started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>I want to…</Label>
                <Select value={form.role} onValueChange={(v) => set("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARTICIPANT">🎟️ Enter raffles (Participant)</SelectItem>
                    <SelectItem value="ORGANISER">🏆 Run raffles (Organiser)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Smith" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} required />
              </div>

              {form.role === "ORGANISER" && (
                <>
                  <div>
                    <Label htmlFor="businessName">Organisation Name</Label>
                    <Input id="businessName" placeholder="Acme Charity Trust" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required />
                  </div>
                  <div>
                    <Label>Organisation Type</Label>
                    <Select value={form.businessType} onValueChange={(v) => set("businessType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                        <SelectItem value="CHARITY">Charity / NPO</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    ⚠️ Organiser accounts require admin approval before you can create raffles. You&apos;ll be notified by email once approved.
                  </div>
                </>
              )}

              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>,{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
                our binding arbitration clause.
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
