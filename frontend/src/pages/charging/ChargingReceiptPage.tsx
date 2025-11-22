import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Battery,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Hash,
  MapPin,
  TicketPercent,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import api from "../../api/axios";

/** ===== Types ===== */
type SessionSnapshot = {
  id: number;
  stationId?: number;
  pillarId?: number;
  driverUserId?: number;
  vehicleId?: number;
  status: string;          // COMPLETED | ...
  energyCount: number;     // kWh
  chargedAmount: number;   // tiền
  ratePerKwh?: number;
  startTime: string;       // ISO
  endTime?: string | null;
  paymentMethod?: string;  // WALLET/VNPAY/CASH/...
  currency?: string;       // "VND" | "USD" ...
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
const fmtMoneyCurrency = (n?: number, currency?: string) => {
  if (!Number.isFinite(Number(n))) return "—";
  const cur = (currency || "VND").toUpperCase();
  try {
    return new Intl.NumberFormat(cur === "VND" ? "vi-VN" : undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: cur === "VND" ? 0 : 2,
      minimumFractionDigits: cur === "VND" ? 0 : 2,
    }).format(Number(n));
  } catch {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionIdParam) {
        setLoading(false);
        toast({ title: "Missing session", description: "Không có sessionId.", variant: "destructive" });
        return;
      }

      const stop = JSON.parse(localStorage.getItem(`session_stop_${sessionIdParam}`) || "null");
      const last = JSON.parse(localStorage.getItem(`session_last_${sessionIdParam}`) || "null");

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
      } catch {}

      const currency = (stop?.currency ?? last?.currency ?? "VND") as string;
      const amount = Number(
        (stop?.totalAmount ?? stop?.totalCost ?? undefined) ??
        (last?.chargedAmount ?? 0)
      );
      const energyRaw = Number(
        (stop?.totalEnergy ?? undefined) ??
        (last?.energyCount ?? stop?.energyCount ?? 0)
      );
      const ratePayload = Number(stop?.ratePerKwh ?? last?.ratePerKwh);
      const rate = Number.isFinite(ratePayload)
        ? ratePayload
        : (energyRaw > 0 && amount > 0 ? amount / energyRaw : undefined);

      const energy = energyRaw > 0 ? energyRaw : (Number.isFinite(rate) && amount > 0 ? amount / Number(rate) : 0);

      const startTime = (stop?.startTime ?? last?.startTime) as string | undefined;
      const endTime = (stop?.endTime ?? last?.endTime) as string | undefined;

      if (!cancelled) {
        setSnap({
          id: Number(sessionIdParam),
          stationId: stop?.stationId ?? last?.stationId,
          pillarId: stop?.pillarId ?? last?.pillarId,
          driverUserId: stop?.driverUserId ?? last?.driverUserId,
          vehicleId: stop?.vehicleId ?? last?.vehicleId,
          status: (stop?.status || last?.status || "COMPLETED"),
          energyCount: Number.isFinite(energy) ? energy : 0,
          chargedAmount: Number.isFinite(amount) ? amount : 0,
          ratePerKwh: rate,
          startTime: startTime || last?.startTime,
          endTime: endTime || null,
          paymentMethod: (stop?.paymentMethod ?? last?.paymentMethod) as string,
          currency,
        });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionIdParam, reservationIdParam, toast]);

  const pricePerKwhTxt = useMemo(
    () => fmtMoneyCurrency(snap?.ratePerKwh, snap?.currency),
    [snap?.ratePerKwh, snap?.currency]
  );

  const isSuccess = (snap?.status || "").toUpperCase() === "COMPLETED";
  const mustPay = (snap?.chargedAmount ?? 0) > 0 &&
                  !["WALLET", "CASH"].includes((snap?.paymentMethod || "").toUpperCase());

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

  const openVoucher = () => {
    if (!snap) return;
    navigate("/session/voucher", {
      state: {
        tab: "mine",
        returnTo: window.location.pathname + window.location.search,
        sessionId: snap.id,
        amount: snap.chargedAmount ?? 0,
      },
    });
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
              <div className="text-3xl font-extrabold text-sky-700">
                {loading || !snap ? "—" : fmtDuration(snap?.startTime, snap?.endTime)}
              </div>
              <div className="text-xs text-sky-700/80 mt-1">Session Duration</div>
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
            <DetailRow icon={<Hash className="w-4 h-4" />} label="Port" value={resv?.pillarCode || (snap?.pillarId ? `P${snap?.pillarId}` : "—")} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Start Time" value={fmtDateTime(snap?.startTime)} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="End Time" value={fmtDateTime(snap?.endTime)} />
            <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Rate / kWh" value={pricePerKwhTxt} />
            <DetailRow icon={<Car className="w-4 h-4" />} label="Vehicle" value={veh ? `${veh.make ?? ""} ${veh.model ?? ""}`.trim() || `#${veh.id}` : (snap?.vehicleId ? `#${snap.vehicleId}` : "—")} />
            <DetailRow icon={<Battery className="w-4 h-4" />} label="Battery Capacity" value={veh?.batteryCapacityKwh ? `${veh.batteryCapacityKwh} kWh` : "—"} />
            <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Payment Method" value={(() => {
              const s = (snap?.paymentMethod || "").toString().toUpperCase();
              if (s === "WALLET") return "Wallet";
              if (s === "VNPAY") return "VNPay";
              if (s === "POSTPAID") return "Postpaid";
              if (s === "PREPAID") return "Prepaid";
              if (s === "CASH") return "Cash";
              return s || "—";
            })()} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end mt-6 print:hidden">
          {(snap?.paymentMethod || "").toString().toUpperCase() === "CASH" && (
            <Button
              onClick={() =>
                navigate("/session/payment/cash", {
                  state: {
                    sessionId: snap?.id,
                    reservationId: reservationIdParam,
                    amount: snap?.chargedAmount ?? 0,
                    stationName: resv?.stationName || "",
                    portLabel: resv?.pillarCode || (snap?.pillarId ? `P${snap?.pillarId}` : ""),
                    startTime: snap?.startTime,
                    endTime: snap?.endTime || "",
                    energyKwh: snap?.energyCount ?? 0,
                    description: `Charging session #${snap?.id}`,
                  },
                })
              }
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Pay by Cash at Station
            </Button>
          )}

          {mustPay && (
            <Button onClick={goToPayment} className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
              Pay now
            </Button>
          )}

          {!mustPay && (
            <Button 
              variant="outline" 
              onClick={() => {
                // Xóa cờ sạc để ChargingGuard cho phép đi qua
                sessionStorage.removeItem("IS_CHARGING");
                navigate("/dashboard");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          )}

          {mustPay && (
            <Button variant="outline" onClick={openVoucher}>
              <TicketPercent className="w-4 h-4 mr-2" />
              Apply voucher
            </Button>
          )}
        </div>

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
