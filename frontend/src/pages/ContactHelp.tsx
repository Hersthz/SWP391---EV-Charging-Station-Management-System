// src/pages/ContactHelp.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

import { toast } from "../hooks/use-toast";

import {
  ArrowLeft,
  LifeBuoy,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Clock,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type TicketForm = {
  subject: string;
  category: string;
  urgency: "low" | "normal" | "high" | "critical";
  description: string;
  attachment?: File | null;
};

const initialForm: TicketForm = {
  subject: "",
  category: "",
  urgency: "normal",
  description: "",
  attachment: undefined,
};

export default function ContactHelp() {
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(
    () => form.subject.trim().length >= 6 && form.category && form.description.trim().length >= 12,
    [form]
  );

  const submitMock = async () => {
    if (!isValid) {
      toast({
        title: "Missing information",
        description: "Subject must be ≥ 6 characters and Description ≥ 12 characters.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    const tid = "TCK-" + Math.floor(100000 + Math.random() * 899999);
    toast({ title: "Ticket created", description: `Your ticket ID is ${tid}. Our 24/7 team will reply soon.` });
    setForm(initialForm);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header — same vibe as Wallet/Profile */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="hover:bg-sky-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Support & Help
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2 gap-2">
            24/7 • SLA ≥ 99.5%
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero — compact like Wallet header */}
        <div className="rounded-2xl border bg-gradient-to-b from-sky-50 to-emerald-50 px-5 py-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/80 p-2 shadow-electric">
              <LifeBuoy className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                24/7 Support — We’re here to help
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Reach the <b>ChargeStation</b> team anytime. Priority handling for urgent tickets.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white">24/7</Badge>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  SLA ≥ 99.5%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 2-column layout like Wallet/Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: quick channels */}
          <div className="space-y-8">
            <Card className="border-sky-100 bg-white shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  Live Chat
                </CardTitle>
                <CardDescription>Internal channel for Admin/Staff/Driver</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    ETA &lt; 5 min
                  </Badge>
                  <Badge variant="secondary">Priority 08:00–22:00</Badge>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                  onClick={() => toast({ title: "Mock", description: "Opening live chat…" })}
                >
                  Open Live Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-sky-100 bg-white shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  Hotline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">For urgent incidents</div>
                <div className="font-medium">
                  <a className="hover:underline" href="tel:+84888888888">
                    +84 88 888 88 88
                  </a>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="tel:+84888888888">Call now</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-sky-100 bg-white shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Non-urgent requests with logs/attachments
                </div>
                <div className="font-medium">
                  <a className="hover:underline" href="mailto:support@chargestation.io">
                    support@chargestation.io
                  </a>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:support@chargestation.io">Compose email</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: ticket form */}
          <div className="lg:col-span-2">
            <Card className="border-sky-100 bg-white shadow-card">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Create a support ticket
                </CardTitle>
                <CardDescription>Send your request to our 24/7 team</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitMock();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="e.g., Unable to pay with wallet"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment / Wallet</SelectItem>
                          <SelectItem value="booking">Booking / Timeslot</SelectItem>
                          <SelectItem value="charge">Charging Session</SelectItem>
                          <SelectItem value="account">Account / OTP</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select
                        value={form.urgency}
                        onValueChange={(v: TicketForm["urgency"]) =>
                          setForm((f) => ({ ...f, urgency: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Attachment (optional)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          onChange={(e) =>
                            setForm((f) => ({ ...f, attachment: e.target.files?.[0] ?? null }))
                          }
                        />
                        <Button type="button" variant="outline" className="gap-2" disabled>
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                      </div>
                      {form.attachment && (
                        <p className="text-xs text-muted-foreground">
                          File: <span className="font-medium">{form.attachment.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Detailed description</Label>
                    <Textarea
                      placeholder="Steps to reproduce, screenshots, error codes… The more details, the faster we resolve."
                      className="min-h-[110px]"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      ETA: Normal &lt; 2h • High &lt; 30m • Critical &lt; 15m
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Urgent incident? Call{" "}
                      <a className="underline" href="tel:+84888888888">
                        +84 88 888 88 88
                      </a>
                      .
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="ghost" onClick={() => setForm(initialForm)}>
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        className="gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                        disabled={!isValid || submitting}
                      >
                        {submitting ? (
                          <>
                            <Clock className="h-4 w-4 animate-pulse" /> Submitting…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Create ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Quick status — like Wallet quick stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                    { label: "API", status: "Operational", color: "emerald" },
                    { label: "Payments", status: "Degraded", color: "amber" },
                    { label: "Realtime", status: "Operational", color: "emerald" },
                ].map((s) => (
                    <div
                    key={s.label}
                    className="flex flex-col items-center justify-center rounded-xl border border-sky-100 bg-white py-4 shadow-sm hover:bg-sky-50/30 transition-all duration-150"
                    >
                    <span className="text-sm text-muted-foreground mb-1">{s.label}</span>
                    <Badge
                        className={`px-3 py-1 text-xs ${
                        s.color === "emerald"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                    >
                        {s.status}
                    </Badge>
                    </div>
                ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Compact FAQ */}
        <Card className="border-sky-100 bg-white shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Quick FAQ</CardTitle>
            <CardDescription>Common situations & tips</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <details className="rounded-lg p-3 border bg-gradient-card">
              <summary className="cursor-pointer font-medium">Didn’t receive OTP?</summary>
              <p className="mt-1 text-muted-foreground">
                Check inbox/spam, then try “Resend OTP” after 60s. If it still fails, call the Hotline for verification.
              </p>
            </details>
            <details className="rounded-lg p-3 border bg-gradient-card">
              <summary className="cursor-pointer font-medium">Can’t start a charging session?</summary>
              <p className="mt-1 text-muted-foreground">
                Re-scan the QR, check connectivity and wallet balance. If a pillar is busy, pick another pillar or time slot.
              </p>
            </details>
            <details className="rounded-lg p-3 border bg-gradient-card">
              <summary className="cursor-pointer font-medium">How do refunds work?</summary>
              <p className="mt-1 text-muted-foreground">
                Any unused deposit is automatically refunded to your wallet within ~2 minutes after session end.
              </p>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}