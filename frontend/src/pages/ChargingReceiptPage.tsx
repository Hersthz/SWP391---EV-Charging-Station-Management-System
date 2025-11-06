import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Battery,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Hash,
  MapPin,
  Printer,
  Share2,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import api from "../api/axios";

/** ===== Types ===== */
type SessionSnapshot = {
  id: number;
  stationId?: number;
  pillarId?: number;
  driverUserId?: number;
  vehicleId?: number;
  status: string;          // COMPLETED | ...
  energyCount: number;     // kWh
  chargedAmount: number;   // tiền (USD hoặc VND tùy BE)
  ratePerKwh?: number;
  startTime: string;       // ISO
  endTime?: string | null;
  paymentMethod?: string;  // optional: WALLET/VNPAY/POSTPAID...
  currency?: string;       // optional: "VND" | "USD" ...
};

type ReservationBrief = {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode?: string;
};

type VehicleBrief = {
  id: number;
  make?: string;
  model?: string;
  licensePlate?: string;
  batteryCapacityKwh?: number;
};

/** ===== Helpers ===== */
const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const fmtDuration = (start?: string, end?: string | null) => {
  if (!start) return "—";
  const t0 = new Date(start).getTime();
  const t1 = end ? new Date(end).getTime() : Date.now();
  const sec = Math.max(0, Math.floor((t1 - t0) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};

/** ===== Page ===== */
const ChargingReceiptPage = () => {
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const reservationIdParam = searchParams.get("reservationId")
    ? Number(searchParams.get("reservationId"))
    : undefined;

  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);
  const [resv, setResv] = useState<ReservationBrief | null>(null);
  const [veh, setVeh] = useState<VehicleBrief | null>(null);
  const [payRequired, setPayRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionIdParam) {
        setLoading(false);
        toast({ title: "Missing session", description: "Không có sessionId.", variant: "destructive" });
        return;
      }

      // 1) Đọc dữ liệu đã lưu
      const stop = JSON.parse(localStorage.getItem(`session_stop_${sessionIdParam}`) || "null");
      const last = JSON.parse(localStorage.getItem(`session_last_${sessionIdParam}`) || "null");
      const needPay =
        (typeof stop?.requiresPayment === "boolean" ? stop.requiresPayment : undefined) ??
        ((stop?.paymentMethod || last?.paymentMethod || "").toString().toUpperCase() !== "WALLET");
      setPayRequired(!!needPay);

      // 2) Reservation brief: ưu tiên cache, nếu thiếu thì lấy theo kiểu StatusCards
      let brief = reservationIdParam
        ? JSON.parse(localStorage.getItem(`reservation_cache_${reservationIdParam}`) || "null")
        : null;

      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId = me.data?.user_id ?? me.data?.id;

        if (!brief && userId && reservationIdParam) {
          const { data } = await api.get(`/user/${userId}/reservations`, { withCredentials: true });
          const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          const row = arr.find((x: any) => Number(x?.reservationId) === Number(reservationIdParam));
          if (row && !cancelled) {
            brief = {
              reservationId: Number(row.reservationId),
              stationId: Number(row.stationId),
              stationName: String(row.stationName ?? "Station"),
              pillarId: Number(row.pillarId),
              pillarCode: String(row.pillarCode ?? `P${row.pillarId}`),
            };
          }
        }
        if (!cancelled) setResv(brief || null);

        // 3) Vehicle
        const vid = stop?.vehicleId ?? last?.vehicleId;
        if (userId && vid) {
          const vres = await api.get(`/vehicle/${userId}`, { withCredentials: true });
          const list = vres.data?.data ?? vres.data?.content ?? vres.data ?? [];
          const found = Array.isArray(list) ? list.find((x: any) => Number(x?.id ?? x?.vehicleId) === Number(vid)) : null;
          if (found && !cancelled) {
            setVeh({
              id: Number(found.id ?? found.vehicleId),
              make: found.make,
              model: found.model,
              licensePlate: found.licensePlate ?? found.license_plate,
              batteryCapacityKwh: Number(found.batteryCapacityKwh ?? found.battery_capacity_kwh),
            });
          }
        }
      } catch { /* optional */ }

      // 4) Ghép dữ liệu hiển thị (ưu tiên stop payload, fallback last snapshot)
      const pick = (k: string, def?: any) =>
        stop && stop[k] != null ? stop[k] : last && last[k] != null ? last[k] : def;

      if (!cancelled) {
        setSnap({
          id: Number(sessionIdParam),
          stationId: pick("stationId"),
          pillarId: pick("pillarId"),
          driverUserId: pick("driverUserId"),
          vehicleId: pick("vehicleId"),
          status: (stop?.status || last?.status || "COMPLETED"),
          energyCount: Number(pick("energyCount", stop?.totalEnergy ?? 0)),
          chargedAmount: Number(pick("chargedAmount", stop?.totalCost ?? 0)),
          ratePerKwh: pick("ratePerKwh", stop?.ratePerKwh),
          startTime: pick("startTime", stop?.startTime),
          endTime: pick("endTime", stop?.endTime),
          paymentMethod: pick("paymentMethod", stop?.paymentMethod),
          currency: pick("currency", stop?.currency ?? "VND"),
        });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionIdParam, reservationIdParam, toast]);


  const durationTxt = useMemo(() => fmtDuration(snap?.startTime, snap?.endTime), [snap?.startTime, snap?.endTime]);

  const avgPriceTxt = useMemo(() => {
    const price = Number(snap?.ratePerKwh);
    if (!Number.isFinite(price)) return "—";
    return fmtMoney(price);
  }, [snap?.ratePerKwh, snap?.currency]);

  const avgPowerKwTxt = useMemo(() => {
    if (!snap?.startTime || !snap?.endTime) return "—";
    const t0 = new Date(snap.startTime).getTime();
    const t1 = new Date(snap.endTime).getTime();
    const hours = Math.max(0.001, (t1 - t0) / 3_600_000);
    const kw = (Number(snap.energyCount || 0) / hours) || 0;
    return `${kw.toFixed(1)} kW`;
  }, [snap?.startTime, snap?.endTime, snap?.energyCount]);

  const paymentLabel = useMemo(() => {
    const s = (snap?.paymentMethod || "").toString().toUpperCase();
    if (s === "WALLET") return "Wallet";
    if (s === "VNPAY") return "VNPay";
    if (s === "POSTPAID") return "Postpaid";
    if (s === "PREPAID") return "Prepaid";
    return s || "—";
  }, [snap?.paymentMethod]);

  const isSuccess = (snap?.status || "").toUpperCase() === "COMPLETED";

  /** Actions */
  const onPrint = () => window.print();
  const onDownload = () => window.print(); // tạm dùng print dialog để save PDF
  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Charging receipt",
          text: `Receipt for session #${snap?.id || ""}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied" });
      }
    } catch {
      /* noop */
    }
  };

  const goToPayment = () => {
    if (!snap) return;
    navigate("/session/payment", {
      state: {
        sessionId: snap.id,
        amount: snap.chargedAmount ?? 0,
        stationName: resv?.stationName || "",
        portLabel: resv?.pillarCode || (snap.pillarId ? `P${snap.pillarId}` : ""),
        startTime: snap.startTime,
        endTime: snap.endTime || "", 
        energyKwh: snap.energyCount ?? 0,
        description: `Charging session #${snap.id}`,
      },
    });
  };

  const mustPay = payRequired && (snap?.chargedAmount ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-primary">Charging Receipt</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success banner */}
        <Card className="border-2 border-emerald-200/60">
          <CardContent className="py-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-emerald-700">
                  {isSuccess ? "Charging Successful" : "Session Stopped"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Thank you for using the service. Here is an overview of your charging session.
                </p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {isSuccess ? "Completed" : (snap?.status ?? "—")}
                </Badge>
                <Badge className="rounded-full">#{snap?.id ?? "—"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top summary numbers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card className="rounded-2xl border-2 border-amber-100">
            <CardContent className="p-5 text-center">
              <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-3xl font-extrabold text-amber-700">
                {loading || !snap
                  ? "—"
                  : `${(snap.chargedAmount || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`}
              </div>
              <div className="text-xs text-amber-700/80 mt-1">Total Cost</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-emerald-100">
            <CardContent className="p-5 text-center">
              <Battery className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <div className="text-3xl font-extrabold text-emerald-700">
                {loading || !snap ? "—" : `${(snap.energyCount || 0).toFixed(1)} kWh`}
              </div>
              <div className="text-xs text-emerald-700/80 mt-1">Energy Delivered</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-sky-100">
            <CardContent className="p-5 text-center">
              <Clock className="w-5 h-5 text-sky-600 mx-auto mb-2" />
              <div className="text-3xl font-extrabold text-sky-700">{loading || !snap ? "—" : durationTxt}</div>
              <div className="text-xs text-sky-700/80 mt-1">Session Duration</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-violet-100">
            <CardContent className="p-5 text-center">
              <BadgeCheck className="w-5 h-5 text-violet-600 mx-auto mb-2" />
              <div className="text-3xl font-extrabold text-violet-700">{avgPowerKwTxt}</div>
              <div className="text-xs text-violet-700/80 mt-1">Average Power</div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <Card className="rounded-2xl border-2 border-primary/10 mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Session Details
              <Badge variant="outline" className="ml-2 rounded-full border-dashed">
                #{snap?.id ?? "—"}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Station" value={resv?.stationName || "—"} />
            <DetailRow icon={<Hash className="w-4 h-4" />} label="Port" value={resv?.pillarCode || (snap?.pillarId ? `P${snap.pillarId}` : "—")} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Start Time" value={fmtDateTime(snap?.startTime)} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="End Time" value={fmtDateTime(snap?.endTime)} />
            <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Rate / kWh" value={avgPriceTxt} />
            <DetailRow icon={<Car className="w-4 h-4" />} label="Vehicle" value={veh ? `${veh.make ?? ""} ${veh.model ?? ""}`.trim() || `#${veh.id}` : (snap?.vehicleId ? `#${snap.vehicleId}` : "—")} />
            <DetailRow icon={<Battery className="w-4 h-4" />} label="Battery Capacity" value={veh?.batteryCapacityKwh ? `${veh.batteryCapacityKwh} kWh` : "—"} />
            <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Payment Method" value={paymentLabel} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end mt-6 print:hidden">
          {mustPay && (
            <Button onClick={goToPayment} className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
              Pay now
            </Button>
          )}

          {/* Ẩn Back khi bắt buộc thanh toán */}
          {!mustPay && (
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          )}
          
          <Button variant="outline" onClick={onShare}><Share2 className="w-4 h-4 mr-2" />Share</Button>
          <Button variant="outline" onClick={onPrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button onClick={onDownload}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>

        {/* Footer note for print */}
        <div className="mt-8 text-xs text-muted-foreground text-center print:mt-16">
          Thank you for charging with us. For support, please contact our hotline.
        </div>
      </div>
    </div>
  );
};

/** Small detail row component */
const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border p-3 flex items-center justify-between">
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="shrink-0">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-semibold text-right">{value}</span>
  </div>
);

export default ChargingReceiptPage;
