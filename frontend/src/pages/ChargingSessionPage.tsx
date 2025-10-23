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
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import api from "../api/axios";

/** ===== Mock config ===== */
const USE_MOCK = true;
const TICK_MS = 1000;         // cập nhật mỗi 1 giây
const SOC_PER_SEC = 0.75;     // % pin / giây (tăng tốc ở đây)
const KWH_PER_SEC = 0.45;     // kWh / giây  (0.09 * 60 ≈ 5.4 kWh/giờ -> bạn chỉnh theo ý)
const COST_PER_SEC = 0.55;    // $ / giây     (0.06 * 60 = 3.6$/giờ — chỉ là mock)

/** ===== Types ===== */
type SessionStatus = "RUNNING" | "PAUSED" | "COMPLETED";

interface ChargingSessionDTO {
  sessionId: string;
  reservationId?: number;
  stationName: string;
  pillarCode: string;
  startedAt: string; // ISO
  soc: number;       // 0..100
  powerKw?: number;
  energyKWh: number;
  elapsedSec: number;
  cost: number;
  status: SessionStatus;
}

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

/** ===== Mock generator ===== */
function makeMock(sessionId: string, reservationId?: number): ChargingSessionDTO {
  return {
    sessionId,
    reservationId,
    stationName: "Downtown Station #3",
    pillarCode: "P4",
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    soc: 22,
    powerKw: 140,
    energyKWh: 5.2,
    elapsedSec: 0,
    cost: 1.25,
    status: "RUNNING",
  };
}

