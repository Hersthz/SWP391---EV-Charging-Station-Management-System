// src/pages/staff/StaffStationMonitor.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Power,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  Thermometer,
  Battery,
  MapPin,
  RefreshCcw,
  PieChart as PieChartIcon,
  ChevronRight,
  Usb,
  Car,
  Loader2,
} from "lucide-react";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "../../lib/utils";

/* ==================== Types khớp BE (KHÔNG THAY ĐỔI) ==================== */
type ConnectorDto = { id: number; type: string };
type PillarDto = {
  id: number;
  code: string;
  status?: string | null;
  power?: number | null;
  pricePerKwh?: number | null;
  connectors?: ConnectorDto[] | null;
};
type StationDetail = {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  availablePillars?: number | null;
  totalPillars?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minPower?: number | null;
  maxPower?: number | null;
  pillars?: PillarDto[] | null;
  metrics?: Record<string, any>;
  [k: string]: any;
};

/* ==================== Bảng màu & Helpers (NÂNG CẤP "Crystal") ==================== */

const STATUS_COLORS = {
  Available: {
    hex: "#22c55e", // Green 500
    badge: "bg-green-100 text-green-700 border-green-200",
    text: "text-green-600",
    border: "border-green-300",
    bg: "bg-green-50",
  },
  Charging: {
    hex: "#3b82f6", // Blue 500
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-600",
    border: "border-blue-300",
    bg: "bg-blue-50",
  },
  Maintenance: {
    hex: "#f59e0b", // Amber 500
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-600",
    border: "border-amber-300",
    bg: "bg-amber-50",
  },
  Offline: {
    hex: "#ef4444", // Red 500
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-600",
    border: "border-red-300",
    bg: "bg-red-50",
  },
  Unknown: {
    hex: "#94a3b8", // Slate 400
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-600",
    border: "border-slate-300",
    bg: "bg-slate-50",
  },
};

const norm = (s?: string | null) => (s || "").trim().toUpperCase();
const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("vi-VN").format(Number(n || 0));

const formatDuration = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "< 1m";
};

const getQueryStationId = (): number | undefined => {
  const s = new URLSearchParams(window.location.search).get("stationId");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const isDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";

function pickNumber(obj: any, paths: string[], hints?: RegExp[]): number | undefined {
  const get = (o: any, p: string) =>
    p.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), o);

  for (const p of paths) {
    const v = get(obj, p);
    if (v != null && Number.isFinite(Number(v))) return Number(v);
  }

  const buckets: Array<{ key: string; val: number }> = [];
  const scan = (o: any, prefix = "") => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return;
    for (const k of Object.keys(o)) {
      const v = (o as any)[k];
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v != null && Number.isFinite(Number(v))) {
        buckets.push({ key: fullKey, val: Number(v) });
      } else if (typeof v === "object") {
        scan(v, fullKey);
      }
    }
  };
  scan(obj);

  if (hints && buckets.length) {
    for (const r of hints) {
      const hit = buckets.find((b) => r.test(b.key));
      if (hit) return hit.val;
    }
  }
  return undefined;
}

/* ==================== Component ==================== */
const POLL_MS = 15000;

