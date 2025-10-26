// src/pages/ReportsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";

import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  MapPin,
  Download,
  Filter,
  Calendar,
  Battery,
} from "lucide-react";
import { ChatBot } from "./ChatBot";

/* ===================== Backend types ===================== */
type ApiResponse<T> = { code?: string; message?: string; data?: T };

type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

type ChargingSessionResponse = {
  id: number;
  stationId?: number | null;
  pillarId?: number | null;
  driverUserId?: number | null;
  vehicleId?: number | null;
  status?: string | null; // ACTIVE | COMPLETED | ...
  energyCount?: number | null; // kWh
  chargedAmount?: number | null; // money
  ratePerKwh?: number | null;
  targetSoc?: number | null;
  socNow?: number | null;
  startTime?: string | null; // ISO
  endTime?: string | null;   // ISO
};

type ReservationResponseBE = {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode?: string;
  connectorId: number;
  connectorType?: string;
  status: string;
  holdFee?: number;
  startTime: string;
  endTime?: string;
  createdAt?: string;
  expiredAt?: string;
  payment?: { paid?: boolean; depositTransactionId?: string };
};

/* ===================== Helpers ===================== */
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtMoney = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
    : "$0.00";

const minutesBetween = (a?: string | null, b?: string | null) => {
  if (!a) return 0;
  const end = b ? new Date(b).getTime() : Date.now();
  const start = new Date(a).getTime();
  const ms = end - start;
  return Math.max(0, Math.round(ms / 60000));
};
const humanDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

