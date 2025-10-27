// src/pages/SessionPayment.tsx
import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Wallet as WalletIcon,
  Shield,
  ShieldCheck,
  Timer,
  ArrowLeft,
  Building2,
  PlugZap,
  CalendarClock,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Battery,
} from "lucide-react";
import api from "../api/axios";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

type Method = "VNPAY" | "WALLET";

type InitParams = {
  sessionId: number;
  amount: number;
  stationName?: string;
  portLabel?: string;
  startTime?: string;
  endTime?: string;
  energyKwh?: number;
  description?: string;
};

type PaymentResponse = {
  paymentUrl?: string | null;
  txnRef: string;
  amount: number;
  type: string;
  method: string;
  referenceId?: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  expiresAt?: string;
};

const SS_KEY = "sessionPaymentInit";
const readInitFromSS = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SS_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeInitToSS = (v: any) => {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(v));
  } catch {}
};

// === helpers ===
const fmtUSD = (n?: number) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n)
    : "—";

const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

const fmtEnergy = (kwh?: number) =>
  typeof kwh === "number" && Number.isFinite(kwh) ? `${kwh.toFixed(1)} kWh` : "—";

export default function SessionPayment() {
  const nav = useNavigate();
  const location = useLocation();

  // ===== Init params from state/query/SS =====
  const init: InitParams = useMemo(() => {
    const state = (location.state || {}) as Partial<InitParams>;
    const sp = new URLSearchParams(location.search);
    const fromQuery: Partial<InitParams> = {
      sessionId: sp.get("sessionId") ? Number(sp.get("sessionId")) : state.sessionId,
      amount: sp.get("amount") ? Number(sp.get("amount")) : state.amount,
      stationName: sp.get("stationName") ?? state.stationName,
      portLabel: sp.get("portLabel") ?? state.portLabel,
      startTime: sp.get("startTime") ?? state.startTime,
      endTime: sp.get("endTime") ?? state.endTime,
      energyKwh: sp.get("energyKwh") ? Number(sp.get("energyKwh")) : state.energyKwh,
      description:
        (sp.get("description") as string | undefined) ??
        state.description ??
        "Charging session payment",
    };
    const fromSS = readInitFromSS();
    return {
      sessionId: Number(fromQuery.sessionId ?? fromSS.sessionId ?? 0),
      amount: Number(fromQuery.amount ?? fromSS.amount ?? 0),
      stationName: fromQuery.stationName ?? fromSS.stationName ?? "",
      portLabel: fromQuery.portLabel ?? fromSS.portLabel ?? "",
      startTime: fromQuery.startTime ?? fromSS.startTime ?? "",
      endTime: fromQuery.endTime ?? fromSS.endTime ?? "",
      energyKwh: Number((fromQuery.energyKwh ?? fromSS.energyKwh ?? NaN) as number),
      description:
        fromQuery.description ?? fromSS.description ?? "Charging session payment",
    } as InitParams;
  }, [location.search, location.state]);

  // force method 
  const forcedRaw =
    (location.state as any)?.forceMethod ??
    new URLSearchParams(location.search).get("method");
  const forced: Method | undefined =
    typeof forcedRaw === "string" && forcedRaw.toUpperCase() === "WALLET"
      ? "WALLET"
      : typeof forcedRaw === "string" && forcedRaw.toUpperCase() === "VNPAY"
      ? "VNPAY"
      : undefined;
  const isForced = Boolean(forced);

  // ===== UI state =====
  const [method, setMethod] = useState<Method>("VNPAY");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // persist init
    if (init?.sessionId && typeof init?.amount === "number" && !Number.isNaN(init.amount)) {
      writeInitToSS(init);
      setErr(null);
    } else {
      setErr("Missing sessionId or invalid amount.");
    }
  }, [init]);

  // set method when forced
  useEffect(() => {
    if (forced) setMethod(forced);
  }, [forced]);

  const onPay = async () => {
    if (submitting) return;
    // guard: if forced, ensure using forced method
    if (isForced && forced && method !== forced) setMethod(forced);

    setSubmitting(true);
    setErr(null);
    try {
      writeInitToSS(init);
      const BACKEND_URL =
        (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";
      const returnUrl = `${BACKEND_URL}/api/payment/payment-return`;
      const amountVnd = Math.round(Number(init.amount) || 0);
      const body = {
        amount: amountVnd,
        returnUrl,
        locale: "en",
        description: init.description,
        type: "CHARGING-SESSION",
        referenceId: init.sessionId,
        method, // "VNPAY" | "WALLET"
      };

      const { data } = await api.post("/api/payment/create", body, {withCredentials: true });
      const res: { code?: string; message?: string; data?: PaymentResponse } = data;

      if (res?.code && res.code !== "00") {
        setErr(res.message || "Cannot create payment for this session.");
        setSubmitting(false);
        return;
      }

      if (res?.data) {
        if (method === "VNPAY" && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl!;
          return;
        }
        if (method === "WALLET") {
          const to = "/session-payment-result";
          if (res.data.status === "SUCCESS") {
            nav(to, {
              replace: true,
              state: {
                status: "SUCCESS",
                orderId: res.data.txnRef,
                amount: res.data.amount,
                message: "Wallet payment succeeded",
                transactionNo: res.data.txnRef,
              },
            });
            return;
          }
          if (res.data.status === "PENDING") {
            nav(to, {
              replace: true,
              state: {
                status: "PENDING",
                orderId: res.data.txnRef,
                amount: res.data.amount,
                message: "Wallet payment is being processed",
                transactionNo: res.data.txnRef,
              },
            });
            return;
          }
          setErr("Wallet payment failed. Please try again or choose another method.");
          return;
        }
      } else {
        setErr(res?.message || "No payment response received.");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to create payment.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // === derived display ===
  const amountText = fmtUSD(init.amount);
  const energyText = fmtEnergy(init.energyKwh);
  const startTxt = fmtDateTime(init.startTime);
  const endTxt = fmtDateTime(init.endTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" state={{ refreshReservations: true }} className="inline-flex">
            <Button variant="ghost" size="sm" className="hover:bg-sky-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <WalletIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Pay for Charging Session
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2 gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secured
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Overview */}
        <Card className="shadow-electric border-0 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-100">
                  <Building2 className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Charging session payment</CardTitle>
                  <CardDescription>Complete the payment for your session</CardDescription>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-600">Payable amount</div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  {amountText}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Row 1: Station + Energy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-white/70 rounded-xl border md:col-span-2">
                <PlugZap className="w-5 h-5 text-primary mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Station</div>
                  <div className="font-bold">{init.stationName || "EV Station"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {init.portLabel ? `Port ${init.portLabel}` : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white/70 rounded-xl border">
                <Battery className="w-5 h-5 text-emerald-600 mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Energy</div>
                  <div className="font-bold">{energyText}</div>
                </div>
              </div>
            </div>

            {/* Row 2: Start & End time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-white/70 rounded-xl border">
                <Calendar className="w-5 h-5 text-primary mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Start time</div>
                  <div className="font-bold">{startTxt}</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white/70 rounded-xl border">
                <Clock className="w-5 h-5 text-primary mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">End time</div>
                  <div className="font-bold">{endTxt}</div>
                </div>
              </div>
            </div>

            {/* Policy line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Payment is processed securely. Keep this page open until completion.</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4" />
                <span>Some methods may take a few minutes to confirm.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Method selection */}
        <Card className="border-sky-100 shadow-card bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Choose payment method</CardTitle>
            <CardDescription>VNPay (redirect) or Wallet (instant charge)</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {!isForced ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setMethod("VNPAY")}
                  variant={method === "VNPAY" ? "default" : "outline"}
                  className={`h-12 rounded-xl gap-2 ${
                    method === "VNPAY"
                      ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                      : "border-sky-200 hover:bg-sky-50"
                  }`}
                  disabled={submitting}
                >
                  <CreditCard className="w-4 h-4" />
                  VNPay
                </Button>

                <Button
                  type="button"
                  onClick={() => setMethod("WALLET")}
                  variant={method === "WALLET" ? "default" : "outline"}
                  className={`h-12 rounded-xl gap-2 ${
                    method === "WALLET"
                      ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                      : "border-sky-200 hover:bg-sky-50"
                  }`}
                  disabled={submitting}
                >
                  <WalletIcon className="w-4 h-4" />
                  Wallet
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border bg-white/70 p-3">
                <div className="inline-flex items-center gap-2">
                  {method === "VNPAY" ? (
                    <>
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="font-medium">VNPay</span>
                    </>
                  ) : (
                    <>
                      <WalletIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">Wallet</span>
                    </>
                  )}
                </div>
                <Badge variant="outline" className="rounded-full text-xs">
                  selected
                </Badge>
              </div>
            )}

            {err && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div className="text-sm">{err}</div>
              </div>
            )}

            <Button
              onClick={onPay}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating payment…
                </span>
              ) : method === "VNPAY" ? (
                "Pay with VNPay"
              ) : (
                "Pay with Wallet"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to the payment terms and refund policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
