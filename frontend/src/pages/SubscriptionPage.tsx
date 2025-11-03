// src/pages/SubscriptionPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import api from "../api/axios";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";

import {
  ArrowLeft,
  Package,
  Battery,
  Calendar,
  DollarSign,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react";

/* ================= Types ================= */
type ApiResp<T> = { code?: string; message?: string; data?: T };

type Plan = {
  planId: number;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly" | string;
  includedKwh: number;
  description?: string | null;
};

type Subscription = {
  subscriptionId: number;
  userId: number;
  planId: number;
  planName: string;
  status: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  priceAtPurchase: number;
};

type Me = { id?: number; user_id?: number } & Record<string, any>;

/* ============== Helpers ============== */
const fmtMoneyUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

const containerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } },
};

/* ================= Page ================= */
const SubscriptionPage = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [uid, setUid] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // who am I?
        const me = await api.get<Me>("/auth/me", { withCredentials: true }).catch(() => null);
        const id =
          Number(me?.data?.id ?? me?.data?.user_id ?? (me as any)?.data?.data?.id) || undefined;
        if (id) setUid(id);

        // plans
        const planRes = await api.get<ApiResp<Plan[]>>("/subs-plan", { withCredentials: true });
        setPlans(planRes.data?.data ?? []);

        // my subs
        if (id) {
          const subRes = await api.get<ApiResp<Subscription[]>>(
            `/api/subscriptions/user/${id}`,
            { withCredentials: true }
          );
          setSubs(subRes.data?.data ?? []);
        } else {
          setSubs([]);
        }
      } catch (e: any) {
        toast({
          title: "Không tải được dữ liệu",
          description: e?.response?.data?.message || e?.message,
          variant: "destructive",
        });
        setPlans([]);
        setSubs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeSub = useMemo(
    () => subs.find((s) => (s.status || "").toUpperCase() === "ACTIVE"),
    [subs]
  );

  const askBuy = (p: Plan) => {
    setTargetPlan(p);
    setConfirmOpen(true);
  };

  const doBuy = async () => {
    if (!targetPlan) return;
    if (!uid) {
      toast({ title: "Bạn cần đăng nhập", description: "Vui lòng đăng nhập để mua gói.", variant: "destructive" });
      return;
    }
    setBuying(true);
    try {
      const payload = {
        userId: uid,
        planId: targetPlan.planId,
        startDate: new Date().toISOString().slice(0, 10), // yyyy-MM-dd
      };
      await api.post<ApiResp<Subscription>>("/api/subscriptions", payload, { withCredentials: true });
      toast({ title: "Đã mua gói", description: `Bạn đã đăng ký "${targetPlan.name}".` });

      // refresh subscriptions
      const subRes = await api.get<ApiResp<Subscription[]>>(
        `/api/subscriptions/user/${uid}`,
        { withCredentials: true }
      );
      setSubs(subRes.data?.data ?? []);
      setConfirmOpen(false);
      setTargetPlan(null);
    } catch (e: any) {
      toast({
        title: "Mua gói thất bại",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    } finally {
      setBuying(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-sky-500 to-emerald-500">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Subscriptions
            </span>
          </div>

          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-medium">
            <Shield className="w-4 h-4 mr-2 text-emerald-600" />
            Flexible plans
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Subscription
          </h1>
          <p className="text-slate-600 text-lg">Choose the right package and track your usage</p>
        </div>

        {/* Current subscription */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">Your Subscription</CardTitle>
                      <p className="text-slate-600">Current package information</p>
                    </div>
                  </div>
                  <Sparkles className="h-8 w-8 text-sky-400" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-10 text-sm text-slate-500 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…
                  </div>
                ) : activeSub ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{activeSub.planName}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        <span className="inline-flex items-center mr-4">
                          <Calendar className="w-4 h-4 mr-1" />
                          Start: {fmtDate(activeSub.startDate)}
                        </span>
                        <span className="inline-flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          End: {fmtDate(activeSub.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> ACTIVE
                      </Badge>
                      <div className="text-xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                        {fmtMoneyUSD(activeSub.priceAtPurchase)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="rounded-xl border-2 border-slate-200 p-4 bg-white/70">
                      <p className="text-slate-600">Bạn chưa có gói nào.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick tips */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Battery className="w-4 h-4 text-emerald-600 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-800">kWh Included</div>
                    <div className="text-slate-600">Each package has available kWh for periodic use.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-cyan-600 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-800">Fixed pricing</div>
                    <div className="text-slate-600">Fixed price per cycle, transparent when charging.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-600 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-800">Cancelable</div>
                    <div className="text-slate-600">Can be canceled at the end of the cycle.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Plans */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Available Plans</h2>
          <AnimatePresence>
            {loading ? (
              <div className="p-6 text-sm text-slate-500 flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading plans…
              </div>
            ) : plans.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No packages yet.</div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {plans.map((p) => (
                  <motion.div key={p.planId} variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
                    <Card className="shadow-2xl shadow-slate-900/10 border-0 bg-white/80 backdrop-blur-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-3xl font-extrabold text-slate-900">
                          {fmtMoneyUSD(p.price)}
                          <span className="text-sm text-slate-500 font-normal ml-1">/ {p.billingCycle}</span>
                        </div>
                        <div className="text-sm text-slate-600">{p.description}</div>
                        <Separator />
                        <div className="flex items-center text-sm font-medium">
                          <Battery className="w-4 h-4 mr-2 text-primary" />
                          Included: {p.includedKwh} kWh
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110"
                          onClick={() => askBuy(p)}
                          disabled={!!activeSub}
                        >
                          {activeSub ? "Already Subscribed" : "Subscribe"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm purchase dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              {targetPlan ? (
                <>
                  Bạn sẽ đăng ký <b>{targetPlan.name}</b> —{" "}
                  <b>{fmtMoneyUSD(targetPlan.price)}</b> / {targetPlan.billingCycle}. Bắt đầu từ hôm nay.
                </>
              ) : (
                "—"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-600" />
              <span>Included: <b>{targetPlan?.includedKwh}</b> kWh mỗi chu kỳ</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Gia hạn theo <b>{targetPlan?.billingCycle}</b> (tuỳ chính sách backend)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={doBuy} disabled={buying}>
              {buying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
