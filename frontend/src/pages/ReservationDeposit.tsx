// src/pages/ReservationDeposit.tsx
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

type Method = "VNPAY" | "WALLET";

type InitParams = {
  reservationId: number;
  amount: number;
  stationName?: string;
  portLabel?: string;
  connectorLabel?: string;
  startTime?: string;
  endTime?: string;
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

// --- persist reservation context per tab ---
const SS_KEY = "reservationDepositInit";
const readInitFromSS = () => {
  try { return JSON.parse(sessionStorage.getItem(SS_KEY) || "{}"); } catch { return {}; }
};
const writeInitToSS = (v: any) => {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(v)); } catch {}
};

export default function ReservationDeposit() {
  const nav = useNavigate();
  const location = useLocation();

  // read params from router state or query string + sessionStorage
  const init: InitParams = useMemo(() => {
    const state = (location.state || {}) as Partial<InitParams>;
    const sp = new URLSearchParams(location.search);

    const fromQuery: Partial<InitParams> = {
      reservationId: sp.get("reservationId") ? Number(sp.get("reservationId")) : state.reservationId,
      amount:        sp.get("amount")        ? Number(sp.get("amount"))        : state.amount,
      stationName:   sp.get("stationName") ?? state.stationName,
      portLabel:     sp.get("portLabel") ?? state.portLabel,
      connectorLabel:sp.get("connectorLabel") ?? state.connectorLabel,
      startTime:     sp.get("startTime") ?? state.startTime,
      endTime:       sp.get("endTime") ?? state.endTime,
      description:   sp.get("description") ?? state.description ?? "Reservation deposit",
    };

    const fromSS = readInitFromSS();

    return {
      reservationId: Number(fromQuery.reservationId ?? fromSS.reservationId ?? 0),
      amount:        Number(fromQuery.amount ?? fromSS.amount ?? 0),
      stationName:   fromQuery.stationName ?? fromSS.stationName ?? "",
      portLabel:     fromQuery.portLabel ?? fromSS.portLabel ?? "",
      connectorLabel:fromQuery.connectorLabel ?? fromSS.connectorLabel ?? "",
      startTime:     fromQuery.startTime ?? fromSS.startTime ?? "",
      endTime:       fromQuery.endTime ?? fromSS.endTime ?? "",
      description:   fromQuery.description ?? fromSS.description ?? "Reservation deposit",
    } as InitParams;
  }, [location.search, location.state]);

  const [method, setMethod] = useState<Method>("VNPAY");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (init?.reservationId && init?.amount && !Number.isNaN(init.amount)) {
      writeInitToSS(init);  // giữ context cho các lần quay lại
      setErr(null);
    } else {
      setErr("Missing reservationId or invalid amount.");
    }
  }, [init]);

  const onPay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      // đảm bảo đã lưu trước khi rời trang / redirect
      writeInitToSS(init);

      const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";
      const returnUrl = `${BACKEND_URL}/api/payment/payment-return`;
      const body = {
        amount: init.amount,
        returnUrl,
        locale: "en",
        description: init.description,
        type: "RESERVATION",
        referenceId: init.reservationId,
        method, // "VNPAY" | "WALLET"
      };

      const { data } = await api.post("/api/payment/create", body);
      const res: { code?: string; message?: string; data?: PaymentResponse } = data;

      // xử lý lỗi từ backend (reservation cũ/hết hạn/đã thanh toán...)
      if (res?.code && res.code !== "00") {
        setErr(res.message || "Cannot create payment for this reservation.");
        setSubmitting(false);
        return;
      }

      if (res?.data) {
        if (method === "VNPAY" && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl!;
          return;
        }
        if (method === "WALLET") {
          if (res.data.status === "SUCCESS") {
            nav("/depositss", {
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
            nav("/depositss", {
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

  const amountText =
    typeof init.amount === "number" && !Number.isNaN(init.amount)
      ? init.amount.toLocaleString("vi-VN") + " ₫"
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* ===== Header (aligned with Wallet) ===== */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex">
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
              Deposit & Payment
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2 gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secured
          </Badge>
        </div>
      </header>

      {/* ===== Body ===== */}
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
                  <CardTitle className="text-2xl">Reservation deposit</CardTitle>
                  <CardDescription>Pay the hold amount for your reservation</CardDescription>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-600">Deposit amount</div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  {amountText}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Station & timeslot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-white/60 rounded-xl border">
                <PlugZap className="w-5 h-5 text-primary mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Station</div>
                  <div className="font-bold">{init.stationName || "EV Station"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {init.portLabel ? `Port ${init.portLabel}` : ""}
                    {init.connectorLabel ? ` • Connector ${init.connectorLabel}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-white/60 rounded-xl border">
                <CalendarClock className="w-5 h-5 text-primary mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Timeslot</div>
                  <div className="font-bold">
                    {init.startTime || "—"} {init.endTime ? `→ ${init.endTime}` : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Policy line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>The slot is held for 15 minutes from payment creation.</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4" />
                <span>The payment will expire automatically after that period.</span>
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setMethod("VNPAY")}
                variant={method === "VNPAY" ? "default" : "outline"}
                className={`h-12 rounded-xl gap-2 ${method === "VNPAY"
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
                className={`h-12 rounded-xl gap-2 ${method === "WALLET"
                  ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                  : "border-sky-200 hover:bg-sky-50"
                  }`}
                disabled={submitting}
              >
                <WalletIcon className="w-4 h-4" />
                Wallet
              </Button>
            </div>

            {err && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div className="text-sm">{err}</div>
              </div>
            )}

            <Button
              onClick={onPay}
              disabled={submitting || !!err}
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
              By continuing, you agree to the hold & refund policy for reservations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
