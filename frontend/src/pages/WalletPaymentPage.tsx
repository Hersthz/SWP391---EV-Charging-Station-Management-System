// src/pages/WalletPaymentPage.tsx
import { useState } from "react";
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
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
  ArrowUpCircle,
  ArrowDownCircle,
  Battery,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  History,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

// ================= Mock data (giữ nguyên có thể thay bằng API sau) =================
const walletBalance = 450000; // VND

const transactions = [
  { id: 1, type: "DEBIT", amount: -75000, description: "Charging Session - Central Station", date: "2025-10-05 14:30", status: "COMPLETED", ref: "CHG-001234" },
  { id: 2, type: "CREDIT", amount: 200000, description: "Top-up via Bank Transfer", date: "2025-10-05 09:15", status: "COMPLETED", ref: "TOP-001233" },
  { id: 3, type: "HOLD", amount: -50000, description: "Deposit Hold - Downtown Station", date: "2025-10-04 18:20", status: "PENDING", ref: "HLD-001232" },
  { id: 4, type: "RELEASE", amount: 50000, description: "Deposit Released - Downtown Station", date: "2025-10-04 19:45", status: "COMPLETED", ref: "RLS-001232" },
  { id: 5, type: "DEBIT", amount: -50000, description: "No-show Fee - Airport Station", date: "2025-10-03 16:00", status: "COMPLETED", ref: "FEE-001231" },
  { id: 6, type: "CREDIT", amount: 500000, description: "Top-up via Credit Card", date: "2025-10-01 12:00", status: "COMPLETED", ref: "TOP-001230" },
];

const paymentMethods = [
  { id: 1, type: "card", last4: "4242", brand: "Visa", expiry: "12/26", isDefault: true },
  { id: 2, type: "card", last4: "8888", brand: "Mastercard", expiry: "08/25", isDefault: false },
];

const invoices = [
  { id: 1, date: "2025-10-05", amount: 75000, session: "Central Station - Port 3", status: "PAID", pdfUrl: "#" },
  { id: 2, date: "2025-10-04", amount: 82000, session: "Downtown Station - Port 1", status: "PAID", pdfUrl: "#" },
  { id: 3, date: "2025-10-01", amount: 95000, session: "Airport Station - Port 5", status: "PAID", pdfUrl: "#" },
];

