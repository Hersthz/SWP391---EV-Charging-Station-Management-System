// src/pages/staff/StaffPayment.tsx
import { useEffect, useMemo, useState } from "react";
import StaffLayout from "../../components/staff/StaffLayout";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { RefreshCw, DollarSign, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/* ===== Types (nới lỏng để chịu nhiều dạng BE mapping khác nhau) ===== */
type PaymentTx = {
  id?: number;
  transactionId?: number;         // fallback id
  type?: string;                  // RESERVATION | CHARGING-SESSION | WALLET
  method?: string;                // WALLET | VNPAY | ...
  referenceId?: number;           // reservationId / sessionId / ...
  amount?: number;                // VND
  status?: string;                // PENDING | SUCCESS | FAILED | ...
  orderId?: string;
  transactionNo?: string;
  createdAt?: string;
  updatedAt?: string;
  // đôi khi BE gói trong field data:
  data?: any;
};

type ManagerStation = {
  station?: any;
  stationDto?: any;
  id?: number;
};

const normUp = (s?: string) => String(s || "").toUpperCase().trim();

/* badge theo status */
const statusBadge = (status?: string) => {
  const s = normUp(status);
  if (s === "SUCCESS") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "PENDING" || s === "PROCESSING")
    return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "FAILED" || s === "CANCELLED")
    return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const fmtVnd = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
    : "—";

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

const StaffPayment = () => {
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<number | null>(null);
  const [items, setItems] = useState<PaymentTx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null); // id đang update

  // ===== lấy stationId từ tài khoản staff giống StaffDashboard =====
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) current user
        const meRes = await api.get("/auth/me", { signal: controller.signal, withCredentials: true });
        const me = meRes.data;
        const userId =
          me?.user_id ?? me?.id ?? me?.userId ?? Number(localStorage.getItem("userId"));
        if (!userId) throw new Error("Không tìm thấy userId từ /auth/me");

        // 2) station manager mapping
        const res = await api.get(`/station-managers/${userId}`, { signal: controller.signal, withCredentials: true });
        const raw = res.data?.data ?? res.data;

        let stationObj: any = null;
        if (Array.isArray(raw)) {
          if (raw.length === 0) throw new Error("Chưa được gán vào trạm nào.");
          const first: ManagerStation = raw[0];
          stationObj = first.station ?? first.stationDto ?? first;
        } else {
          const row: ManagerStation = raw;
          stationObj = row.station ?? row.stationDto ?? row;
        }

        const id =
          stationObj?.id ?? stationObj?.stationId ?? Number(localStorage.getItem("staff_station_id"));
        if (!id) throw new Error("Không xác định được stationId");
        setStationId(Number(id));
      } catch (e: any) {
        setError(e?.message || "Không lấy được trạm được phân công.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ===== tải danh sách payment của trạm =====
  const fetchPayments = async (sid?: number | null) => {
    if (!sid) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/api/payment/getPaymentS/${sid}`, { withCredentials: true });
      // đáp án chuẩn: { code, message, data: PaymentTransactionResponse[] }
      const arr: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // map nới lỏng phòng khi BE đổi key
      const mapped: PaymentTx[] = arr.map((r) => ({
        id: r?.id ?? r?.transactionId ?? r?.txId,
        transactionId: r?.transactionId,
        type: r?.type,
        method: r?.method,
        referenceId: r?.referenceId ?? r?.reservationId ?? r?.sessionId,
        amount: Number(r?.amount ?? r?.money ?? 0),
        status: r?.status,
        orderId: r?.orderId,
        transactionNo: r?.transactionNo ?? r?.txnNo,
        createdAt: r?.createdAt,
        updatedAt: r?.updatedAt,
        data: r,
      }));
      setItems(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Tải danh sách payment thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) fetchPayments(stationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  const successCount = useMemo(
    () => items.filter((x) => normUp(x.status) === "SUCCESS").length,
    [items]
  );

  const onMarkSuccess = async (id?: number) => {
    if (!id) return;
    try {
      setUpdating(id);
      await api.put(`/api/payment/pay/${id}`, {}, { withCredentials: true });
      toast.success("Payment updated to SUCCESS");
      setItems((xs) =>
        xs.map((x) => (x.id === id ? { ...x, status: "SUCCESS", updatedAt: new Date().toISOString() } : x))
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <StaffLayout
      title="Payments"
      actions={
        <Button
          variant="outline"
          onClick={() => fetchPayments(stationId)}
          disabled={loading}
          className="rounded-xl"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            Payments at this Station
          </CardTitle>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full">
            {successCount} SUCCESS
          </Badge>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100/70 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No payments found for this station.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-slate-300 hover:bg-transparent">
                    <TableHead className="w-[110px] text-slate-900 font-semibold">ID</TableHead>
                    <TableHead className="w-[140px] text-slate-900 font-semibold">Type</TableHead>
                    <TableHead className="w-[120px] text-slate-900 font-semibold">Method</TableHead>
                    <TableHead className="w-[140px] text-slate-900 font-semibold">Reference</TableHead>
                    <TableHead className="w-[140px] text-slate-900 font-semibold">Amount</TableHead>
                    <TableHead className="w-[160px] text-slate-900 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-900 font-semibold">Order / Txn</TableHead>
                    <TableHead className="w-[200px] text-slate-900 font-semibold">Time</TableHead>
                    <TableHead className="w-[160px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => {
                    const canMark = normUp(r.status) !== "SUCCESS";
                    return (
                      <TableRow key={r.id} className="border-b-slate-200/80 hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-900">{r.id ?? r.transactionId}</TableCell>
                        <TableCell className="text-slate-800">{r.type || "—"}</TableCell>
                        <TableCell className="text-slate-800">{r.method || "—"}</TableCell>
                        <TableCell className="text-slate-800">{r.referenceId ?? "—"}</TableCell>
                        <TableCell className="text-slate-800">{fmtVnd(r.amount)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusBadge(r.status)} rounded-full`}>
                            {r.status || "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-800">
                          <div className="text-[13px] leading-tight">
                            {r.orderId ? <div>Order: <b>{r.orderId}</b></div> : null}
                            {r.transactionNo ? <div>Txn: <b>{r.transactionNo}</b></div> : null}
                            {!r.orderId && !r.transactionNo ? "—" : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-800">
                          <div className="text-[13px] leading-tight">
                            <div>Created: <b>{fmtTime(r.createdAt)}</b></div>
                            <div>Updated: <b>{fmtTime(r.updatedAt)}</b></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {canMark ? (
                            <Button
                              size="sm"
                              onClick={() => onMarkSuccess(r.id)}
                              disabled={updating === r.id}
                              className="rounded-full"
                            >
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              {updating === r.id ? "Updating…" : "Mark SUCCESS"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </StaffLayout>
  );
};

export default StaffPayment;
