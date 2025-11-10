import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import api from "../../api/axios";
import { HandCoins, RefreshCcw, AlertTriangle, BadgeCheck } from "lucide-react";

/** ===== Types ===== */
type CashState = {
  sessionId: number;
  amount: number;
  description?: string;
  paymentId?: number;
};

type PaymentTx = {
  id: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  method: string;          // CASH
  type: string;            // CHARGING-SESSION
  amount: number;
  referenceId?: number;
  txnRef?: string;
  createdAt?: string;
};

/** ===== Helpers ===== */
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** ===== Page ===== */
export default function CashPayment() {
  const nav = useNavigate();
  const location = useLocation();
  const query = useQuery();

  // Lấy từ state nếu có, fallback sang query (?sessionId=&amount=&paymentId=)
  const sState = (location.state || {}) as Partial<CashState>;
  const sessionId = Number(sState.sessionId ?? query.get("sessionId") ?? NaN);
  const amount = Number(sState.amount ?? query.get("amount") ?? 0);
  const paymentId = Number(sState.paymentId ?? query.get("paymentId") ?? NaN);

  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<PaymentTx | null>(null);
  const [polling, setPolling] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const title = useMemo(
    () => sState.description || (Number.isFinite(sessionId) ? `Charging session #${sessionId}` : "Cash Payment"),
    [sState.description, sessionId]
  );

  // Lấy giao dịch của user và match với session hiện tại
  const fetchMine = async () => {
    if (!Number.isFinite(sessionId)) return; // guard: thiếu sessionId thì không gọi
    try {
      setLoading(true);
      const { data } = await api.get("/api/payment/getPaymentU", {
        params: { page: 0, pageSize: 20 },
        withCredentials: true,
      });

      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      // Ưu tiên paymentId nếu truyền; nếu không match theo CASH + CHARGING-SESSION + referenceId
      const row: any =
        (Number.isFinite(paymentId) && list.find((r: any) => Number(r?.id) === Number(paymentId))) ||
        list.find(
          (r: any) =>
            String(r?.method).toUpperCase() === "CASH" &&
            String(r?.type).toUpperCase() === "CHARGING-SESSION" &&
            Number(r?.referenceId ?? r?.reference_id) === Number(sessionId)
        );

      if (row) {
        const t: PaymentTx = {
          id: Number(row.id),
          status: String(row.status || "PENDING").toUpperCase(),
          method: String(row.method || "CASH").toUpperCase(),
          type: String(row.type || "CHARGING-SESSION").toUpperCase(),
          amount: Number(row.amount ?? amount ?? 0),
          referenceId: Number(row.referenceId ?? row.reference_id ?? sessionId),
          txnRef: row.txnRef ?? row.txn_ref,
          createdAt: row.createdAt ?? row.created_at,
        };
        setTx(t);

        if (t.status === "SUCCESS") {
          setPolling(false);
          // Điều hướng về Dashboard như yêu cầu
          nav("/dashboard", { replace: true });
        }
      }
    } catch {
      // im lặng
    } finally {
      setLoading(false);
    }
  };

  // Polling mỗi 4s
  useEffect(() => {
    // render được ngay cả khi thiếu sessionId (sẽ hiện lỗi UI bên dưới)
    fetchMine();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (polling) fetchMine();
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, paymentId, polling]);

  // ==== UI ====
  if (!Number.isFinite(sessionId)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3 text-amber-700">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div>
                <div className="text-sm opacity-80">
                  Not found <b>sessionId</b>.
                  <code className="mx-1 px-1 rounded bg-muted">?sessionId=&amount=</code>.
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => nav(-1)}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-xl border-2 border-primary/10">
        <CardContent className="p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow">
            <HandCoins className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold">{title}</h1>
            <div className="text-muted-foreground">Cost: <b>{fmtVND(amount)}</b></div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              Waiting for <b>staff</b> to confirm cash payment for charging session #{sessionId}.
              The page will automatically redirect to Dashboard when the transaction is successfully confirmed.
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge className={tx?.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
              {tx?.status === "SUCCESS" ? "Confirmed" : "Confirming..."}
            </Badge>
            {tx?.txnRef && <span className="text-xs text-muted-foreground">ID: <code className="bg-muted px-1 rounded">{tx.txnRef}</code></span>}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="h-11" onClick={() => fetchMine()} disabled={loading}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" className="h-11" onClick={() => nav(-1)}>
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