// ================= Helpers =================
const txIcon = (type: string) => {
  switch (type) {
    case "CREDIT": return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
    case "DEBIT": return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
    case "HOLD": return <Clock className="h-5 w-5 text-orange-500" />;
    case "RELEASE": return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
    default: return <History className="h-5 w-5" />;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Completed</Badge>;
    case "PENDING":
      return <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">Pending</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// ================= Page =================
export default function WalletPaymentPage() {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  const handleTopUp = (amount: number) => {
    toast({
      title: "Top-up Initiated",
      description: `Processing ${amount.toLocaleString("vi-VN")}₫...`,
    });
  };

  const handleCustomTopUp = () => {
    const val = Number(topUpAmount || 0);
    if (val < 10000) {
      toast({
        title: "Invalid amount",
        description: "Minimum top-up is 10,000₫",
        variant: "destructive",
      });
      return;
    }
    handleTopUp(val);
    setTopUpAmount("");
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    // filterDate có thể thêm logic sau
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex">
            <Button variant="ghost" size="sm" className="hover:bg-sky-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Wallet & Payments
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2 gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secured
          </Badge>
        </div>
      </header>

      {/* ===== Body ===== */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div className="mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Wallet
          </h1>
          <p className="text-muted-foreground">Manage your balance, transactions and payment methods</p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2 shadow-electric border-0 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-sky-100">
                    <Wallet className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Wallet Balance</CardTitle>
                    <CardDescription>Available for charging</CardDescription>
                  </div>
                </div>
                <Sparkles className="h-8 w-8 text-sky-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
                {walletBalance.toLocaleString("vi-VN")}₫
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                      <Zap className="h-4 w-4" />
                      Top up
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Top Up Your Wallet</DialogTitle>
                      <DialogDescription>Choose a preset or enter a custom amount</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="grid grid-cols-3 gap-3">
                        {[100000, 200000, 500000].map((amt) => (
                          <Button
                            key={amt}
                            variant="outline"
                            onClick={() => handleTopUp(amt)}
                            className="h-20 flex-col gap-2 hover:bg-sky-50"
                          >
                            <Zap className="h-5 w-5 text-sky-600" />
                            <span className="font-bold">{(amt / 1000).toFixed(0)}K</span>
                          </Button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label>Custom amount (VND)</Label>
                        <Input
                          type="number"
                          placeholder="Min: 10,000"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={handleCustomTopUp}
                        className="w-full gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Proceed to payment
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Supports Bank Transfer, Cards and QR payment
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-100 shadow-card bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">This month</span>
                <span className="font-bold text-red-600">-250K ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending holds</span>
                <span className="font-bold text-orange-600">50K ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total top-ups</span>
                <span className="font-bold text-green-600">700K ₫</span>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                💡 Keep at least 100K₫ for smooth check-in at stations.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList
            className="
              grid w-full grid-cols-3 rounded-2xl bg-[#F7FAFD] p-1.5
              ring-1 ring-slate-200/70 h-auto gap-1
            "
          >
            {[
              { v: "transactions", label: "Transactions" },
              { v: "methods", label: "Payment Methods" },
              { v: "invoices", label: "Invoices" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="
                  group w-full rounded-xl px-6 py-3
                  text-slate-600 font-medium hover:text-slate-700
                  data-[state=active]:text-white
                  data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                  data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                  transition-all flex items-center justify-center
                "
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Transactions */}
          <TabsContent value="transactions" className="animate-fade-in">
            <Card className="border-sky-100 shadow-card bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Transaction history</CardTitle>
                    <CardDescription>All your wallet activities</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="CREDIT">Top-up</SelectItem>
                        <SelectItem value="DEBIT">Payment</SelectItem>
                        <SelectItem value="HOLD">Deposit hold</SelectItem>
                        <SelectItem value="RELEASE">Released</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterDate} onValueChange={setFilterDate}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[460px] pr-2">
                  <div className="space-y-3">
                    {filtered.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-gradient-card hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-sky-100">{txIcon(t.type)}</div>
                          <div>
                            <p className="font-medium">{t.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{t.date}</span>
                              <span>•</span>
                              <span className="font-mono">{t.ref}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className={`font-bold ${t.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                            {t.amount > 0 ? "+" : ""}
                            {t.amount.toLocaleString("vi-VN")} ₫
                          </p>
                          {statusBadge(t.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="methods" className="animate-fade-in">
            <Card className="border-sky-100 shadow-card bg-white">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment methods</CardTitle>
                  <CardDescription>Manage your saved payment methods</CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add new
                </Button>
              </CardHeader>

              <CardContent className="space-y-3">
                {paymentMethods.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gradient-card hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-sky-100">
                        <CreditCard className="h-6 w-6 text-sky-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {m.brand} •••• {m.last4}
                          </p>
                          {m.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Expires {m.expiry}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!m.isDefault && (
                        <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                          Set default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="p-6 rounded-lg border-2 border-dashed border-sky-200 text-center bg-sky-50/40">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-sky-500" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Add a new payment method
                  </p>
                  <Button variant="outline" className="border-sky-200 hover:bg-sky-50">
                    Add card or bank account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Payment security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>All payment data is encrypted & tokenized.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>3D Secure for card transactions.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>PCI DSS Level 1 compliant gateway.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="animate-fade-in">
            <Card className="border-sky-100 shadow-card bg-white">
              <CardHeader>
                <CardTitle>Invoices & receipts</CardTitle>
                <CardDescription>Download and view your payment receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gradient-card hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{inv.session}</p>
                        <p className="text-sm text-muted-foreground">{inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{inv.amount.toLocaleString("vi-VN")} ₫</p>
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 mt-1">
                          {inv.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Policy */}
        <Card className="border-sky-100 shadow-card bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Payment & cancellation policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Deposit hold</p>
                <p className="text-muted-foreground">
                  A deposit (~50,000₫) is held on booking. Final charge after session; excess is released immediately.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Free cancellation</p>
                <p className="text-muted-foreground">
                  Cancel ≥15 minutes before slot for full refund (release within 1–3 business days).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No-show & late cancellation</p>
                <p className="text-muted-foreground">
                  Cancel &lt;15 minutes or no check-in within 30 minutes will incur a fee equal to deposit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
