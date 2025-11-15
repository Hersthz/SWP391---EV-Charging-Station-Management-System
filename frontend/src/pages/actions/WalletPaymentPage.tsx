// src/pages/WalletPaymentPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { useToast } from "../../hooks/use-toast";
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  History,
  Shield,
  Sparkles,
  Wallet,
  Zap,
  Plus,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import api from "../../api/axios";
import { ChatBot } from "./../ChatBot";

/* ================= Types ================= */
type ApiResponse<T> = { code?: string; statusCode?: string; message?: string; data?: T };

type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page (0-based)
};

type PaymentTx = {
  id: number | string;
  userId?: number;
  amount: number;         // VND
  type: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE" | string;
  status: "COMPLETED" | "PENDING" | "FAILED" | string;
  orderInfo?: string;
  referenceId?: string | number;
  createdAt?: string;     // ISO
};

type TxItem = {
  id: string | number;
  type: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE";
  amount: number;
  description: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  ref?: string | number;
};

/* ================= Helpers ================= */
const txIcon = (type: string) => {
  switch (type) {
    case "CREDIT": return <ArrowUpCircle className="h-5 w-5 text-emerald-600" />;
    case "DEBIT": return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
    case "HOLD": return <Clock className="h-5 w-5 text-amber-600" />;
    case "RELEASE": return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
    default: return <History className="h-5 w-5" />;
  }
};

const txType = (t: PaymentTx): TxItem["type"] => {
  return t.type === "WALLET" ? "CREDIT" : "DEBIT";
};

const statusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Completed</Badge>;
    case "PENDING":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const fmtMoney = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
    : "0 ₫";

// Backend URL only used for returnUrl when creating VNPay link
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";

// === Variants cho animation của Framer Motion ===
const kpiContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// alias used in several places in the file
const containerVariants: Variants = kpiContainerVariants;

const kpiCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1],
    },
  },
};

