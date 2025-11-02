// src/pages/staff/StaffPayments.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, Receipt, RefreshCcw } from "lucide-react";
import { useToast } from "../ui/use-toast";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";

/* -------- Types khớp BE -------- */
type PaymentTx = {
  id: number;
  txnRef: string;
  amount: number;                 // BigDecimal on BE
  orderInfo?: string | null;
  vnpTransactionNo?: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;              // ISO
  type: "CHARGING-SESSION" | "WALLET" | string;
  method?: string | null;
  referenceId?: number | null;    // charging_session.id
  userId?: number | null;
  username?: string | null;

  // --- Optional fields BE có thể thêm để tiện FE (gợi ý) ---
  // stationName?: string;
  // connectorCode?: string;
  // vehicleLabel?: string;
  // energyKwh?: number;
};

type Paginated<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
};

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const isToday = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

const StaffPayments = () => {
  const { toast } = useToast();

  /* ---- state ---- */
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stationId, setStationId] = useState<number | null>(null);

  // Dữ liệu phân trang (nếu muốn cuộn/next page sau này)
  const [pendingPage, setPendingPage] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const pageSize = 20;

  const [pending, setPending] = useState<Paginated<PaymentTx> | null>(null);
  const [completed, setCompleted] = useState<Paginated<PaymentTx> | null>(null);

  /* ---- load stationId ---- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) user hiện tại
        const me = await api.get<any>("/auth/me", { withCredentials: true });
        const userId: number =
          Number(me?.data?.id ?? me?.data?.user_id ?? me?.data?.user?.id ?? me?.data?.data?.id);
        if (!userId) throw new Error("Không xác định được user hiện tại.");

        // 2) trạm của manager này
        const st = await api.get<any>(`/station-managers/${userId}`, { withCredentials: true });
        const sid = Number(st?.data?.id ?? st?.data?.stationId ?? st?.data?.data?.id);
        if (!sid) throw new Error("Chưa gán trạm cho nhân viên này.");
        if (!mounted) return;
        setStationId(sid);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Load station failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---- fetch payments by station ---- */
  const fetchPayments = async (sid: number) => {
    // 2 call song song: pending + completed
    const [pRes, cRes] = await Promise.all([
      api.get<Paginated<PaymentTx>>(`/api/payment/station/${sid}`, {
        params: { status: "PENDING", page: pendingPage, pageSize },
        withCredentials: true,
      }),
      api.get<Paginated<PaymentTx>>(`/api/payment/station/${sid}`, {
        params: { status: "SUCCESS", page: completedPage, pageSize },
        withCredentials: true,
      }),
    ]);

    setPending(pRes.data);
    setCompleted(cRes.data);
  };

  useEffect(() => {
    if (!stationId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchPayments(stationId);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Load payments failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, pendingPage, completedPage]);

  const onRefresh = async () => {
    if (!stationId) return;
    setRefreshing(true);
    try {
      await fetchPayments(stationId);
    } finally {
      setRefreshing(false);
    }
  };

  /* ---- Derived summaries ---- */
  const todaysCollections = useMemo(() => {
    if (!completed?.content?.length) return 0;
    return completed.content
      .filter((t) => t.status === "SUCCESS" && isToday(t.createdAt))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [completed]);

  const pendingCount = pending?.totalElements ?? 0;

  const completedRows = completed?.content ?? [];
  const pendingRows = pending?.content ?? [];

  const paymentActions = (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center px-3 py-1 bg-success/10 text-success rounded-lg">
        <DollarSign className="w-4 h-4 mr-1" />
        <span className="font-medium">{fmtUSD(todaysCollections)}</span>
        <span className="text-xs ml-1">Today’s Collections</span>
      </div>
      <div className="flex items-center px-3 py-1 bg-warning/10 text-warning rounded-lg">
        <Clock className="w-4 h-4 mr-1" />
        <span className="font-medium">{pendingCount}</span>
        <span className="text-xs ml-1">Pending</span>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCcw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );

  const handleRecordPayment = (tx: PaymentTx) => {
    // Ở bản thật: mở modal “Record Payment” / gọi API cập nhật status -> SUCCESS
    toast({
      title: "Record Payment",
      description: `Mark as paid: ${fmtUSD(Number(tx.amount || 0))} — ${tx.txnRef}`,
    });
  };

  const handlePrintReceipt = (tx: PaymentTx) => {
    // Gợi ý: mở route /receipt/:txnRef
    toast({
      title: "Receipt",
      description: `Printing receipt for ${tx.txnRef}`,
    });
  };

  /* ---- Render ---- */
  if (loading) {
    return (
      <StaffLayout title="Payment Management">
        <div className="p-8 text-sm text-muted-foreground">Loading…</div>
      </StaffLayout>
    );
  }

  if (error) {
    return (
      <StaffLayout title="Payment Management">
        <div className="p-8 flex items-center gap-3">
          <span className="text-sm text-red-600">{error}</span>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </StaffLayout>
    );
  }

  if (!stationId) {
    return (
      <StaffLayout title="Payment Management">
        <div className="p-8 text-sm text-muted-foreground">No station assigned.</div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Payment Management" actions={paymentActions}>
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today’s Collections</p>
                  <p className="text-2xl font-bold text-success">{fmtUSD(todaysCollections)}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-primary">
                    {completedRows.filter((x) => x.status === "SUCCESS" && isToday(x.createdAt)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="w-5 h-5 mr-3 text-primary" />
              Pending Payments ({pendingCount})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Sessions requiring payment at this station</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Txn Ref</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRows.map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{tx.txnRef || `#${tx.id}`}</div>
                          <div className="text-xs text-muted-foreground">Session #{tx.referenceId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-bold text-primary">{fmtUSD(Number(tx.amount || 0))}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => handleRecordPayment(tx)}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            Record Payment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!pendingRows.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground py-6 text-center">
                        No pending payments.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Completed Payments */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <CheckCircle className="w-5 h-5 mr-3 text-primary" />
              Completed Payments
            </CardTitle>
            <p className="text-sm text-muted-foreground">Recent payments processed at this station</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Txn Ref</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRows.map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{tx.txnRef || `#${tx.id}`}</div>
                          <div className="text-xs text-muted-foreground">Session #{tx.referenceId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-bold text-success">{fmtUSD(Number(tx.amount || 0))}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(tx)} className="border-primary/20 text-primary hover:bg-primary/10">
                            <Receipt className="w-3 h-3 mr-1" />
                            Print Receipt
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!completedRows.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground py-6 text-center">
                        No completed payments.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffPayments;