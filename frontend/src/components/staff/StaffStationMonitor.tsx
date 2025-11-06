// src/pages/staff/StaffStationMonitor.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Power,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  Thermometer,
  MapPin,
  RefreshCcw,
  PieChart as PieChartIcon,
  Usb,
  Car,
  Loader2,
} from "lucide-react";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

/* ==================== Types (giữ nguyên với bổ sung status cho Connector) ==================== */
type ConnectorDto = { id: number; type: string; status?: string | null };
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

/* ==================== Bảng màu & Helpers ==================== */
const STATUS_COLORS = {
  Available: {
    hex: "#22c55e",
    badge: "bg-green-100 text-green-700 border-green-200",
    text: "text-green-600",
    border: "border-green-300",
    bg: "bg-green-50",
  },
  Charging: {
    hex: "#3b82f6",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-600",
    border: "border-blue-300",
    bg: "bg-blue-50",
  },
  Maintenance: {
    hex: "#f59e0b",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-600",
    border: "border-amber-300",
    bg: "bg-amber-50",
  },
  Offline: {
    hex: "#ef4444",
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-600",
    border: "border-red-300",
    bg: "bg-red-50",
  },
  Unknown: {
    hex: "#94a3b8",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-600",
    border: "border-slate-300",
    bg: "bg-slate-50",
  },
} as const;

