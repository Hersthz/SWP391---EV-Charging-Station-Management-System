import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Battery,
  Clock,
  DollarSign,
  MapPin,
  PauseCircle,
  PlayCircle,
  StopCircle,
  Zap,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import api from "../api/axios";

/** ===== Config ===== */
const TICK_MS = 1000; // patch mỗi 1s
const KWH_PER_SEC = 0.45; // mô phỏng kWh tăng mỗi giây ở FE

/** ===== Types ===== */
interface SessionSnapshot {
  id: number;
  stationId?: number;
  pillarId?: number;
  driverUserId?: number;
  vehicleId?: number;
  status: string; // ACTIVE | COMPLETED ...
  energyCount: number; // kWh
  chargedAmount: number; // tiền
  ratePerKwh?: number;
  startTime: string; // ISO
  endTime?: string | null;
  currency?: string;
}

type ReservationBrief = {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode?: string;
  endTime?: string;
};

type VehicleBrief = {
  id: number;
  batteryCapacityKwh?: number;
  socNow?: number; // 0..1
};

/** ===== Helpers ===== */
const fmtTime = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

const fmtMoney = (n: number, currency?: string) =>
  Number.isFinite(n)
    ? (currency?.toUpperCase() === "VND"
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
        : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    : "—";

const toCurrency = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const normalizeSoc = (v: any): number | undefined => {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return 0;
  return Math.min(1, n > 1 ? n / 100 : n);
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** ===== Component ===== */
const ChargingSessionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // URL params
  const sessionIdParam = searchParams.get("sessionId");
  const reservationIdParam = searchParams.get("reservationId")
    ? Number(searchParams.get("reservationId"))
    : undefined;
  const vehicleIdParam = searchParams.get("vehicleId")
    ? Number(searchParams.get("vehicleId"))
    : undefined;
  const initialSocParam = searchParams.get("initialSoc")
    ? Number(searchParams.get("initialSoc"))
    : undefined;

  // UI state
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Snapshot từ server
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);

  // local tick
  const currentEnergyRef = useRef<number>(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reservation info (real)
  const [resv, setResv] = useState<ReservationBrief | null>(null);

  // Vehicle info (real) => để tính SOC & thanh năng lượng
  const [vehicle, setVehicle] = useState<VehicleBrief | null>(null);

  // Target SOC (0..1) – LUÔN FULL
  const [targetSoc, setTargetSoc] = useState<number | null>(1);
  const [maxSoc, setMaxSoc] = useState<number | null>(null);
  const [socNowFromBE, setSocNowFromBE] = useState<number | null>(null);

  // initial SOC
  const [initialSocFromBE, setInitialSocFromBE] = useState<number | null>(
    Number.isFinite(initialSocParam!) ? initialSocParam! : null
  );

  const autoStoppingRef = useRef(false);

  // --- Station/Pillar label
  const stationName = resv?.stationName || "—";
  const pillarCode = resv?.pillarCode ? resv.pillarCode.replace(/^P/i, "P") : resv?.pillarId ? `P${resv.pillarId}` : "—";

  // --- BADGE
  const isCompleted = (snap?.status || "").toUpperCase() === "COMPLETED";

  // --- Thời gian
  const elapsedSec = useMemo(() => {
    if (!snap?.startTime) return 0;
    const end = snap.endTime ? new Date(snap.endTime).getTime() : Date.now();
    const start = new Date(snap.startTime).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
  }, [snap?.startTime, snap?.endTime, snap?.energyCount, snap?.status]);

  // --- SOC base info
  const batteryKwh = vehicle?.batteryCapacityKwh || undefined;
  const initialSocFrac =
    initialSocFromBE != null ? initialSocFromBE : typeof vehicle?.socNow === "number" ? vehicle!.socNow! : undefined;

  // === current SOC fraction dựa trên energyCount ===
  const computedSocFrac = useMemo(() => {
    if (typeof socNowFromBE === "number") return clamp01(socNowFromBE);
    if (!batteryKwh || initialSocFrac == null || !snap) return undefined;
    const e = Number(snap.energyCount ?? 0);
    return clamp01(initialSocFrac + e / batteryKwh);
  }, [socNowFromBE, batteryKwh, initialSocFrac, snap?.energyCount, snap]);

  const socPercent = useMemo(
    () => (typeof computedSocFrac === "number" ? Math.round(computedSocFrac * 100) : undefined),
    [computedSocFrac]
  );

  // --- ENERGY PROGRESS tới FULL
  const energyProgress = useMemo(() => {
    if (!batteryKwh || initialSocFrac == null || !snap) return undefined;
    if (1 <= initialSocFrac) return undefined;
    const targetEnergy = (1 - initialSocFrac) * batteryKwh; // tới 100%
    const pct = Math.min(100, Math.max(0, (snap.energyCount / targetEnergy) * 100));
    return pct;
  }, [batteryKwh, initialSocFrac, snap]);

  // ====== Fetch reservation (real) ======
  useEffect(() => {
    let cancelled = false;
    const loadReservation = async () => {
      if (!reservationIdParam) return;
      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          typeof me.data?.user_id === "number" ? me.data.user_id : typeof me.data?.id === "number" ? me.data.id : undefined;

        try {
          const r1 = await api.get(`/book/${reservationIdParam}`, { withCredentials: true });
          const d = r1.data?.data ?? r1.data;
          if (d?.reservationId && !cancelled) {
            setResv({
              reservationId: d.reservationId,
              stationId: d.stationId,
              stationName: d.stationName,
              pillarId: d.pillarId,
              pillarCode: d.pillarCode,
            });
            return;
          }
        } catch {}

        if (userId) {
          const { data } = await api.get(`/user/${userId}/reservations`, { withCredentials: true });
          const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          const row = arr.find((x: any) => Number(x?.reservationId) === reservationIdParam);
          if (row && !cancelled) {
            setResv({
              reservationId: Number(row.reservationId),
              stationId: Number(row.stationId),
              stationName: String(row.stationName ?? "Station"),
              pillarId: Number(row.pillarId),
              pillarCode: String(row.pillarCode ?? `P${row.pillarId}`),
              endTime: row.endTime ?? undefined,
            });
          }
        }
      } catch {
        /* ignore */
      }
    };
    loadReservation();
    return () => {
      cancelled = true;
    };
  }, [reservationIdParam]);

  // ====== Lấy snapshot + initial ======
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionIdParam) {
        setLoading(false);
        return;
      }
      try {
        // 1) seed từ localStorage ngay khi có sessionId
        const meta = JSON.parse(localStorage.getItem(`session_meta_${sessionIdParam}`) || "null");
        if (meta && !cancelled) {
          const nowIso = new Date().toISOString();
          setSnap(s => s ?? {
            id: Number(sessionIdParam),
            stationId: undefined,
            pillarId: undefined,
            driverUserId: undefined,
            vehicleId: meta.vehicleId,
            status: "ACTIVE",
            energyCount: 0,
            chargedAmount: 0,
            ratePerKwh: undefined,
            startTime: nowIso,
            endTime: null,
            currency: undefined,
          });
          if (typeof meta.initialSoc === "number") setInitialSocFromBE(meta.initialSoc);
          setTargetSoc(1);

          // 2) vehicle (nếu có id)
          const effectiveVehicleId = meta.vehicleId ?? vehicleIdParam;
          if (effectiveVehicleId) {
            const v = await fetchVehicleOfSession(Number(effectiveVehicleId));
            if (!cancelled && v) setVehicle(v);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionIdParam, vehicleIdParam]);


  

  /** === Start/Stop tick helpers === */
  const startTick = () => {
    if (!sessionIdParam || tickTimer.current) return;
    currentEnergyRef.current = Number(snap?.energyCount ?? 0);

    tickTimer.current = setInterval(async () => {
      currentEnergyRef.current = Number((currentEnergyRef.current + KWH_PER_SEC).toFixed(2));
      try {
        const { data } = await api.patch(`/session/${sessionIdParam}/update`, null, {
          params: { energyCount: currentEnergyRef.current },
          withCredentials: true,
        });
        const d = (data?.data ?? data) as any;
        setSnap({
          id: d.id,
          stationId: d.stationId,
          pillarId: d.pillarId,
          driverUserId: d.driverUserId,
          vehicleId: d.vehicleId,
          status: d.status,
          energyCount: Number(d.energyCount ?? 0),
          chargedAmount: Number(d.chargedAmount ?? 0),
          ratePerKwh: d.ratePerKwh,
          startTime: d.startTime,
          endTime: d.endTime ?? null,
          currency: d.currency,
        });

        // LƯU snapshot mới nhất để Receipt đọc
        localStorage.setItem(
          `session_last_${sessionIdParam}`,
          JSON.stringify({
            id: d.id,
            stationId: d.stationId,
            pillarId: d.pillarId,
            driverUserId: d.driverUserId,
            vehicleId: d.vehicleId,
            status: d.status,
            energyCount: Number(d.energyCount ?? 0),
            chargedAmount: Number(d.chargedAmount ?? 0),
            ratePerKwh: d.ratePerKwh,
            startTime: d.startTime,
            endTime: d.endTime ?? null,
            currency: d.currency,
            paymentMethod: d.paymentMethod ?? d.payment_method,
          })
        );

        const sn = normalizeSoc(d?.socNow);
        if (typeof sn === "number") setSocNowFromBE(sn);

        // === AUTO STOP: chỉ dừng khi FULL 100% ===
        const nowFrac =
          typeof sn === "number"
            ? sn
            : (() => {
                if (!vehicle?.batteryCapacityKwh || initialSocFromBE == null) return undefined;
                const e = Number(d?.energyCount ?? 0);
                return clamp01(initialSocFromBE + e / (vehicle.batteryCapacityKwh || 1));
              })();

        if (!autoStoppingRef.current && typeof nowFrac === "number" && nowFrac >= 1 - 1e-6) {
          autoStoppingRef.current = true;
          stopTick();

          try {
            const { data } = await api.post(`/session/${sessionIdParam}/stop`, {}, { withCredentials: true });
            const stopPayload = data?.data ?? data;
            
            // >>> AUTO-DEDUCT WALLET IF PREPAID <<<
            // Chuẩn bị prevLast/meta sớm để tính method theo yêu cầu
            const prevLast = JSON.parse(localStorage.getItem(`session_last_${sessionIdParam}`) || "null");
            const total = Number(stopPayload?.totalAmount ?? stopPayload?.totalCost ?? 0);
            const method = String(
              stopPayload?.paymentMethod ??
              prevLast?.paymentMethod ??
              (snap as any)?.paymentMethod ??
              ""
            ).toUpperCase();

            if (method === "WALLET" && total > 0) {
              try {
                await api.post("/api/payment/create", {
                  amount: Math.round(total),
                  type: "CHARGING-SESSION",
                  method: "WALLET",
                  referenceId: Number(sessionIdParam),
                  description: `Charging session #${sessionIdParam}`
                }, { withCredentials: true });
                // Không cần redirect – vẫn đi tiếp sang Receipt như cũ
              } catch (e: any) {
                // Thiếu tiền? → fallback đưa sang trang thanh toán VNPAY
                navigate("/session/payment", {
                  replace: true,
                  state: {
                    sessionId: Number(sessionIdParam),
                    amount: Math.round(total),
                    stationName: resv?.stationName || "",
                    portLabel: resv?.pillarCode || (snap?.pillarId ? `P${snap.pillarId}` : ""),
                    startTime: snap?.startTime,
                    endTime: stopPayload?.endTime || new Date().toISOString(),
                    energyKwh: stopPayload?.totalEnergy ?? snap?.energyCount ?? 0,
                    description: `Charging session #${sessionIdParam}`,
                    forceMethod: "VNPAY" // khoá UI ở trang SessionPayment
                  }
                });
                return;
              }
            }

            localStorage.setItem(`session_stop_${sessionIdParam}`, JSON.stringify(stopPayload));

            // đọc lại snapshot/meta để trộn
            const meta     = JSON.parse(localStorage.getItem(`session_meta_${sessionIdParam}`) || "null");

            const finalSnap = {
              id: Number(sessionIdParam),
              stationId:   prevLast?.stationId ?? snap?.stationId ?? stopPayload?.stationId,
              pillarId:    prevLast?.pillarId  ?? snap?.pillarId  ?? stopPayload?.pillarId,
              driverUserId: snap?.driverUserId,
              vehicleId:   prevLast?.vehicleId ?? snap?.vehicleId ?? meta?.vehicleId ?? stopPayload?.vehicleId,
              status: "COMPLETED",
              energyCount: Number(stopPayload?.totalEnergy ?? currentEnergyRef.current ?? prevLast?.energyCount ?? 0),
              chargedAmount: Number(stopPayload?.totalAmount ?? stopPayload?.totalCost ?? prevLast?.chargedAmount ?? 0),
              ratePerKwh: Number(stopPayload?.ratePerKwh ?? prevLast?.ratePerKwh ?? 0),
              startTime: prevLast?.startTime ?? snap?.startTime ?? stopPayload?.startTime ?? new Date().toISOString(),
              endTime:   stopPayload?.endTime ?? new Date().toISOString(),
              currency:  stopPayload?.currency ?? prevLast?.currency ?? snap?.currency ?? "VND",
              paymentMethod: stopPayload?.paymentMethod ?? prevLast?.paymentMethod ?? (snap as any)?.paymentMethod,
            };

            localStorage.setItem(`session_last_${sessionIdParam}`, JSON.stringify(finalSnap));
          } catch {
            // nếu /stop fail vẫn điều hướng, Receipt sẽ ráng đọc được phần đã lưu
          }

          // Điều hướng sau khi đã setItem xong 
          navigate(`/charging/receipt?sessionId=${encodeURIComponent(sessionIdParam)}&reservationId=${reservationIdParam || ""}`);
          return;
        }

        if (String(d.status).toUpperCase() === "COMPLETED" && tickTimer.current) {
          clearInterval(tickTimer.current);
          tickTimer.current = null;
        }
      } catch {
        // ignore burst errors
      }
    }, TICK_MS);
  };

  const stopTick = () => {
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  };

  // === Auto start tick ngay khi có sessionId ===
  useEffect(() => {
    if (!sessionIdParam) {
      setLoading(false);
      toast({ title: "Missing session", description: "Không có sessionId trong URL.", variant: "destructive" });
      return;
    }
    startTick();
    return () => stopTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIdParam]);

  // ====== helpers ======
  async function fetchVehicleOfSession(vehicleId: number): Promise<VehicleBrief | null> {
    try {
      const me = await api.get("/auth/me", { withCredentials: true });
      const userId = me.data?.user_id ?? me.data?.id;
      const r2 = await api.get(`/vehicle/${userId}`, { withCredentials: true });
      const list = r2.data?.data ?? r2.data?.content ?? r2.data ?? [];
      const found = Array.isArray(list) ? list.find((x: any) => Number(x?.id ?? x?.vehicleId) === Number(vehicleId)) : null;
      if (found) {
        return {
          id: Number(found.id ?? found.vehicleId),
          batteryCapacityKwh: Number(found.batteryCapacityKwh ?? found.battery_capacity_kwh),
          socNow: normalizeSoc(found.socNow ?? found.soc_now),
        };
      }
    } catch {}

    const kwhLS = Number(localStorage.getItem("battery_kwh"));
    const socRaw = Number(localStorage.getItem("vehicle_soc_now_frac") ?? localStorage.getItem("soc_now"));
    const socLS = normalizeSoc(socRaw);
    if (Number.isFinite(kwhLS) && typeof socLS === "number") {
      return { id: vehicleId, batteryCapacityKwh: kwhLS, socNow: socLS };
    }
    return null;
  }

  /** ===== Stop flow ===== */
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const onRequestStop = () => setShowStopConfirm(true);

  const doStopAndPay = async () => {
    if (!sessionIdParam) return;
    try {
      setBusy(true);
      stopTick();

      const { data } = await api.post(`/session/${sessionIdParam}/stop`, {}, { withCredentials: true });
      const stopPayload = data?.data ?? data;
      localStorage.setItem(`session_stop_${sessionIdParam}`, JSON.stringify(stopPayload));

      // >>> AUTO-DEDUCT WALLET IF PREPAID <<<
      const total = Number(stopPayload?.totalAmount ?? stopPayload?.totalCost ?? 0);
      const method = String(stopPayload?.paymentMethod ?? (snap as any)?.paymentMethod ?? "").toUpperCase();

      if (method === "WALLET" && total > 0) {
        try {
          await api.post("/api/payment/create", {
            amount: Math.round(total),
            type: "CHARGING-SESSION",
            method: "WALLET",
            referenceId: Number(sessionIdParam),
            description: `Charging session #${sessionIdParam}`
          }, { withCredentials: true });
        } catch (e: any) {
          // fallback sang VNPAY nếu ví thiếu
          navigate("/session/payment", {
            replace: true,
            state: {
              sessionId: Number(sessionIdParam),
              amount: Math.round(total),
              stationName: resv?.stationName || "",
              portLabel: resv?.pillarCode || (snap?.pillarId ? `P${snap.pillarId}` : ""),
              startTime: snap?.startTime,
              endTime: stopPayload?.endTime || new Date().toISOString(),
              energyKwh: stopPayload?.totalEnergy ?? snap?.energyCount ?? 0,
              description: `Charging session #${sessionIdParam}`,
              forceMethod: "VNPAY"
            }
          });
          return;
        }
      }

      const nowIso = stopPayload?.endTime || new Date().toISOString();
      const finalSnap = {
        id: snap?.id ?? Number(sessionIdParam),
        stationId: snap?.stationId,
        pillarId: snap?.pillarId,
        driverUserId: snap?.driverUserId,
        vehicleId: snap?.vehicleId,
        status: "COMPLETED",
        energyCount: Number(snap?.energyCount ?? 0),
        chargedAmount: Number(stopPayload?.totalAmount ?? stopPayload?.totalCost ?? snap?.chargedAmount ?? 0),
        ratePerKwh: snap?.ratePerKwh,
        startTime: snap?.startTime!,
        endTime: nowIso,
        currency: snap?.currency ?? "VND",
        paymentMethod: stopPayload?.paymentMethod ?? (snap as any)?.paymentMethod,
      };
      localStorage.setItem(`session_last_${sessionIdParam}`, JSON.stringify(finalSnap));

      navigate(`/charging/receipt?sessionId=${encodeURIComponent(sessionIdParam)}&reservationId=${reservationIdParam || ""}`);
    } catch (e: any) {
      toast({
        title: "Stop failed",
        description: e?.response?.data?.message || e?.message || "Cannot stop session.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setShowStopConfirm(false);
    }
  };

  /** ===== Render ===== */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-primary">Charging Session</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="border-2 border-primary/10 shadow-card">
          <CardContent className="space-y-6 pt-8">
            {/* Hero */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg mb-3">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                {isCompleted ? "Charging Complete" : "Charging in Progress"}
              </h2>

              <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{stationName}</span>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  Port {pillarCode}
                </span>
              </div>
            </div>

            {/* Battery + Energy */}
            <div className="rounded-2xl border-2 border-primary/20 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Battery Level</span>
                <div className="flex items-center gap-3">
                  {targetSoc != null && (
                    <span className="text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      Target 100%
                    </span>
                  )}
                  <span className="text-3xl font-extrabold text-primary">
                    {loading ? "—" : socPercent == null ? "—" : `${socPercent}%`}
                  </span>
                </div>
              </div>

              {/* SOC progress */}
              <Progress value={socPercent == null ? 0 : Math.max(0, Math.min(100, Number(socPercent)))} className="h-3 bg-muted/40 rounded-full" />
              <div className="text-xs text-center text-amber-600 mt-2">⚡ Fast charging</div>

              {(typeof socPercent === "number" || typeof targetSoc === "number") && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border bg-emerald-50 border-emerald-100 p-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-700">
                      <Battery className="w-4 h-4" />
                      SOC Now
                    </span>
                    <span className="font-bold text-emerald-800">{typeof socPercent === "number" ? `${socPercent}%` : "—"}</span>
                  </div>
                  <div className="rounded-xl border bg-amber-50 border-amber-100 p-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-amber-700">
                      <SlidersHorizontal className="w-4 h-4" />
                      SOC Target
                    </span>
                    <span className="font-bold text-amber-800">100%</span>
                  </div>
                </div>
              )}

              {/* Tiles */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center">
                  <Battery className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-emerald-700">
                    {loading || !snap ? "—" : `${snap.energyCount.toFixed(1)} kWh`}
                  </div>
                  <div className="text-xs text-emerald-700/80 mt-1">Energy Added</div>
                </div>
                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-6 text-center">
                  <Clock className="w-5 h-5 text-sky-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-sky-700">{loading || !snap ? "—" : fmtTime(elapsedSec)}</div>
                  <div className="text-xs text-sky-700/80 mt-1">Session Time</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-amber-700">
                    {loading || !snap
                      ? "—"
                      : `${(snap.chargedAmount || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`}
                  </div>
                  <div className="text-xs text-amber-700/80 mt-1">Current Cost</div>
                </div>
              </div>
            </div>

            {/* Buttons – chỉ còn Pause/Resume và Stop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-14 text-base rounded-xl border-2"
                onClick={() => {
                  if (!tickTimer.current) startTick();
                  else stopTick();
                }}
                disabled={busy || loading || isCompleted}
                title="Tạm dừng/tiếp tục mô phỏng phía FE (BE chưa có pause/resume)"
              >
                {tickTimer.current ? (
                  <>
                    <PauseCircle className="w-5 h-5 mr-2" />
                    Pause Session
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Resume Session
                  </>
                )}
              </Button>

              <Button variant="destructive" className="h-14 text-base rounded-xl" onClick={onRequestStop} disabled={busy || loading || isCompleted}>
                <StopCircle className="w-5 h-5 mr-2" />
                Stop & Pay
              </Button>
            </div>

            <div className="text-center text-sm text-info flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Live push • sending updates every 1s
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <Badge className={isCompleted ? "bg-primary/10 text-primary border-primary/20" : "bg-emerald-100 text-emerald-700 border-emerald-200"}>
                {isCompleted ? "Completed" : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stop confirm */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div className="text-lg font-bold">Confirm Stop</div>
            </div>

            <div className="text-sm text-muted-foreground">
              {typeof socPercent === "number" || targetSoc != null ? (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-xl border bg-emerald-50 border-emerald-100 p-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-700">
                      <Battery className="w-4 h-4" />
                      SOC Now
                    </span>
                    <span className="font-bold text-emerald-800">
                      {typeof socPercent === "number" ? `${socPercent}%` : "—"}
                    </span>
                  </div>
                  <div className="rounded-xl border bg-amber-50 border-amber-100 p-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-amber-700">
                      <SlidersHorizontal className="w-4 h-4" />
                      SOC Target
                    </span>
                    <span className="font-bold text-amber-800">100%</span>
                  </div>
                </div>
              ) : (
                <div>Are you sure you want to stop the session?</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="destructive" onClick={doStopAndPay} className="h-11">
                Stop & Pay
              </Button>
              <Button variant="outline" onClick={() => setShowStopConfirm(false)} className="h-11">
                Continue charging
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingSessionPage;
