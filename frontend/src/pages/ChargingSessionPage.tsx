// src/pages/ChargingSessionPage.tsx
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
const TICK_MS = 1000;        // patch mỗi 1s
const KWH_PER_SEC = 0.45;    // mô phỏng kWh tăng mỗi giây ở FE

/** ===== Types ===== */
type SessionStatus = "RUNNING" | "PAUSED" | "COMPLETED";

interface SessionSnapshot {
  id: number;
  stationId?: number;
  pillarId?: number;
  driverUserId?: number;
  vehicleId?: number;
  status: string;            // ACTIVE | COMPLETED ...
  energyCount: number;       // kWh
  chargedAmount: number;     // tiền
  ratePerKwh?: number;
  startTime: string;         // ISO
  endTime?: string | null;
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
  socNow?: number;  // 0..1
};

/** ===== Helpers ===== */
const fmtTime = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
};

const toCurrency = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Chuẩn hoá SOC từ BE: nhận % (80) hoặc fraction (0..1) → 0..1 */
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
  const sessionIdParam = searchParams.get("sessionId");       // bắt buộc
  const reservationIdParam = searchParams.get("reservationId")
    ? Number(searchParams.get("reservationId"))
    : undefined;
  const vehicleIdParam = searchParams.get("vehicleId")
    ? Number(searchParams.get("vehicleId"))
    : undefined;
  const initialSocParam = searchParams.get("initialSoc")
    ? Number(searchParams.get("initialSoc"))
    : undefined; // 0..1
  const targetSocParam = searchParams.get("targetSoc")
    ? Number(searchParams.get("targetSoc"))
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

  // Target SOC (0..1)
  const [targetSoc, setTargetSoc] = useState<number | null>(
    Number.isFinite(targetSocParam!) ? clamp01(targetSocParam!) : null
  );
  const [maxSoc, setMaxSoc] = useState<number | null>(null);
  const [socNowFromBE, setSocNowFromBE] = useState<number | null>(null);
  // initial SOC & target SOC
  const [initialSocFromBE, setInitialSocFromBE] = useState<number | null>(
    Number.isFinite(initialSocParam!) ? initialSocParam! : null
  );
  const autoStoppingRef = useRef(false);

  // NEW: flag đang tạm dừng do đạt target để mở dialog
  const pauseOnTargetRef = useRef(false);

  // --- Station/Pillar label
  const stationName = resv?.stationName || "—";
  const pillarCode  = resv?.pillarCode ? resv.pillarCode.replace(/^P/i, "P") : (resv?.pillarId ? `P${resv.pillarId}` : "—");

  // --- HIỂN THỊ BADGE
  type BadgeStatus = "RUNNING" | "COMPLETED";
  const statusForBadge: BadgeStatus = useMemo<BadgeStatus>(() => {
    if (!snap) return "RUNNING";
    return snap.status === "COMPLETED" ? "COMPLETED" : "RUNNING";
  }, [snap]);

  const isCompleted = statusForBadge === "COMPLETED";

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
    initialSocFromBE != null
      ? initialSocFromBE
      : (typeof vehicle?.socNow === "number" ? vehicle!.socNow! : undefined); // 0..1

  // === current SOC fraction dựa trên energyCount ===
  const currentSocFrac = useMemo(() => {
    if (!batteryKwh || initialSocFrac == null || !snap) return undefined;
    const e = Number(snap.energyCount ?? 0);
    if (e <= 0) return clamp01(initialSocFrac);
    return clamp01(initialSocFrac + e / batteryKwh);
  }, [batteryKwh, initialSocFrac, snap?.energyCount, snap]);

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

  // --- ENERGY PROGRESS tới TARGET (chỉ khi target > initial)
  const energyProgress = useMemo(() => {
    if (!batteryKwh || initialSocFrac == null || targetSoc == null || !snap) return undefined;
    if (targetSoc <= initialSocFrac) return undefined;
    const targetEnergy = (targetSoc - initialSocFrac) * batteryKwh;  // kWh cần nạp
    const pct = Math.min(100, Math.max(0, (snap.energyCount / targetEnergy) * 100));
    return pct;
  }, [batteryKwh, initialSocFrac, targetSoc, snap]);

  // ====== Fetch reservation (real) ======
  useEffect(() => {
    let cancelled = false;

    const loadReservation = async () => {
      if (!reservationIdParam) return;

      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          typeof me.data?.user_id === "number"
            ? me.data.user_id
            : (typeof me.data?.id === "number" ? me.data.id : undefined);

        try {
          const r1 = await api.get(`/reservation/${reservationIdParam}`, { withCredentials: true });
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
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
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
    return () => { cancelled = true; };
  }, [reservationIdParam]);

  useEffect(() => {
    if (!sessionIdParam) return;
    try {
      if (initialSocFromBE == null || targetSoc == null) {
        const metaRaw = localStorage.getItem(`session_meta_${sessionIdParam}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (initialSocFromBE == null && Number.isFinite(meta?.initialSoc)) {
            setInitialSocFromBE(clamp01(Number(meta.initialSoc)));
          }
          if (targetSoc == null && Number.isFinite(meta?.targetSoc)) {
            setTargetSoc(clamp01(Number(meta.targetSoc)));
          }
        }
      }
    } catch {}
  }, [sessionIdParam]);

  // ====== Lấy snapshot + initial/target SOC 1 lần ======
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionIdParam) { setLoading(false); return; }
      try {
        const { data } = await api.get(`/session/${sessionIdParam}`, { withCredentials: true });
        const d = data?.data ?? data;
        if (cancelled || !d) return;

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
        });

        const initSoc = normalizeSoc(d?.initialSoc);
        if (typeof initSoc === "number") setInitialSocFromBE(initSoc);

        const tgt = normalizeSoc(d?.targetSoc);
        if (typeof tgt === "number") setTargetSoc(tgt);
        else {
          const tLS = Number(localStorage.getItem("soc_target"));
          if (!Number.isNaN(tLS)) setTargetSoc(clamp01(tLS / 100));
        }

        const sn = normalizeSoc(d?.socNow);
        if (typeof sn === "number") setSocNowFromBE(sn);

        const effectiveVehicleId = d?.vehicleId ?? vehicleIdParam;
        if (effectiveVehicleId) {
          const v = await fetchVehicleOfSession(effectiveVehicleId);
          if (!cancelled && v) setVehicle(v);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionIdParam]);

  // ====== Fetch max-soc cho slider ======
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionIdParam) return;
      try {
        const { data } = await api.get(`/session/${sessionIdParam}/max-soc`, { withCredentials: true });
        let v = Number(data?.data ?? data);
        if (!Number.isNaN(v) && !cancelled) {
          if (v > 1) v = v / 100;
          setMaxSoc(clamp01(v));
        }
      } catch { /* optional */ }
    })();
    return () => { cancelled = true; };
  }, [sessionIdParam]);

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
        });
        // cập nhật socNow/target từ BE nếu có
        const sn = normalizeSoc(d?.socNow);
        if (typeof sn === "number") setSocNowFromBE(sn);
        const tgtFromBE = normalizeSoc(d?.targetSoc);
        if (typeof tgtFromBE === "number") setTargetSoc(tgtFromBE);

        // === AUTO STOP: chỉ dừng khi = 1.0 ===
        const nowFrac =
          typeof sn === "number"
            ? sn
            : (() => {
                if (!vehicle?.batteryCapacityKwh || initialSocFromBE == null) return undefined;
                const e = Number(d?.energyCount ?? 0);
                return clamp01(initialSocFromBE + e / (vehicle.batteryCapacityKwh || 1));
              })();

        // NEW: khi đạt target thì TẠM DỪNG và mở dialog chọn hành động
        const effTarget = typeof tgtFromBE === "number" ? tgtFromBE : targetSoc;
        if (
          !pauseOnTargetRef.current &&
          !autoStoppingRef.current &&
          typeof nowFrac === "number" &&
          effTarget != null &&
          nowFrac + 1e-6 >= effTarget &&
          nowFrac < 1 - 1e-6
        ) {
          stopTick();
          pauseOnTargetRef.current = true;
          setShowReachedTarget(true);
          return;
        }

        // Full 100% thì stop & chuyển receipt
        if (
          !autoStoppingRef.current &&
          typeof nowFrac === "number" &&
          nowFrac >= 1 - 1e-6
        ) {
          autoStoppingRef.current = true;
          stopTick();
          try {
            await api.post(`/session/${sessionIdParam}/stop`, {}, { withCredentials: true });
          } catch { /* ignore */ }
          navigate(
            `/booking?step=receipt&sessionId=${encodeURIComponent(sessionIdParam)}&reservationId=${reservationIdParam || ""}`
          );
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
      toast({
        title: "Missing session",
        description: "Không có sessionId trong URL.",
        variant: "destructive",
      });
      return;
    }
    startTick();
    return () => stopTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIdParam]);

  // ====== Khi đạt target SOC ⇒ popup (guard để không lặp khi đã pause) ======
  const [showReachedTarget, setShowReachedTarget] = useState(false);
  const stopAtEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (stopAtEndTimerRef.current) clearTimeout(stopAtEndTimerRef.current); }, []);
  useEffect(() => {
    if (pauseOnTargetRef.current) return; // đã xử lý trong tick
    if (targetSoc == null || !batteryKwh || initialSocFrac == null || !snap) return;
    if (targetSoc <= initialSocFrac) return;
    if ((snap.energyCount ?? 0) <= 0) return;
    const nowFrac = clamp01(initialSocFrac + snap.energyCount / batteryKwh);
    if (nowFrac + 1e-6 >= targetSoc && !isCompleted) {
      setShowReachedTarget(true);
    }
  }, [snap?.energyCount, batteryKwh, initialSocFrac, targetSoc, isCompleted]);

  // ====== helpers ======
  const armStopAtReservationEnd = () => {
    if (!resv?.endTime) {
      toast({ title: "Missing end time", description: "Reservation chưa có endTime nên không thể hẹn dừng.", variant: "destructive" });
      return;
    }
    const ms = new Date(resv.endTime).getTime() - Date.now();
    if (ms <= 0) {
      doStopAndPay();
      return;
    }
    if (stopAtEndTimerRef.current) clearTimeout(stopAtEndTimerRef.current);
    stopAtEndTimerRef.current = setTimeout(() => {
      doStopAndPay();
    }, ms);
    toast({ title: "Will stop at reservation end", description: new Date(resv.endTime).toLocaleString() });
  };

  async function fetchVehicleOfSession(vehicleId: number): Promise<VehicleBrief | null> {
    try {
      const me = await api.get("/auth/me", { withCredentials: true });
      const userId = me.data?.user_id ?? me.data?.id;
      const r2 = await api.get(`/vehicle/user/${userId}`, { withCredentials: true });
      const list = r2.data?.data ?? r2.data?.content ?? r2.data ?? [];
      const found = Array.isArray(list) ? list.find((x: any) => Number(x?.id ?? x?.vehicleId) === Number(vehicleId)) : null;
      if (found) {
        return {
          id: Number(found.id ?? found.vehicleId),
          batteryCapacityKwh: Number(found.batteryCapacityKwh ?? found.battery_capacity_kwh),
          socNow: normalizeSoc(found.socNow ?? found.soc_now),
        };
      }
    } catch { /* ignore */ }

    const kwhLS = Number(localStorage.getItem("battery_kwh"));
    const socRaw = Number(localStorage.getItem("vehicle_soc_now_frac") ?? localStorage.getItem("soc_now"));
    const socLS = normalizeSoc(socRaw);
    if (Number.isFinite(kwhLS) && typeof socLS === "number") {
      return { id: vehicleId, batteryCapacityKwh: kwhLS, socNow: socLS };
    }
    return null;
  }

  /** ===== Stop flow (new confirm dialog) ===== */
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const onRequestStop = () => {
    setShowStopConfirm(true);
  };

  const doStopAndPay = async () => {
    if (!sessionIdParam) return;
    try {
      setBusy(true);
      stopTick();
      await api.post(`/session/${sessionIdParam}/stop`, {}, { withCredentials: true });
      navigate(
        `/booking?step=receipt&sessionId=${encodeURIComponent(
          sessionIdParam
        )}&reservationId=${reservationIdParam || ""}`
      );
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

  // ==== Adjust Target SOC ====
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustVal, setAdjustVal] = useState<number>(80); // %
  useEffect(() => {
    if (targetSoc != null) setAdjustVal(Math.round(targetSoc * 100));
  }, [targetSoc]);

  const submitAdjustTarget = async (valPct: number) => {
    if (!sessionIdParam) return;
    try {
      const payload = { targetSoc: valPct / 100 };
      const { data } = await api.post(`/session/${sessionIdParam}/adjust-soc-target`, payload, { withCredentials: true });
      setTargetSoc(clamp01(payload.targetSoc));
      setShowReachedTarget(false);
      // nếu đang tạm dừng do target ⇒ resume
      if (pauseOnTargetRef.current) {
        pauseOnTargetRef.current = false;
        startTick();
      }
      toast({ title: "Target updated", description: data?.message || "Charging target updated." });
    } catch (e: any) {
      toast({
        title: "Cannot adjust",
        description: e?.response?.data?.message || "Backend rejected target SOC.",
        variant: "destructive",
      });
    }
  };

  /** ===== Render ===== */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
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
                      Target {Math.round(targetSoc * 100)}%
                    </span>
                  )}
                  <span className="text-3xl font-extrabold text-primary">
                    {loading ? "—" : socPercent == null ? "—" : `${socPercent}%`}
                  </span>
                </div>
              </div>

              {/* SOC progress */}
              <Progress
                value={socPercent == null ? 0 : Math.max(0, Math.min(100, Number(socPercent)))}
                className="h-3 bg-muted/40 rounded-full"
              />
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
                    <span className="font-bold text-amber-800">{targetSoc != null ? `${Math.round(targetSoc * 100)}%` : "—"}</span>
                  </div>
                </div>
              )}

              {energyProgress != null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Energy to target</span>
                    <span>{energyProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={energyProgress} className="h-2 rounded-full" />
                </div>
              )}

              {/* 3 tiles */}
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
                  <div className="text-4xl font-extrabold text-sky-700">
                    {loading || !snap ? "—" : fmtTime(elapsedSec)}
                  </div>
                  <div className="text-xs text-sky-700/80 mt-1">Session Time</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-amber-700">
                    {loading || !snap ? "—" : `$${toCurrency(snap.chargedAmount || 0)}`}
                  </div>
                  <div className="text-xs text-amber-700/80 mt-1">Current Cost</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <Button
                variant="outline"
                className="h-14 text-base rounded-xl"
                onClick={() => setAdjustOpen(true)}
                disabled={busy || loading || isCompleted}
                title="Điều chỉnh SOC target"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Adjust Target
              </Button>

              <Button
                variant="destructive"
                className="h-14 text-base rounded-xl"
                onClick={onRequestStop}
                disabled={busy || loading || isCompleted}
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop & Pay
              </Button>
            </div>

            <div className="text-center text-sm text-info flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Live push • sending updates every 1s
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <Badge
                className={
                  isCompleted
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }
              >
                {isCompleted ? "Completed" : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Dialog: reached target === */}
      {showReachedTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 space-y-4">
            <div className="text-lg font-bold">Reached target SOC</div>
            <div className="text-sm text-muted-foreground">
              You have reached {Math.round((targetSoc ?? 0) * 100)}%. Choose an action:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1) Stop luôn */}
              <Button
                variant="destructive"
                onClick={() => { setShowReachedTarget(false); doStopAndPay(); }}
                className="h-11"
              >
                Stop & Pay
              </Button>

              {/* 2) Chọn target mới và tiếp tục */}
              <Button
                variant="outline"
                onClick={() => { setShowReachedTarget(false); setAdjustOpen(true); }}
                className="h-11"
              >
                Select new target
              </Button>

              {/* 3) Tiếp tục tới endTime */}
              <Button
                onClick={() => {
                  setShowReachedTarget(false);
                  pauseOnTargetRef.current = false;
                  armStopAtReservationEnd();
                  startTick();
                }}
                className="h-11"
              >
                Continue to end time
              </Button>
            </div>

            {resv?.endTime && (
              <div className="text-xs text-muted-foreground text-center">
                Reservation ends: <b>{new Date(resv.endTime).toLocaleString()}</b>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === NEW Dialog: Stop confirm (SOC Now vs Target) === */}
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
                    <span className="font-bold text-emerald-800">{typeof socPercent === "number" ? `${socPercent}%` : "—"}</span>
                  </div>
                  <div className="rounded-xl border bg-amber-50 border-amber-100 p-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-amber-700">
                      <SlidersHorizontal className="w-4 h-4" />
                      SOC Target
                    </span>
                    <span className="font-bold text-amber-800">{targetSoc != null ? `${Math.round(targetSoc * 100)}%` : "—"}</span>
                  </div>
                </div>
              ) : (
                <div>Are you sure you want to stop the session?</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="destructive" onClick={doStopAndPay} className="h-11">
                Stop & Pay
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowStopConfirm(false); }}
                className="h-11"
              >
                Continue to target
              </Button>
              <Button
                onClick={() => { setShowStopConfirm(false); setAdjustOpen(true); }}
                className="h-11"
              >
                Adjust target
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Dialog: Adjust Target === */}
      {adjustOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 space-y-4">
            <div className="text-lg font-bold">Adjust Target SOC</div>
            <div className="text-sm text-muted-foreground">
              Chọn mức phần trăm mong muốn. {maxSoc != null ? `(Max ~ ${Math.round(maxSoc * 100)}%)` : ""}
            </div>
            <div className="px-1">
              <input
                type="range"
                min={Math.max(0, Math.round((initialSocFrac ?? 0) * 100))}
                max={maxSoc != null ? Math.round(maxSoc * 100) : 100}
                step={1}
                value={adjustVal}
                onChange={(e) => setAdjustVal(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 text-center text-sm font-semibold">{adjustVal}%</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
              <Button onClick={() => { submitAdjustTarget(adjustVal); setAdjustOpen(false); }}>
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingSessionPage;