const StaffStationMonitor = () => {
  // ----- TOÀN BỘ LOGIC (STATES, FETCHING) GIỮ NGUYÊN 100% -----
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [station, setStation] = useState<StationDetail | null>(null);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [stationId, setStationId] = useState<number | undefined>(getQueryStationId());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStation = useCallback(async () => {
    setError(null);
    try {
      let sid = stationId;
      let currentUid = userId;
      if (!currentUid) {
        const me = await api.get<any>("/auth/me", { withCredentials: true }).catch(() => null);
        const uid = Number(me?.data?.id ?? me?.data?.user_id ?? me?.data?.user?.id ?? me?.data?.data?.id) || undefined;
        if (!uid) throw new Error("Không xác định được user hiện tại.");
        setUserId(uid);
        currentUid = uid;
      }
      if (!sid && currentUid) {
        const stByMgr = await api.get<any>(`/station-managers/${currentUid}`, { withCredentials: true }).catch(() => null);
        const mgrData = stByMgr?.data?.data ?? stByMgr?.data;
        let mgrStation: any = null;
        if (Array.isArray(mgrData)) mgrStation = mgrData[0]?.station ?? mgrData[0];
        else mgrStation = mgrData?.station ?? mgrData;
        sid = Number(mgrStation?.id) || undefined;
        if (!sid) throw new Error("Chưa gán trạm cho nhân viên này.");
        setStationId(sid);
      }
      if (!sid) throw new Error("Không xác định được stationId để lấy chi tiết.");

      const detailPayload = await api.get<any>(`/charging-stations/${sid}`, { withCredentials: true }).then((r) => r.data?.data ?? r.data);
      const mgrPayload = await api.get<any>(`/station-managers/station/${sid}`, { withCredentials: true }).then((r) => r.data?.data ?? r.data).catch(() => null);

      const merged: StationDetail = {
        ...detailPayload,
        ...mgrPayload,
        metrics: {
          ...(detailPayload?.metrics || {}),
          ...(mgrPayload?.metrics || {}),
        },
      };
      
      if ((!merged.pillars || merged.pillars.length === 0) && detailPayload?.pillars?.length) {
         merged.pillars = detailPayload.pillars;
      }

      if (isDebug()) {
        const flat: Record<string, number> = {};
        const addIfNum = (k: string, v: any) => { if (Number.isFinite(Number(v))) flat[k] = Number(v); };
        Object.entries(merged || {}).forEach(([k, v]) => addIfNum(k, v));
        if (merged?.metrics) Object.entries(merged.metrics).forEach(([k, v]) => addIfNum(`metrics.${k}`, v));
        console.table(flat);
      }
      setStation(merged);
    } catch (e: any) {
      setStation(null);
      setError(e?.response?.data?.message || e?.message || "Load station failed");
    }
  }, [stationId, userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchStation();
      if (mounted) setLoading(false);
    })();
    const handle = setInterval(async () => {
      setRefreshing(true);
      await fetchStation().finally(() => setRefreshing(false));
    }, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(handle);
    };
  }, [fetchStation]);

  const pillarStats = useMemo(() => {
    const pillars = station?.pillars ?? [];
    const total = pillars.length;
    let available = 0;
    let charging = 0;
    let maintenance = 0;
    let offline = 0;

    pillars.forEach((p) => {
      const status = norm(p.status);
      if (status === "AVAILABLE") available++;
      else if (status === "OCCUPIED" || status === "CHARGING") charging++;
      else if (status === "MAINTENANCE") maintenance++;
      else offline++;
    });

    const chartData = [
      { name: "Available", value: available, hex: STATUS_COLORS.Available.hex },
      { name: "Charging", value: charging, hex: STATUS_COLORS.Charging.hex },
      { name: "Maintenance", value: maintenance, hex: STATUS_COLORS.Maintenance.hex },
      { name: "Offline", value: offline, hex: STATUS_COLORS.Offline.hex },
    ].filter((d) => d.value > 0);

    return { total, available, charging, maintenance, offline, chartData };
  }, [station]);

  const stationData = useMemo(() => {
    if (!station) return null;

    const energyKwh =
      pickNumber(
        station,
        ["totalEnergyKwh", "metrics.totalEnergyKwh", "energyKwh", "totalEnergy", "energyTotal"],
        [/energy/i, /kwh/i]
      ) ?? 0;
    const revenue =
      pickNumber(
        station,
        ["totalRevenue", "metrics.totalRevenue", "revenue", "revenueVnd", "income", "totalCost"],
        [/revenue|income|amount|money|price|cost|total.*(vn?d|usd)?/i]
      ) ?? 0;

    return {
      id: station.id,
      name: station.name || "Station",
      location: station.address || "—",
      lastPing: "2 seconds ago",
      uptime: 99.8,
      temperature: 24, // Mock
      powerUsage: 82, // Mock
      totalEnergy: energyKwh,
      totalRevenue: revenue,
      activityLog: [
        { time: "15:45", event: "Session started", connector: "A3", user: "Sarah Chen" },
        { time: "15:30", event: "Session completed", connector: "A1", user: "Mike Rodriguez" },
        { time: "15:15", event: "Session started", connector: "A1", user: "John Doe" },
      ],
    };
  }, [station]);

  if (loading) {
    return (
      <StaffLayout title="Station Monitoring">
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
           <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
           Loading station data...
        </div>
      </StaffLayout>
    );
  }
  if (error) {
    return (
      <StaffLayout title="Station Monitoring">
        <div className="p-8 m-6 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
             <AlertTriangle className="w-6 h-6 text-red-600" />
             <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchStation} className="bg-red-50 text-red-600 hover:bg-red-100">
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </StaffLayout>
    );
  }
  if (!stationData) {
    return (
      <StaffLayout title="Station Monitoring">
        <div className="p-8 text-sm text-muted-foreground">No station assigned.</div>
      </StaffLayout>
    );
  }

  /* ==================== UI (ĐÃ TIẾN HÓA - Nền Sáng) ==================== */
  return (
    <StaffLayout title="Station Monitoring">
      {/* Nền toàn trang - Gradient sáng */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 -mt-6 -mx-6 -mb-6">
      
      {/* Header (NỀN GRADIENT TƯƠI SÁNG, BÓNG MỜ) */}
      <Card className="mb-6 border-0 shadow-xl shadow-blue-100/30 bg-gradient-to-br from-white to-blue-50/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stationData.name}</h2>
                  <p className="text-sm text-gray-600">{stationData.location}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm pl-16">
                <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
                <span className="text-gray-600">Last ping: {stationData.lastPing}</span>
                <span className="text-gray-600">Uptime: {stationData.uptime}%</span>
                {isDebug() && (
                  <Badge variant="outline" className="text-xs">
                    U:{userId ?? "-"} · S:{stationId ?? "-"}
                  </Badge>
                )}
                {refreshing && (
                  <span className="text-gray-600 flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3 animate-spin" /> updating…
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 lg:text-right flex-shrink-0">
              <div>{currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
              <div className="font-mono text-lg text-gray-800">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== BỐ CỤC CHÍNH (THIẾT KẾ "Crystal Dashboard") ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === CỘT TRÁI (2/3): DANH SÁCH PILLAR === */}
        <div className="lg:col-span-2">
          <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <Power className="w-6 h-6 mr-3 text-blue-600" />
                Pillar Live Feed ({pillarStats.total} units)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {station?.pillars?.map((p: PillarDto) => {
                  const status = norm(p.status);
                  let statusKey: keyof typeof STATUS_COLORS = "Unknown";
                  if (status === "AVAILABLE") statusKey = "Available";
                  else if (status === "CHARGING" || status === "OCCUPIED") statusKey = "Charging";
                  else if (status === "MAINTENANCE") statusKey = "Maintenance";
                  else if (status === "OFFLINE" || status === "FAULTED") statusKey = "Offline";

                  const statusConfig = STATUS_COLORS[statusKey];

                  // Mock data cho charging
                  const isCharging = statusKey === "Charging";
                  const mock = {
                    customer: isCharging ? "John Doe - Tesla Model 3" : null,
                    startTime: isCharging ? new Date(Date.now() - 60 * 60000) : null,
                    progress: isCharging ? 75 : 0,
                    energy: isCharging ? 23.4 : 0,
                    cost: isCharging ? 152000 : 0,
                  };

                  return (
                    <Card
                      key={p.id}
                      className={`bg-white border shadow-md hover:shadow-lg transition-all rounded-xl ${statusConfig.border}`}
                    >
                      {/* === HEADER CỦA PILLAR CARD === */}
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", statusConfig.bg, statusConfig.border)}>
                            <Zap className={cn("w-5 h-5", statusConfig.text)} />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-gray-900">
                              Pillar {p.code}
                            </CardTitle>
                            <span className="text-xs text-gray-500">{p.power ?? "N/A"} kW</span>
                          </div>
                        </div>
                        <Badge
                          className={cn("w-28 justify-center font-semibold text-xs", statusConfig.badge)}
                        >
                          {statusKey.toUpperCase()}
                        </Badge>
                      </CardHeader>

                      <CardContent className="p-4">
                        {/* === HIỂN THỊ KHI ĐANG SẠC === */}
                        {isCharging && (
                          <div className="space-y-3">
                            <div className="bg-blue-50/80 rounded-lg p-3 space-y-2 border border-blue-100">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900">
                                  {mock.customer}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 pl-6">
                                <Clock className="w-3 h-3" />
                                Started: {mock.startTime ? formatDuration(mock.startTime) : "..."} ago
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-semibold text-blue-600">
                                  {mock.progress}%
                                </span>
                              </div>
                              <Progress value={mock.progress} className="h-2 bg-blue-100 [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-cyan-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100">
                                <div className="text-gray-500">Energy</div>
                                <div className="font-semibold text-gray-900 text-base">
                                  {mock.energy} kWh
                                </div>
                              </div>
                              <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100">
                                <div className="text-gray-500">Cost</div>
                                <div className="font-semibold text-gray-900 text-base">
                                  {fmtMoney(mock.cost)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* === HIỂN THỊ KHI RẢNH (HIỆN CONNECTORS) === */}
                        {statusKey === "Available" && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Connectors:</p>
                            {p.connectors?.length ? p.connectors.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2 bg-gray-50/80 rounded-md border border-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  {c.type.includes("AC") ? (
                                    <Usb className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <Car className="w-4 h-4 text-gray-500" />
                                  )}
                                  <span className="text-sm font-medium text-gray-700">
                                    {c.type}
                                  </span>
                                </div>
                              </div>
                            )) : (
                               <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-md border border-gray-100">No connectors listed.</div>
                            )}
                          </div>
                        )}

                        {/* === HIỂN THỊ KHI BẢO TRÌ / LỖI === */}
                        {(statusKey === "Maintenance" || statusKey === "Offline") && (
                          <div
                            className={cn(
                              "rounded-lg p-3 text-sm border",
                              statusKey === "Maintenance"
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-red-50 border-red-200 text-red-600"
                            )}
                          >
                            <div
                              className="flex items-center gap-2 font-medium"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>
                                {statusKey === "Maintenance"
                                  ? "Under Maintenance"
                                  : "Pillar Offline"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 pl-6">
                              Pillar unavailable for use.
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* === CỘT PHẢI (1/3): BENTO KPIs ("Crystal Glass") === */}
        <div className="lg:col-span-1 space-y-6">
          {/* --- KPI 1: Biểu đồ trạng thái --- */}
          <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Station Overview
              </CardTitle>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700" onClick={() => fetchStation()}>
                 <RefreshCcw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 bg-white/90 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-sm font-bold text-gray-900">{`${payload[0].name}: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pillarStats.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      cornerRadius={8}
                    >
                      {pillarStats.chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.hex} className="focus:outline-none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {pillarStats.total}
                  </span>
                  <span className="text-base font-semibold text-gray-600">
                    Total Pillars
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- KPI 2: Live Metrics --- */}
          <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Live Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4 shadow-sm">
                <Zap className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-xs text-gray-500">Total Energy</p>
                <p className="text-xl font-bold text-gray-900">
                  {stationData.totalEnergy.toFixed(1)} <span className="text-sm font-medium text-gray-600">kWh</span>
                </p>
              </div>
              <div className="bg-green-50/70 border border-green-100 rounded-lg p-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {fmtMoney(stationData.totalRevenue)}
                </p>
              </div>
              <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-4 shadow-sm">
                <Activity className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-xs text-gray-500">Current Draw</p>
                <p className="text-xl font-bold text-gray-900">
                  {stationData.powerUsage} <span className="text-sm font-medium text-gray-600">kW</span>
                </p>
              </div>
              <div className="bg-red-50/70 border border-red-100 rounded-lg p-4 shadow-sm">
                <Thermometer className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-xs text-gray-500">Avg. Temp</p>
                <p className="text-xl font-bold text-gray-900">
                  {stationData.temperature}°C
                </p>
              </div>
            </CardContent>
          </Card>

          {/* --- KPI 3: Activity Log --- */}
          <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40">
                <div className="space-y-3">
                  {stationData.activityLog.map((log, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <Clock className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-gray-500">{log.time}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-700 truncate" title={`${log.event} (${log.connector}) - ${log.user}`}>
                        {log.event} ({log.connector})
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      </div> {/* Kết thúc div nền gradient */}
    </StaffLayout>
  );
};

export default StaffStationMonitor;