const norm = (s?: string | null) => (s || "").trim().toUpperCase();
const fmtMoney = (n?: number | null) => new Intl.NumberFormat("vi-VN").format(Number(n || 0));

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [station, setStation] = useState<StationDetail | null>(null);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [stationId, setStationId] = useState<number | undefined>(getQueryStationId());

  // timer hiển thị giờ
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
        const uid =
          Number(me?.data?.id ?? me?.data?.user_id ?? me?.data?.user?.id ?? me?.data?.data?.id) ||
          undefined;
        if (!uid) throw new Error("Không xác định được user hiện tại.");
        setUserId(uid);
        currentUid = uid;
      }
      if (!sid && currentUid) {
        const stByMgr = await api
          .get<any>(`/station-managers/${currentUid}`, { withCredentials: true })
          .catch(() => null);
        const mgrData = stByMgr?.data?.data ?? stByMgr?.data;
        let mgrStation: any = null;
        if (Array.isArray(mgrData)) mgrStation = mgrData[0]?.station ?? mgrData[0];
        else mgrStation = mgrData?.station ?? mgrData;
        sid = Number(mgrStation?.id) || undefined;
        if (!sid) throw new Error("Chưa gán trạm cho nhân viên này.");
        setStationId(sid);
      }
      if (!sid) throw new Error("Không xác định được stationId để lấy chi tiết.");

      const detailPayload = await api
        .get<any>(`/charging-stations/${sid}`, { withCredentials: true })
        .then((r) => r.data?.data ?? r.data);
      const mgrPayload = await api
        .get<any>(`/station-managers/station/${sid}`, { withCredentials: true })
        .then((r) => r.data?.data ?? r.data)
        .catch(() => null);

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

  /* ===== NEW: Connector stats (thay cho pillarStats ở KPI donut) ===== */
  const connectorStats = useMemo(() => {
    const pillars = station?.pillars ?? [];
    let total = 0;
    let available = 0;
    let charging = 0;
    let maintenance = 0;
    let offline = 0;

    for (const p of pillars) {
      for (const c of p.connectors ?? []) {
        total++;
        const s = norm(c.status);
        if (s === "AVAILABLE") available++;
        else if (s === "CHARGING" || s === "OCCUPIED") charging++;
        else if (s === "MAINTENANCE") maintenance++;
        else offline++;
      }
    }

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
      temperature: 24,
      powerUsage: 82,
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
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStation}
            className="bg-red-50 text-red-600 hover:bg-red-100"
          >
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

  /* ==================== UI ==================== */
  return (
    <StaffLayout title="Station Monitoring">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 -mt-6 -mx-6 -mb-6">
        {/* Header */}
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
                <div>
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="font-mono text-lg text-gray-800">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pillar list */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                  <Power className="w-6 h-6 mr-3 text-blue-600" />
                  Pillar Live Feed ({station?.pillars?.length ?? 0} units)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {station?.pillars?.map((p: PillarDto) => {
                    const ps = norm(p.status);
                    let pKey: keyof typeof STATUS_COLORS = "Unknown";
                    if (ps === "AVAILABLE") pKey = "Available";
                    else if (ps === "CHARGING" || ps === "OCCUPIED") pKey = "Charging";
                    else if (ps === "MAINTENANCE") pKey = "Maintenance";
                    else if (ps === "OFFLINE" || ps === "FAULTED") pKey = "Offline";

                    const cfg = STATUS_COLORS[pKey];

                    // (giữ mock cho demo nếu pillar đang charging)
                    const isCharging = pKey === "Charging";
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
                        className={`bg-white border shadow-md hover:shadow-lg transition-all rounded-xl ${cfg.border}`}
                      >
                        {/* Header */}
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center border",
                                cfg.bg,
                                cfg.border
                              )}
                            >
                              <Zap className={cn("w-5 h-5", cfg.text)} />
                            </div>
                            <div>
                              <CardTitle className="text-base font-bold text-gray-900">
                                Pillar {p.code}
                              </CardTitle>
                              <span className="text-xs text-gray-500">
                                {p.power ?? "N/A"} kW
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4">
                          {/* Khi đang sạc: hiển thị progress + energy + cost (demo) */}
                          {isCharging && (
                            <div className="space-y-3 mb-3">
                              <div className="bg-blue-50/80 rounded-lg p-3 space-y-2 border border-blue-100">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-gray-900">
                                    {mock.customer}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 pl-6">
                                  <Clock className="w-3 h-3" />
                                  Started:{" "}
                                  {mock.startTime ? formatDuration(mock.startTime) : "..."} ago
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Progress</span>
                                  <span className="font-semibold text-blue-600">
                                    {mock.progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={mock.progress}
                                  className="h-2 bg-blue-100 [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-cyan-400"
                                />
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

                          {/* Danh sách CONNECTOR + STATUS (luôn hiển thị) */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Connectors</p>
                            {p.connectors?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {p.connectors.map((c) => {
                                  const s = norm(c.status);
                                  let k: keyof typeof STATUS_COLORS = "Unknown";
                                  if (s === "AVAILABLE") k = "Available";
                                  else if (s === "CHARGING" || s === "OCCUPIED") k = "Charging";
                                  else if (s === "MAINTENANCE") k = "Maintenance";
                                  else if (s === "OFFLINE" || s === "FAULTED") k = "Offline";
                                  const style = STATUS_COLORS[k].badge;
                                  const label =
                                    k === "Charging"
                                      ? "BUSY"
                                      : k === "Maintenance"
                                      ? "MAINT."
                                      : k === "Offline"
                                      ? "OFFLINE"
                                      : k === "Available"
                                      ? "OK"
                                      : "UNK";
                                  return (
                                    <Badge
                                      key={c.id}
                                      className={`${style} rounded-full px-3 py-1 text-xs`}
                                      title={`${c.type} • ${s || "UNKNOWN"}`}
                                    >
                                      {c.type}
                                      <span className="mx-1">•</span>
                                      {label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-md border border-gray-100">
                                No connectors listed.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: KPIs */}
          <div className="lg:col-span-1 space-y-6">
            {/* --- KPI donut: Connector Availability --- */}
            <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl shadow-gray-100/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Connector Availability
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => fetchStation()}
                >
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
                        data={connectorStats.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={8}
                      >
                        {connectorStats.chartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.hex} className="focus:outline-none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-extrabold text-emerald-600">
                      {connectorStats.available}
                    </span>
                    <span className="text-base font-semibold text-gray-600">
                      / {connectorStats.total} Total
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* --- KPI: Live Metrics --- */}
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
                    {stationData.totalEnergy.toFixed(1)}{" "}
                    <span className="text-sm font-medium text-gray-600">kWh</span>
                  </p>
                </div>
                <div className="bg-green-50/70 border border-green-100 rounded-lg p-4 shadow-sm">
                  <DollarSign className="w-6 h-6 text-green-500 mb-2" />
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{fmtMoney(stationData.totalRevenue)}</p>
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
                  <p className="text-xl font-bold text-gray-900">{stationData.temperature}°C</p>
                </div>
              </CardContent>
            </Card>

            {/* --- KPI: Activity Log --- */}
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
                        <span
                          className="text-gray-700 truncate"
                          title={`${log.event} (${log.connector}) - ${log.user}`}
                        >
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
      </div>
    </StaffLayout>
  );
};

export default StaffStationMonitor;
