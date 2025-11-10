import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Wallet, Shield } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import api from "../../api/axios";

type Result = {
  status: "SUCCESS" | "FAILED";
  orderId?: string;
  amount?: number;
  message?: string;
};

export default function WalletTopupResult() {
  const location = useLocation();
  const nav = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);

  const result: Result = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    // đọc chung như các trang result khác
    let status = (sp.get("status") as Result["status"]) || undefined;
    let orderId = sp.get("orderId") || sp.get("vnp_TxnRef") || undefined;
    let amount: number | undefined =
      sp.get("amount") ? Number(sp.get("amount")) :
      (sp.get("vnp_Amount") ? Math.round(Number(sp.get("vnp_Amount")) / 100) : undefined);

    const vnpCode = sp.get("vnp_ResponseCode");
    const vnpTxnStatus = sp.get("vnp_TransactionStatus");
    if (!status && vnpCode) {
      const ok = vnpCode === "00" && (!vnpTxnStatus || vnpTxnStatus === "00");
      status = ok ? "SUCCESS" : "FAILED";
    }
    const message =
      sp.get("message") ||
      (status === "SUCCESS" ? "Top-up thành công." : "Giao dịch thất bại hoặc bị huỷ.");

    if (!status) status = "FAILED";
    return { status, orderId, amount, message };
  }, [location.search]);

  const ok = result.status === "SUCCESS";

  // Sau khi return, backend đã cập nhật & cộng ví (mục 1.2). Ta đọc số dư để hiển thị.
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId = me.data?.user_id ?? me.data?.id;
        if (!userId) return;
        const { data } = await api.get(`/wallet/${userId}`, { withCredentials: true });
        const bal = Number(data?.balance ?? 0);
        if (Number.isFinite(bal)) setBalance(bal);
      } catch { /* ignore */ }
    })();
  }, []);

  const fmtVND = (v?: number) =>
    typeof v === "number" ? new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v) : "—";

  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => nav("/wallet", { replace: true }), 15000);
      return () => clearTimeout(t);
    }
  }, [ok, nav]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
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
              Wallet Top-up Result
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2 gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secured
          </Badge>
        </div>
      </header>

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
                  {ok ? "Top-up Successful" : "Top-up Failed"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {result.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Transaction ID</div>
                <div className="font-bold tracking-wide">{result.orderId || "—"}</div>
              </div>
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-bold">{fmtVND(result.amount)}</div>
              </div>
              <div className="p-4 rounded-xl border bg-white/60">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className={`font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {ok ? "SUCCESS" : "FAILED"}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-sky-50/60 p-4 text-sm">
              Current wallet balance: <b>{balance == null ? "—" : balance.toLocaleString("vi-VN")}₫</b>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/wallet">
                <Button className="w-full h-11 rounded-xl" variant="outline">Go to Wallet</Button>
              </Link>
              <Link to="/dashboard">
                <Button className="w-full h-11 rounded-xl" variant="outline">Dashboard</Button>
              </Link>
              {!ok && (
                <Link to="/wallet">
                  <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                    Try Again
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
