import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { motion, type Variants } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { useToast } from "../../hooks/use-toast";
import {
  ArrowLeft,
  Gift,
  TicketPercent,
  Coins,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

/* ================= Types ================= */
type ApiResp<T> = { code?: string; message?: string; data?: T } & Partial<T>;

type Me = {
  id?: number;
  user_id?: number;
  full_name?: string;
  total_points?: number;
  totalPoints?: number;
} & Record<string, any>;

type Voucher = {
  voucherId: number;
  code: string;
  description?: string;
  discountAmount: number;
  discountType: "AMOUNT" | "PERCENT";
  requiredPoints: number;
};


type UserVoucher = {
  code: string;
  description?: string;
  discountAmount: number;
  discountType: "AMOUNT" | "PERCENT";
  redeemedAt?: string | null;
  used: boolean;
};


type PointRow = {
  pointsEarned: number;
  amountPaid: string | number;
  createdAt: string;
};

/* ============== Helpers ============== */
const fmtMoneyVND = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const containerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ================= Page ================= */
const VoucherPage = () => {
  const { toast } = useToast();

  // me
  const [uid, setUid] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [points, setPoints] = useState<number>(0);

  // ★ fallback points tính từ history (khi /auth/me không có total_points)
  const [pointsFromHistory, setPointsFromHistory] = useState<number>(0);

  // loading states
  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // data
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucher[]>([]);
  const [pointHistory, setPointHistory] = useState<PointRow[]>([]);

  // redeem dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetVoucher, setTargetVoucher] = useState<Voucher | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // ====== Load ME ======
  useEffect(() => {
    (async () => {
      try {
        setLoadingMe(true);
        const me = await api.get<ApiResp<Me>>("/auth/me", { withCredentials: true }).catch(() => null);

        // console.debug("ME payload:", me?.data); // hữu ích khi debug

        const id =
          Number(me?.data?.id ?? me?.data?.user_id ?? (me as any)?.data?.data?.id) || undefined;

        if (id) setUid(id);

        const name =
          String(me?.data?.full_name ?? me?.data?.fullName ?? me?.data?.name ?? "User");
        setDisplayName(name);

        const p =
          Number(
            me?.data?.total_points ??
            me?.data?.totalPoints ??
            (me as any)?.data?.data?.total_points ??
            (me as any)?.data?.data?.totalPoints ??
            0
          ) || 0;

        setPoints(p);
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // ====== Load All Vouchers (Voucher Center) ======
  useEffect(() => {
    (async () => {
      try {
        setLoadingAll(true);
        // Load tất cả voucher chung từ admin (voucher center)
        const { data } = await api.get<ApiResp<Voucher[]>>(
          `/api/vouchers`,
          { withCredentials: true }
        );
        const list = Array.isArray(data?.data) ? data.data
          : Array.isArray(data) ? data
            : [];

        // Map từ VoucherResponse sang Voucher type
        const mapped: Voucher[] = list.map((v: any) => ({
          voucherId: v?.voucherId ?? v?.voucher_id ?? v?.id ?? 0,
          code: v?.code ?? "",
          description: v?.description ?? "",
          discountAmount: v?.discountAmount ?? v?.discount_amount ?? 0,
          discountType: v?.discountType ?? v?.discount_type ?? "AMOUNT",
          requiredPoints: v?.requiredPoints ?? v?.required_points ?? 0,
        }));

        setAllVouchers(mapped);
      } catch (e: any) {
        toast({
          title: "Không tải được danh sách voucher",
          description: e?.response?.data?.message || e?.message,
          variant: "destructive",
        });
        setAllVouchers([]);
      } finally {
        setLoadingAll(false);
      }
    })();
  }, [toast]);

  // ====== Load My Vouchers ======
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        setLoadingMine(true);
        const { data } = await api.get<ApiResp<UserVoucher[]>>(
          `/api/vouchers/user/${uid}`,
          { withCredentials: true }
        );
        setMyVouchers(data?.data ?? (Array.isArray(data) ? (data as any) : []));
      } catch (e: any) {
        toast({
          title: "Không tải được 'Voucher của tôi'",
          description: e?.response?.data?.message || e?.message,
          variant: "destructive",
        });
        setMyVouchers([]);
      } finally {
        setLoadingMine(false);
      }
    })();
  }, [uid, toast]);

  // ====== Load Point History ======
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        setLoadingHistory(true);
        const { data } = await api.get<ApiResp<PointRow[]>>(
          `/loyalty-point/history/${uid}`,
          { withCredentials: true }
        );
        const rows = data?.data ?? (Array.isArray(data) ? (data as any) : []);
        setPointHistory(rows);

        // ★ tính tổng điểm từ history để fallback hiển thị
        const sum = rows.reduce((s: number, r: any) => s + Number(r?.pointsEarned || 0), 0);
        setPointsFromHistory(sum);
      } catch (e: any) {
        toast({
          title: "Không tải được lịch sử điểm",
          description: e?.response?.data?.message || e?.message,
          variant: "destructive",
        });
        setPointHistory([]);
        setPointsFromHistory(0);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [uid, toast]);

  // ====== Redeem flow ======
  const askRedeem = (v: Voucher) => {
    setTargetVoucher(v);
    setConfirmOpen(true);
  };

  const doRedeem = async () => {
    if (!targetVoucher || !uid) return;
    setRedeeming(true);
    try {
      await api.post(
        "/loyalty-point/redeem",
        { userId: uid, voucherId: targetVoucher.voucherId },
        { withCredentials: true }
      );
      toast({
        title: "Đổi voucher thành công",
        description: `Bạn đã đổi mã ${targetVoucher.code}.`,
      });

      // refresh my vouchers
      try {
        const { data } = await api.get<ApiResp<UserVoucher[]>>(
          `/api/vouchers/user/${uid}`,
          { withCredentials: true }
        );
        setMyVouchers(data?.data ?? (Array.isArray(data) ? (data as any) : []));
      } catch { /* ignore */ }

      // refresh all vouchers (voucher center) để cập nhật quantity
      try {
        const { data } = await api.get<ApiResp<Voucher[]>>(
          `/api/vouchers`,
          { withCredentials: true }
        );
        const list = Array.isArray(data?.data) ? data.data
          : Array.isArray(data) ? data
            : [];
        const mapped: Voucher[] = list.map((v: any) => ({
          voucherId: v?.voucherId ?? v?.voucher_id ?? v?.id ?? 0,
          code: v?.code ?? "",
          description: v?.description ?? "",
          discountAmount: v?.discountAmount ?? v?.discount_amount ?? 0,
          discountType: v?.discountType ?? v?.discount_type ?? "AMOUNT",
          requiredPoints: v?.requiredPoints ?? v?.required_points ?? 0,
        }));
        setAllVouchers(mapped);
      } catch { /* ignore */ }

      // ★ refresh points: ưu tiên đọc lại /auth/me; nếu vẫn không có, sẽ fallback bằng history đã cập nhật
      try {
        const me = await api.get<ApiResp<Me>>("/auth/me", { withCredentials: true });
        const p =
          Number(
            me?.data?.total_points ??
            me?.data?.totalPoints ??
            (me as any)?.data?.data?.total_points ??
            (me as any)?.data?.data?.totalPoints ??
            0
          ) || 0;
        setPoints(p);
      } catch { /* ignore */ }

      setConfirmOpen(false);
      setTargetVoucher(null);
    } catch (e: any) {
      toast({
        title: "Đổi voucher thất bại",
        description:
          e?.response?.data?.message ||
          e?.message ||
          "Có thể bạn chưa đủ điểm hoặc voucher không hợp lệ.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  // ====== Derived ======
  const canRedeem = (v: Voucher) => (points || pointsFromHistory) >= (v?.requiredPoints ?? Number.MAX_SAFE_INTEGER);

  // ★ Điểm hiển thị ưu tiên từ /auth/me; nếu không có thì dùng tổng history
  const displayPoints = (points || pointsFromHistory);

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
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Rewards Center
            </span>
          </div>

          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-medium">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-600" />
            Earn & Redeem
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Title + Current points */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h5 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Manage vouchers, redeem rewards and points history
            </h5>
          </div>

          <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
            <CardContent className="px-5 py-3 flex items-center gap-3">
              <Coins className="w-5 h-5 text-amber-600" />
              <div className="text-sm">
                <div className="text-slate-500">Current Point</div>
                <div className="text-2xl font-extrabold text-amber-700">
                  {(loadingMe && loadingHistory) ? "—" : displayPoints.toLocaleString("vi-VN")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="voucher-center" className="w-full">
          <TabsList className="bg-white/60 backdrop-blur rounded-xl p-1 shadow-sm">
            <TabsTrigger value="voucher-center" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TicketPercent className="w-4 h-4 mr-2" />
              Voucher Center
            </TabsTrigger>
            <TabsTrigger value="my-vouchers" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Gift className="w-4 h-4 mr-2" />
              My Vouchers
            </TabsTrigger>
            <TabsTrigger value="point-history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* ============ Voucher Center ============ */}
          <TabsContent value="voucher-center" className="mt-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {loadingAll ? (
                <div className="col-span-full p-6 text-sm text-slate-500 flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading voucher…
                </div>
              ) : allVouchers.length === 0 ? (
                <div className="col-span-full p-6 text-sm text-slate-500">You do not have any</div>
              ) : (
                allVouchers.map((v) => {
                  const enough = canRedeem(v);
                  return (
                    <motion.div key={v.voucherId} variants={cardVariants}>
                      <Card className="shadow-2xl shadow-slate-900/10 border-0 bg-white/80 backdrop-blur-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">{v.code}</CardTitle>
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                              {v.discountType === "PERCENT"
                                ? `-${v.discountAmount ?? 0}%`
                                : `-${fmtMoneyVND(v.discountAmount)}`
                              }

                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{v.description || "—"}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Need:</span>
                            <span className="font-semibold">{v.requiredPoints.toLocaleString("vi-VN")} point</span>
                          </div>
                          <Separator />
                          <Button
                            disabled={!uid || !enough}
                            onClick={() => askRedeem(v)}
                            className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110 disabled:opacity-60"
                          >
                            {enough ? "Redeem by points" : "Not enough points"}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </TabsContent>

          {/* ============ My Vouchers ============ */}
          <TabsContent value="my-vouchers" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">My Voucher</CardTitle>
              </CardHeader>

              <CardContent>
                {loadingMine ? (
                  <div className="p-4 text-sm text-slate-500 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                  </div>
                ) : myVouchers.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">You have not redeemed any vouchers yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myVouchers.map((uv, idx) => (
                      <motion.div
                        key={`${uv.code}-${idx}`}
                        variants={cardVariants}
                        className="rounded-2xl border bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-900/10 p-5 flex flex-col gap-4 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-slate-900 tracking-tight">
                            {uv.code}
                          </div>

                          {uv.used ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 rounded-full flex items-center gap-1 px-3 py-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Used
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 rounded-full flex items-center gap-1 px-3 py-1">
                              <XCircle className="w-4 h-4" />
                              Not used
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-600 min-h-[28px]">
                          {uv.description || "—"}
                        </p>

                        {/* Discount block */}
                        <div className="bg-gradient-to-r from-sky-100 to-emerald-100 p-4 rounded-xl flex items-center justify-between border border-slate-200">
                          <span className="text-slate-600 text-sm font-medium">Discount</span>

                          <span className="text-xl font-extrabold text-slate-900">
                            {uv.discountType === "PERCENT"
                              ? `-${uv.discountAmount}%`
                              : `-${fmtMoneyVND(uv.discountAmount)}`}
                          </span>
                        </div>

                        {/* Redeem time */}
                        <div className="text-xs text-slate-500 flex flex-col gap-1">
                          <span className="font-medium">Redeemed at:</span>
                          <span className="text-slate-700">{fmtDateTime(uv.redeemedAt)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* ============ Lịch sử điểm ============ */}
          <TabsContent value="point-history" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="p-4 text-sm text-slate-500 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                  </div>
                ) : pointHistory.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">No history</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-slate-600">
                          <th className="px-4 py-3 font-medium">Time</th>
                          <th className="px-4 py-3 font-medium">Point</th>
                          <th className="px-4 py-3 font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointHistory.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-3">{fmtDateTime(row.createdAt)}</td>
                            <td className="px-4 py-3 font-semibold">{Number(row.pointsEarned || 0).toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-3">
                              {fmtMoneyVND(Number(row.amountPaid || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!loadingHistory && pointHistory.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                      Total history: {pointHistory.length}
                    </Badge>
                    <Badge variant="outline">
                      Total redeemed points:{" "}
                      {pointHistory
                        .reduce((s, r) => s + (r?.pointsEarned || 0), 0)
                        .toLocaleString("vi-VN")}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Redeem confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Đổi voucher</DialogTitle>
            <DialogDescription>
              {targetVoucher ? (
                <>
                  You will use <b>{targetVoucher.requiredPoints.toLocaleString("vi-VN")}</b> point to redeem voucher{" "}
                  <b>{targetVoucher.code}</b> (giảm {targetVoucher.discountType === "PERCENT"
                    ? `${targetVoucher.discountAmount}%`
                    : fmtMoneyVND(targetVoucher.discountAmount)
                  })

                </>
              ) : (
                "—"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={doRedeem} disabled={redeeming}>
              {redeeming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoucherPage;
