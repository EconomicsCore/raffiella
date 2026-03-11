"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RAFFLE_CATEGORIES, SA_REGIONS } from "@/lib/utils";
import { Plus, Trash2, ChevronRight, ChevronLeft, Trophy, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  ticketPrice: z.coerce.number().positive("Must be positive"),
  minTickets: z.coerce.number().int().positive("Must be at least 1"),
  // preprocess empty string → undefined so the optional() check can pass
  maxPerPerson: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1, "Must be at least 1").optional()
  ),
  drawDate: z.string().min(1, "Required"),
  drawTime: z.string().min(1, "Required"),
  isPublic: z.boolean().default(false),
  category: z.string().optional(),
  region: z.string().optional(),
  coverImage: z.string().optional(),
  prizes: z.array(z.object({
    position: z.number(),
    name: z.string().min(2, "Prize name required"),
    description: z.string().optional(),
    // preprocess empty string → undefined for optional prize value
    value: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().optional()
    ),
    showValue: z.boolean().default(true),
  })).min(1, "At least one prize required"),
});

type FormData = z.infer<typeof schema>;

const STEPS = ["Basic Info", "Prizes", "Settings", "Review"];

export default function CreateRaffleForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prizeImages, setPrizeImages] = useState<(string | null)[]>([null]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormData>({ resolver: zodResolver(schema) as any,
    defaultValues: {
      isPublic: true,
      prizes: [{ position: 1, name: "", description: "", value: undefined, showValue: true }],
    },
  });

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setPrizeImages((prev) => { const next = [...prev]; next[index] = data.url; return next; });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingIndex(null);
    }
  };

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "prizes" });
  const values = form.watch();

  const next = async () => {
    const fieldsToValidate: (keyof FormData)[][] = [
      ["title", "description"],
      ["prizes"],
      ["ticketPrice", "minTickets", "drawDate", "drawTime"],
    ];
    const valid = await form.trigger(fieldsToValidate[step] as (keyof FormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const drawDate = new Date(`${data.drawDate}T${data.drawTime}`).toISOString();
      const res = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          drawDate,
          prizes: data.prizes.map((p, i) => ({
            ...p,
            position: i + 1,
            images: prizeImages[i] ? [{ url: prizeImages[i], order: 0 }] : [],
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create raffle");
      }
      const raffle = await res.json();
      toast.success("Raffle created! Activate it from your dashboard.");
      router.push(`/organiser/raffles/${raffle.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors
              ${i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm ${i === step ? "font-semibold text-blue-600" : "text-gray-400"} hidden sm:block`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={`mx-3 h-0.5 w-8 sm:w-16 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={form.handleSubmit(onSubmit as any, (errors) => {
        console.error("Form validation errors:", errors);
        const firstError = Object.values(errors).flatMap((e: any) =>
          Array.isArray(e) ? e.flatMap((p: any) => Object.values(p ?? {})) : [e]
        ).find((e: any) => e?.message);
        toast.error(firstError?.message ?? "Please check all fields are filled in correctly");
      })}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Raffle Title *</Label>
                <Input id="title" placeholder="e.g. Win a Brand New iPhone 16 Pro" {...form.register("title")} />
                {form.formState.errors.title && <p className="mt-1 text-xs text-red-500">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" rows={4} placeholder="Describe the raffle, prize details, and any terms..." {...form.register("description")} />
                {form.formState.errors.description && <p className="mt-1 text-xs text-red-500">{form.formState.errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={values.category} onValueChange={(v) => form.setValue("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{RAFFLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Region</Label>
                  <Select value={values.region} onValueChange={(v) => form.setValue("region", v)}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>{SA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Prizes */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Prizes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, i) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <Trophy className="mr-1 h-3 w-3" />
                      {["1st", "2nd", "3rd", `${i + 1}th`][i] ?? `${i + 1}th`} Prize
                    </Badge>
                    {i > 0 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-7 w-7 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {/* Prize image upload */}
                  <div>
                    <Label>Prize Image</Label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[i] = el; }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f); }}
                    />
                    {prizeImages[i] ? (
                      <div className="relative mt-1 inline-block">
                        <img src={prizeImages[i]!} alt="Prize" className="h-24 w-24 rounded-lg object-cover border" />
                        <button
                          type="button"
                          onClick={() => setPrizeImages((prev) => { const next = [...prev]; next[i] = null; return next; })}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        disabled={uploadingIndex === i}
                        className="mt-1 flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingIndex === i ? "Uploading…" : "Upload image"}
                      </button>
                    )}
                  </div>

                  <div>
                    <Label>Prize Name *</Label>
                    <Input placeholder="e.g. iPhone 16 Pro 256GB" {...form.register(`prizes.${i}.name`)} />
                    {form.formState.errors.prizes?.[i]?.name && (
                      <p className="mt-1 text-xs text-red-500">{form.formState.errors.prizes[i]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea rows={2} placeholder="Optional prize details..." {...form.register(`prizes.${i}.description`)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Estimated Value (ZAR)</Label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" className="rounded" {...form.register(`prizes.${i}.showValue`)} defaultChecked />
                        Show value publicly
                      </label>
                    </div>
                    <Input type="number" placeholder="0.00" {...form.register(`prizes.${i}.value`)} />
                  </div>
                </div>
              ))}
              {fields.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    append({ position: fields.length + 1, name: "", description: "", value: undefined, showValue: true });
                    setPrizeImages((prev) => [...prev, null]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Prize
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Tickets & Schedule */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Tickets & Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticketPrice">Ticket Price (ZAR) *</Label>
                  <Input id="ticketPrice" type="number" step="0.01" placeholder="50.00" {...form.register("ticketPrice")} />
                  {form.formState.errors.ticketPrice && <p className="mt-1 text-xs text-red-500">{form.formState.errors.ticketPrice.message}</p>}
                </div>
                <div>
                  <Label htmlFor="minTickets">Minimum Tickets to Sell *</Label>
                  <Input id="minTickets" type="number" placeholder="50" {...form.register("minTickets")} />
                  {form.formState.errors.minTickets && <p className="mt-1 text-xs text-red-500">{form.formState.errors.minTickets.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="maxPerPerson">Max Tickets Per Person (optional)</Label>
                <Input id="maxPerPerson" type="number" placeholder="Leave blank for unlimited" {...form.register("maxPerPerson")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drawDate">Draw Date *</Label>
                  <Input id="drawDate" type="date" {...form.register("drawDate")} />
                  {form.formState.errors.drawDate && <p className="mt-1 text-xs text-red-500">{form.formState.errors.drawDate.message}</p>}
                </div>
                <div>
                  <Label htmlFor="drawTime">Draw Time *</Label>
                  <Input id="drawTime" type="time" {...form.register("drawTime")} />
                  {form.formState.errors.drawTime && <p className="mt-1 text-xs text-red-500">{form.formState.errors.drawTime.message}</p>}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" {...form.register("isPublic")} />
                  <span className="font-medium">List in public directory</span>
                </Label>
                <p className="mt-1 pl-6 text-xs text-gray-500">
                  If unchecked, your raffle will only be accessible via direct link or QR code.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Review & Create</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{values.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Ticket Price</span><span className="font-medium">R {values.ticketPrice}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Min Tickets</span><span className="font-medium">{values.minTickets}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Draw Date</span><span className="font-medium">{values.drawDate} at {values.drawTime}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prizes</span><span className="font-medium">{values.prizes?.length ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Visibility</span><span className="font-medium">{values.isPublic ? "Public" : "Private (link only)"}</span></div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                ⚠️ Your raffle will be saved as a <strong>Draft</strong> and will only go live after you activate it from your dashboard. Make sure you have the required legal permits under the South African Lotteries Act.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} className="bg-blue-600 hover:bg-blue-700">
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Creating…" : "Create Raffle"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