/** ===== Component ===== */
const ChargingSessionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const sessionIdParam = searchParams.get("sessionId") || "MOCK-SESS-1";
  const reservationIdParam = searchParams.get("reservationId")
    ? Number(searchParams.get("reservationId"))
    : undefined;

  const [s, setS] = useState<ChargingSessionDTO>(
    USE_MOCK ? makeMock(sessionIdParam, reservationIdParam) : (null as any)
  );
  const [loading, setLoading] = useState(!USE_MOCK);
  const [busy, setBusy] = useState(false);

  const poller = useRef<ReturnType<typeof setInterval> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const canControl = useMemo(() => s && s.status !== "COMPLETED", [s]);

  /** ===== Polling (BE) or Simulation (MOCK) ===== */
  useEffect(() => {
    if (USE_MOCK) {
      tick.current = setInterval(() => {
        setS((prev) => {
          if (!prev) return prev;
          if (prev.status !== "RUNNING") return prev;

          const nextSoc = Math.min(100, prev.soc + SOC_PER_SEC);
          const nextEnergy = prev.energyKWh + KWH_PER_SEC;
          const nextCost = prev.cost + COST_PER_SEC;
          const nextElapsed = prev.elapsedSec + 1;
          const completed = nextSoc >= 100;

          const next: ChargingSessionDTO = {
            ...prev,
            soc: completed ? 100 : nextSoc,
            energyKWh: nextEnergy,
            cost: nextCost,
            elapsedSec: nextElapsed,
            status: completed ? "COMPLETED" : "RUNNING",
          };

          // khi hoàn tất thì dừng timer
          if (completed && tick.current) {
            clearInterval(tick.current);
            tick.current = null;
          }
          return next;
        });
      }, TICK_MS);

      return () => {
        if (tick.current) clearInterval(tick.current);
      };
    }

    const start = async () => {
      try {
        const { data } = await api.get(`/session/${sessionIdParam}`, {
          withCredentials: true,
        });
        setS(data);
        setLoading(false);

        poller.current = setInterval(async () => {
          try {
            const { data: snap } = await api.get(
              `/session/${sessionIdParam}`,
              { withCredentials: true }
            );
            setS(snap);
          } catch {
            if (poller.current) {
              clearInterval(poller.current);
              poller.current = null;
            }
          }
        }, 1000); // realtime 1s
      } catch (e: any) {
        setLoading(false);
        toast({
          title: "Cannot load session",
          description: e?.response?.data?.message || e?.message || "Unknown error.",
          variant: "destructive",
        });
      }
    };

    start();
    return () => {
      if (poller.current) clearInterval(poller.current);
    };
  }, [sessionIdParam, toast]);

  /** ===== Controls ===== */
  const onPauseResume = async () => {
    if (!s) return;
    if (USE_MOCK) {
      setS((prev) =>
        prev.status === "RUNNING" ? { ...prev, status: "PAUSED" } : { ...prev, status: "RUNNING" }
      );
      return;
    }
    try {
      setBusy(true);
      if (s.status === "RUNNING") {
        await api.post(`/charging-sessions/${s.sessionId}/pause`, {}, { withCredentials: true });
      } else {
        await api.post(`/charging-sessions/${s.sessionId}/resume`, {}, { withCredentials: true });
      }
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.response?.data?.message || e?.message || "Cannot control session.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onStop = async () => {
    if (!s) return;
    if (USE_MOCK) {
      setS((prev) => ({ ...prev, status: "COMPLETED", soc: 100 }));
      if (tick.current) {
        clearInterval(tick.current);
        tick.current = null;
      }
      setTimeout(() => {
        navigate(`/booking?step=receipt&sessionId=${s.sessionId}&reservationId=${s.reservationId || ""}`);
      }, 350);
      return;
    }
    try {
      setBusy(true);
      await api.post(`/session/${s.sessionId}/stop`, {});
      navigate(
        `/booking?step=receipt&sessionId=${encodeURIComponent(
          s.sessionId
        )}&reservationId=${s.reservationId || ""}`
      );
    } catch (e: any) {
      toast({
        title: "Stop failed",
        description: e?.response?.data?.message || e?.message || "Cannot stop session.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
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
                {s?.status === "COMPLETED" ? "Charging Complete" : "Charging in Progress"}
              </h2>

              {s && (
                <>
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{s.stationName}</span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      Port {s.pillarCode}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Battery card */}
            <div className="rounded-2xl border-2 border-primary/20 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Battery Level</span>
                <span className="text-3xl font-extrabold text-primary">
                  {loading || !s ? "—" : `${Math.round(s.soc)}%`}
                </span>
              </div>
              <div className="relative">
                <Progress value={s?.soc ?? 0} className="h-3 bg-muted/40 rounded-full" />
              </div>
              <div className="text-xs text-center text-amber-600 mt-2">⚡ Fast charging</div>

              {/* 3 tiles */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center">
                  <Battery className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-emerald-700">
                    {loading || !s ? "—" : `${s.energyKWh.toFixed(1)} kWh`}
                  </div>
                  <div className="text-xs text-emerald-700/80 mt-1">Energy Added</div>
                </div>
                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-6 text-center">
                  <Clock className="w-5 h-5 text-sky-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-sky-700">
                    {loading || !s ? "—" : fmtTime(s.elapsedSec)}
                  </div>
                  <div className="text-xs text-sky-700/80 mt-1">Session Time</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-4xl font-extrabold text-amber-700">
                    {loading || !s ? "—" : `$${toCurrency(s.cost)}`}
                  </div>
                  <div className="text-xs text-amber-700/80 mt-1">Current Cost</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-14 text-base rounded-xl border-2"
                onClick={onPauseResume}
                disabled={!canControl || busy || loading}
              >
                {s?.status === "RUNNING" ? (
                  <>
                    <PauseCircle className="w-5 h-5 mr-2" />
                    Pause Session
                  </>
                ) : s?.status === "PAUSED" ? (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Resume Session
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-5 h-5 mr-2" />
                    Pause Session
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                className="h-14 text-base rounded-xl"
                onClick={onStop}
                disabled={!canControl || busy || loading}
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop & Pay
              </Button>
            </div>

            <div className="text-center text-sm text-info flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Live data • auto-updating every 1s
            </div>

            {/* Status badge */}
            {s && (
              <div className="flex justify-center">
                <Badge
                  className={
                    s.status === "RUNNING"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : s.status === "PAUSED"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-primary/10 text-primary border-primary/20"
                  }
                >
                  {s.status === "RUNNING" ? "Active" : s.status === "PAUSED" ? "Paused" : "Completed"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChargingSessionPage;