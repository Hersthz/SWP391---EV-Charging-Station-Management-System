// src/pages/DepositSS.tsx
import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Wallet,
  Shield,
  CalendarClock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

type Result = {
  status: "SUCCESS" | "FAILED";
  orderId?: string;
  amount?: number;
  message?: string;
};

const SS_KEY = "reservationDepositInit";

export default function DepositSS() {
  const location = useLocation();
  const nav = useNavigate();

  const savedInit = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem(SS_KEY) || "{}"); } catch { return {}; }
  }, []);

  const result: Result = useMemo(() => {
    const state = (location.state || {}) as Partial<Result>;
    const sp = new URLSearchParams(location.search);

    // Generic first
    let status = (state.status ?? (sp.get("status") as Result["status"])) || undefined;
    let orderId = state.orderId ?? sp.get("orderId") ?? sp.get("txnRef") ?? undefined;
    let amount: number | undefined =
      state.amount ?? (sp.get("amount") ? Number(sp.get("amount")) : undefined);

    // VNPay fallback
    const vnpCode = sp.get("vnp_ResponseCode");
    const vnpTxnRef = sp.get("vnp_TxnRef");
    const vnpAmount = sp.get("vnp_Amount");
    const vnpTxnStatus = sp.get("vnp_TransactionStatus");
    if (!status && vnpCode) {
      const okVnp = vnpCode === "00" && (!vnpTxnStatus || vnpTxnStatus === "00");
      status = okVnp ? "SUCCESS" : "FAILED";
    }
    if (!orderId && vnpTxnRef) orderId = vnpTxnRef;
    if (!amount && vnpAmount) {
      const raw = Number(vnpAmount);
      if (!Number.isNaN(raw)) amount = Math.round(raw / 100);
    }

    const message =
      state.message ??
      sp.get("message") ??
      (status === "SUCCESS"
        ? "Deposit payment completed successfully."
        : sp.toString()
        ? "Payment failed or was cancelled."
        : "No transaction information found.");

    if (!status) status = "FAILED";

    return { status, orderId: orderId || undefined, amount, message };
  }, [location.search, location.state]);

  const ok = result.status === "SUCCESS";

  // ❌ Bỏ auto-redirect về deposit khi FAILED để không mất context

  useEffect(() => {
    if (result.status === "SUCCESS") {
      const t = setTimeout(() => nav("/dashboard", { replace: true }), 30000);
      return () => clearTimeout(t);
    }
  }, [result.status, nav]);

  const formatVND = (v?: number) =>
    typeof v === "number"
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="hover:bg-sky-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Payment Result
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
        <Card className="border-sky-200/60 bg-white/80 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {ok ? (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow bg-gradient-to-br from-emerald-500 to-sky-500">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow bg-gradient-to-br from-rose-500 to-orange-500">
                  <XCircle className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <CardTitle className={`text-2xl ${ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {ok ? "Payment Successful" : "Payment Failed"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {result.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Transaction ID</div>
                <div className="font-bold tracking-wide">{result.orderId || "—"}</div>
              </div>
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-bold">{formatVND(result.amount)}</div>
              </div>
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className={`font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {ok ? "SUCCESS" : "FAILED"}
                </div>
              </div>
            </div>

            {/* Next steps */}
            {ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <CalendarClock className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="text-sm">
                  Your reservation is currently held. Please arrive at the station within your selected time window to start the charging session.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                <div className="text-sm">
                  If funds were deducted but you see a failed result, please check your wallet/bank history
                  or contact support. You can try the payment again.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/dashboard">
                <Button className="w-full h-11 rounded-xl" variant="outline">
                  Go to Dashboard
                </Button>
              </Link>

              <Link to="/booking">
                <Button className="w-full h-11 rounded-xl" variant="outline">
                  Book Another Slot
                </Button>
              </Link>

              <Button
                className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                onClick={() => nav("/reservation/deposit", { replace: true, state: savedInit })}
              >
                {ok ? "Review Payment Page" : "Try Payment Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