/* ===================== Component ===================== */
const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] =
    useState<"week" | "month" | "quarter" | "year">("month");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChargingSessionResponse[]>([]);

  // ⬇️ NEW: meta map giống StatusCards: pillarId -> {stationName, pillarCode, connectorType}
  const [pillarMeta, setPillarMeta] = useState<
    Map<number, { stationName?: string; pillarCode?: string; connectorType?: string }>
  >(new Map());

  // 1) Load user id -> load sessions -> load reservations (để có tên Station/Pillar/Connector)
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // /auth/me → userId
        const me = await api.get("/auth/me", { withCredentials: true });
        const uid =
          typeof me.data?.user_id === "number"
            ? me.data.user_id
            : typeof me.data?.id === "number"
            ? me.data.id
            : undefined;

        if (!uid) throw new Error("Cannot determine current user id.");
        if (!mounted) return;
        setUserId(uid);

        // /session/user/{userId}
        const sres = await api.get<ApiResponse<PageResp<ChargingSessionResponse>>>(
          `/session/user/${uid}?page=0&size=100`,
          { withCredentials: true }
        );
        const content = sres?.data?.data?.content ?? [];
        if (!mounted) return;
        setSessions(Array.isArray(content) ? content : []);

        // ⬇️ NEW: /user/{userId}/reservations để suy ra tên Station/Pillar/Connector
        try {
          const rres = await api.get<ReservationResponseBE[]>(
            `/user/${uid}/reservations`,
            { withCredentials: true }
          );
          const rows = Array.isArray(rres.data) ? rres.data : [];
          const map = new Map<number, { stationName?: string; pillarCode?: string; connectorType?: string }>();
          rows.forEach((r) => {
            if (typeof r.pillarId === "number") {
              map.set(r.pillarId, {
                stationName: r.stationName,
                pillarCode: r.pillarCode ?? `P${r.pillarId}`,
                connectorType: r.connectorType ?? (r.connectorId ? `Connector ${r.connectorId}` : undefined),
              });
            }
          });
          if (mounted) setPillarMeta(map);
        } catch {
          // không có reservation meta → dùng fallback (#id)
          if (mounted) setPillarMeta(new Map());
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Failed to load sessions.";
        setError(msg);
        setSessions([]);
        setPillarMeta(new Map());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) Derive UI rows (dùng meta giống StatusCards)
  const rows = useMemo(() => {
    return (sessions || [])
      .slice()
      .sort((a, b) => {
        const at = new Date(a.startTime || 0).getTime();
        const bt = new Date(b.startTime || 0).getTime();
        return bt - at;
      })
      .map((s) => {
        const meta = typeof s.pillarId === "number" ? pillarMeta.get(s.pillarId) : undefined;

        // duration: nếu COMPLETED → dùng endTime; nếu ACTIVE → dùng now
        const isCompleted = (s.status || "").toUpperCase() === "COMPLETED";
        const mins = minutesBetween(s.startTime, isCompleted ? s.endTime : undefined);

        const station =
          meta?.stationName ||
          (typeof s.stationId === "number" ? `Station #${s.stationId}` : "Station");

        const portText =
          meta?.pillarCode ??
          (typeof s.pillarId === "number" ? `P${s.pillarId}` : "P—");

        const connectorText = meta?.connectorType || "";

        return {
          id: String(s.id),
          date: fmtDate(s.startTime),
          time: fmtTime(s.startTime),
          station,
          port: portText,
          connector: connectorText,
          duration: mins ? humanDuration(mins) : "—",
          energy: typeof s.energyCount === "number" ? `${s.energyCount.toFixed(0)} kWh` : "—",
          cost: fmtMoney(s.chargedAmount ?? 0),
          status: isCompleted ? "Completed" : (s.status || "ACTIVE"),
        };
      });
  }, [sessions, pillarMeta]);

  // 3) Lọc theo period & tính quick stats
  const filtered = useMemo(() => {
    if (!rows.length) return rows;
    const now = new Date();

    const isInPeriod = (d: Date) => {
      if (selectedPeriod === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return d >= start && d <= now;
      }
      if (selectedPeriod === "month") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (selectedPeriod === "quarter") {
        const q = Math.floor(now.getMonth() / 3);
        return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q;
      }
      return d.getFullYear() === now.getFullYear();
    };

    return rows.filter((r) => {
      const s = sessions.find((x) => String(x.id) === r.id)?.startTime;
      return s ? isInPeriod(new Date(s)) : false;
    });
  }, [rows, sessions, selectedPeriod]);

  const monthlyStats = useMemo(() => {
    if (!filtered.length) {
      return {
        totalCost: 0,
        totalEnergy: 0,
        totalSessions: 0,
        avgCostPerSession: 0,
        avgEnergyPerSession: 0,
        mostUsedStation: "—",
        preferredTime: "—",
        efficiency: "—",
      };
    }

    const totalCost = filtered.reduce((acc, r) => acc + (Number((r.cost || "").replace(/[^0-9.]/g, "")) || 0), 0);
    const totalEnergy = filtered.reduce((acc, r) => acc + (Number((r.energy || "").replace(/[^0-9.]/g, "")) || 0), 0);
    const totalSessions = filtered.length;

    const avgCostPerSession = totalSessions ? +(totalCost / totalSessions).toFixed(2) : 0;
    const avgEnergyPerSession = totalSessions ? +(totalEnergy / totalSessions).toFixed(2) : 0;

    // most used station
    const countByStation = new Map<string, number>();
    filtered.forEach((r) => countByStation.set(r.station, (countByStation.get(r.station) || 0) + 1));
    let mostUsedStation = "—";
    let max = 0;
    countByStation.forEach((v, k) => {
      if (v > max) {
        max = v;
        mostUsedStation = k;
      }
    });

    // preferred time window (thô – nhóm theo 4h)
    const bucket = new Map<string, number>();
    filtered.forEach((r) => {
      const raw = sessions.find((s) => String(s.id) === r.id)?.startTime;
      if (!raw) return;
      const hh = new Date(raw).getHours();
      const slotStart = Math.floor(hh / 4) * 4;
      const label = `${String(slotStart).padStart(2, "0")}:00 - ${String(slotStart + 4).padStart(2, "0")}:00`;
      bucket.set(label, (bucket.get(label) || 0) + 1);
    });
    let preferredTime = "—";
    let maxSlot = 0;
    bucket.forEach((v, k) => {
      if (v > maxSlot) {
        maxSlot = v;
        preferredTime = k;
      }
    });

    // efficiency (ước lượng rất đơn giản)
    const eff = totalEnergy ? `${Math.min(100, Math.round((totalEnergy / totalSessions) * 4))}%` : "—";

    return {
      totalCost: +totalCost.toFixed(2),
      totalEnergy: +totalEnergy.toFixed(1),
      totalSessions,
      avgCostPerSession,
      avgEnergyPerSession,
      mostUsedStation,
      preferredTime,
      efficiency: eff,
    };
  }, [filtered, sessions]);

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="hover:bg-sky-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Reports & Analytics
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button className="shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export report
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-muted-foreground">Insights, trends & cost analysis</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          {/* Tabs */}
          <TabsList
            className="
              grid w-full grid-cols-3 rounded-2xl bg-[#F7FAFD] p-1.5
              ring-1 ring-slate-200/70 h-auto gap-1
            "
          >
            {[
              { v: "overview", label: "Overview" },
              { v: "sessions", label: "Session history" },
              { v: "analytics", label: "Analytics" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="
                  group w-full rounded-xl px-6 py-3
                  text-slate-600 font-medium hover:text-slate-700
                  data-[state=active]:text-white
                  data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                  data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                  transition-all flex items-center justify-center
                "
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ===== Overview ===== */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This period’s cost</p>
                      <p className="text-2xl font-bold text-primary">{fmtMoney(monthlyStats.totalCost)}</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Auto from sessions
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Energy used</p>
                      <p className="text-2xl font-bold text-secondary">{monthlyStats.totalEnergy} kWh</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Auto from sessions
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total sessions</p>
                      <p className="text-2xl font-bold text-foreground">{monthlyStats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg {(monthlyStats.totalSessions / 30).toFixed(1)} sessions/day
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Charging efficiency</p>
                      <p className="text-2xl font-bold text-success">{monthlyStats.efficiency}</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <Battery className="w-3 h-3 mr-1" />
                        Estimated
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg cost per session:</span>
                      <span className="font-medium">{fmtMoney(monthlyStats.avgCostPerSession)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg energy per session:</span>
                      <span className="font-medium">{monthlyStats.avgEnergyPerSession} kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Most used station:</span>
                      <span className="font-medium">{monthlyStats.mostUsedStation}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Favorite time window:</span>
                      <span className="font-medium">{monthlyStats.preferredTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Average efficiency:</span>
                      <Badge className="bg-success/10 text-success border-success/20">{monthlyStats.efficiency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Usage trend:</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Auto</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Sessions ===== */}
          <TabsContent value="sessions" className="space-y-6 animate-fade-in">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Session history</span>
                  <Button variant="outline" size="sm" className="hover:bg-sky-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-6 text-sm text-muted-foreground">Loading…</div>
                ) : error ? (
                  <div className="p-6 text-sm text-rose-600">{error}</div>
                ) : rows.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No sessions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {rows.map((session, index) => (
                      <div key={session.id}>
                        <div className="flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-white">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{session.station}</h4>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {`Port ${session.port}`}{session.connector ? ` • ${session.connector}` : ""}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center mt-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                {session.date} • {session.time}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                              <div>
                                <div className="text-muted-foreground">Duration</div>
                                <div className="font-medium">{session.duration}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Energy</div>
                                <div className="font-medium">{session.energy}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Cost</div>
                                <div className="font-medium text-primary">{session.cost}</div>
                              </div>
                            </div>
                            <Badge className="bg-success/10 text-success border-success/20">
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                        {index < rows.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Analytics (placeholder) ===== */}
          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle>Power preference analysis</CardTitle>
                <p className="text-sm text-muted-foreground">Power choices & average cost</p>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Coming soon — we’ll break down power tiers once pillar meta is exposed.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ChatBot />
    </div>
  );
};

export default ReportsPage;