/* ===================== Page Component ===================== */
export default function WalletPaymentPage() {
  const { toast } = useToast();

  const [uid, setUid] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [topupLoading, setTopupLoading] = useState(false);

  const [currentTab, setCurrentTab] = useState("transactions");

  /* ============== Load current user id ============== */
  const loadUserId = useCallback(async () => {
    const { data } = await api.get<any>("/auth/me");
    const id =
      data?.id ?? data?.user_id ?? data?.data?.id ?? data?.user?.id ?? data?.profile?.id;
    if (id == null) throw new Error("Cannot fetch current user");
    return Number(id);
  }, []);

  /* ============== Load wallet balance ============== */
  const loadBalance = useCallback(async (userId: number) => {
    const { data } = await api.get<any>(`/wallet/${userId}`);
    const bal = Number(data?.balance ?? data?.data?.balance ?? 0);
    return Number.isFinite(bal) ? bal : 0;
  }, []);

  /* ============== Load user's transactions ============== */
  const loadTransactions = useCallback(async (userId: number) => {
    setLoadingTx(true);
    try {
      const { data } = await api.get<PageResp<PaymentTx>>("/api/payment/getPaymentU", {
        params: { userId: userId, page: 0, pageSize: 50 },
      });

      const items: TxItem[] = (data?.content ?? []).map((t) => ({
        id: t.id,
        type: txType(t),
        amount: Number(t.amount ?? 0),
        description: t.orderInfo ?? (t.type === "WALLET" ? "Top-up" : "Payment"),
        date: t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
        status: (t.status === "SUCCESS" ? "COMPLETED" : (t.status?.toUpperCase?.() ?? "PENDING")) as TxItem["status"],
        ref: t.referenceId,
      }));
      setTransactions(items);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  /* ============== Init ============== */
  useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true);
        const id = await loadUserId();
        setUid(id);
        const bal = await loadBalance(id);
        setBalance(bal);
        await loadTransactions(id);
      } catch {
        setBalance(null);
        setTransactions([]);
      } finally {
        setLoadingBalance(false);
      }
    })();
  }, [loadUserId, loadBalance, loadTransactions]);

  /* ============== Create VNPay top-up ============== */
  const createVnpayTopUp = async (amount: number) => {
    if (uid == null) throw new Error("Missing user id");

    const payload = {
      amount,                   // VND, integer
      type: "WALLET",
      method: "VNPAY",
      referenceId: uid,
      returnUrl: `${BACKEND_URL}/api/payment/payment-return`,
      locale: "en" as const,
      description: `Top-up ${amount.toLocaleString("vi-VN")} VND`,
    };

    const { data } = await api.post<ApiResponse<{ paymentUrl?: string; url?: string }>>(
      "/api/payment/create",
      payload
    );

    const code = data?.code ?? data?.statusCode;
    if (code && code !== "00") {
      throw new Error(data?.message || "Cannot create payment");
    }
    const paymentUrl = data?.data?.paymentUrl ?? data?.data?.url;
    if (!paymentUrl) throw new Error("paymentUrl is missing from backend response");

    window.location.href = paymentUrl; // redirect to VNPay
  };

  const handleTopUp = async (amount: number) => {
    try {
      if (topupLoading) return;
      if (!Number.isFinite(amount) || amount < 10000) {
        toast({
          title: "Invalid amount",
          description: "Minimum top-up is 10,000₫.",
          variant: "destructive",
        });
        return;
      }
      setTopupLoading(true);
      toast({
        title: "Creating payment",
        description: `${amount.toLocaleString("vi-VN")}₫`,
      });
      await createVnpayTopUp(amount);
    } catch (e: any) {
      toast({
        title: "Top-up failed",
        description: e?.response?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
      setTopupLoading(false);
    }
  };

  const handleCustomTopUp = () => {
    const val = Number(topUpAmount || 0);
    if (val < 10000) {
      toast({
        title: "Invalid amount",
        description: "Minimum top-up is 10,000₫.",
        variant: "destructive",
      });
      return;
    }
    handleTopUp(val);
    setTopUpAmount("");
  };

  /* ============== Filters ============== */
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== (filterType as any)) return false;
      return true;
    });
  }, [transactions, filterType, filterDate]);

  /* ============== UI  ============== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-sky-500 to-emerald-500">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Wallet & Payments
            </span>
          </div>

          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-medium">
            <Shield className="w-4 h-4 mr-2 text-emerald-600" />
            Secured
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div className="mb-2">
          <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Wallet
          </h1>
          <p className="text-slate-600 text-lg">Manage your balance, transactions and payment methods</p>
        </div>

                {/* Overview */}
        <motion.div
          className="grid grid-cols-1 gap-6"
          variants={kpiContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Thẻ số dư */}
          <motion.div className="lg:col-span-1" variants={kpiCardVariants}>
            <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15 h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  {/* Bên trái: tiêu đề + icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        Wallet Balance
                      </CardTitle>
                      <CardDescription>Available for charging</CardDescription>
                    </div>
                  </div>

                  {/* Bên phải: info nhỏ gọn cho đỡ trống */}
                  <div className="hidden sm:flex flex-col items-end gap-1 text-xs min-w-[220px]">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        Keep at least <b>100.000₫</b>
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-6xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  {loadingBalance ? "..." : balance === null ? "Error" : fmtMoney(balance)}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110 transition-all rounded-full px-8 shadow-lg shadow-cyan-500/30"
                        disabled={topupLoading}
                      >
                        <Zap className="h-4 w-4" />
                        Top up
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Top Up Your Wallet</DialogTitle>
                        <DialogDescription>
                          Choose a preset or enter a custom amount
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-3">
                          {[100000, 200000, 500000].map((amt) => (
                            <Button
                              key={amt}
                              variant="outline"
                              onClick={() => handleTopUp(amt)}
                              className="h-20 flex-col gap-2 hover:bg-sky-50 border-slate-300"
                              disabled={topupLoading}
                            >
                              <Zap className="h-5 w-5 text-sky-600" />
                              <span className="font-bold">
                                {(amt / 1000).toFixed(0)}K
                              </span>
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
                            disabled={topupLoading}
                          />
                        </div>

                        <Button
                          onClick={handleCustomTopUp}
                          className="w-full gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110"
                          disabled={topupLoading}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Proceed to payment
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          VNPAY will process your payment. Your wallet will be
                          credited after a successful confirmation.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* === Tabs === */}
        <Tabs defaultValue="transactions" onValueChange={setCurrentTab} className="space-y-6">
          <TabsList
            className="
              grid w-full grid-cols-2 rounded-2xl bg-white/80 backdrop-blur-md p-1.5
              shadow-2xl shadow-slate-900/15 h-auto gap-1
            "
          >
            <TabsTrigger
              value="transactions"
              className="
                group w-full rounded-xl px-6 py-3 text-slate-600 font-medium hover:text-slate-900
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all flex items-center justify-center"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="methods"
              className="
                group w-full rounded-xl px-6 py-3 text-slate-600 font-medium hover:text-slate-900
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all flex items-center justify-center"
            >
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Transactions */}
              <TabsContent value="transactions" className="mt-0">
                <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Transaction history</CardTitle>
                        <CardDescription>All your wallet activities</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="w/[160px] bg-white/70 border-slate-300">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/90 backdrop-blur-md">
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="CREDIT">Top-up</SelectItem>
                            <SelectItem value="DEBIT">Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {loadingTx ? (
                      <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
                        Loading...
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-sm text-slate-500 text-center">
                        No transactions.
                      </div>
                    ) : (
                      <ScrollArea className="h-[460px] pr-2">
                        <motion.div
                          className="space-y-2"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {filtered.map((t) => (
                            <motion.div
                              key={t.id}
                              variants={kpiCardVariants}
                              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/50 bg-white/50 hover:bg-white/90 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-slate-100">{txIcon(t.type)}</div>
                                <div>
                                  <p className="font-medium">{t.description}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                    <span>{t.date}</span>
                                    {t.ref ? (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono">{t.ref}</span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className={`font-bold ${t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                                  {t.type === "CREDIT" ? "+" : "-"}
                                  {fmtMoney(t.amount)}
                                </p>
                                {statusBadge(t.status)}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* === Payment Methods === */}
              <TabsContent value="methods" className="mt-0">
                <div className="space-y-6">
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-slate-900">Payment methods</h2>
                    <p className="text-slate-600">Manage your saved payment methods</p>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* === Thẻ 1: Wallet  === */}
                    <motion.div variants={kpiCardVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                      <Card className="relative bg-white/80 backdrop-blur-md border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 h-full">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                          <div className="p-3 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                            <Wallet className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="mt-4 text-lg font-semibold text-slate-900">ChargeHub Wallet</h3>
                          <p className="text-sm text-slate-600">Available balance</p>
                          <p className="mt-2 text-3xl font-bold text-slate-800">
                            {loadingBalance ? "..." : fmtMoney(balance)}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* === Thẻ 2: VNPAY === */}
                    <motion.div variants={kpiCardVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                      <Card className="relative bg-white/80 backdrop-blur-md border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 h-full">
                        <CardContent className="p-6 flex flex-col items-center text-center justify-between h-full">
                          <div>
                            <div className="p-3 inline-block rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                              <CreditCard className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">VNPAY</h3>
                            <p className="text-sm text-slate-600">Linked to phone ***1234</p>
                          </div>
                          <Button variant="ghost" className="mt-4 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                            Manage
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* === Thẻ 3: Cash (Pay at station) === */}
                    <motion.div
                      variants={kpiCardVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="relative bg-white/80 backdrop-blur-md border-2 border-slate-300 shadow-2xl shadow-slate-900/10 h-full">
                        <CardContent className="p-6 flex flex-col items-center text-center justify-between h-full">
                          <div>
                            <div className="p-3 inline-block rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/30">
                              <Banknote className="w-8 h-8" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">Cash</h3>
                            <p className="text-sm text-slate-600">Pay at station counter</p>
                          </div>

                          <Badge
                            variant="outline"
                            className="mt-4 text-xs border-dashed border-slate-300 text-slate-500"
                          >
                            On-site only
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Policy */}
        <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Payment & cancellation policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Deposit hold</p>
                <p className="text-slate-600">
                  A deposit amount will be held when booking. Any remaining balance will be released after the charging session ends.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Free cancellation</p>
                <p className="text-slate-600">
                  Cancel ≥ 15 minutes before your slot for a full deposit release (subject to backend policy).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">No-show & late cancellation</p>
                <p className="text-slate-600">
                  Cancelling &lt; 15 minutes before start time or not showing up may forfeit your deposit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatBot />
    </div>
  );
}