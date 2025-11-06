// src/pages/staff/StaffReport.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";

import {
  BarChart3,
  TrendingUp,
  Zap,
  DollarSign,
  Users,
  Download,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  LabelList,
} from "recharts";

type StaffAnalyticsResponse = {
  totalSessions: number;
  totalEnergyKwh: number;
  totalRevenue: string | number; // BE BigDecimal → string|number
  hourlyUsage: Array<{
    hour: number;
    sessionCount: number;
    energyKwh?: number | null;
  }>;
};

const fmtMoney = (n?: number | string | null) => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
};
const fmtKwh = (n?: number | null, d = 1) => `${Number(n ?? 0).toFixed(d)} kWh`;

const tooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2 bg-white/90 border border-slate-200 rounded-md shadow">
      <div className="text-sm font-semibold text-slate-900 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

const StaffReport = () => {
  const exportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [data, setData] = useState<StaffAnalyticsResponse | null>(null);
  const [tab, setTab] = useState("overview");

  // ===== Load current user → staff analytics =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Lấy user id
        const me = await api.get<any>("/auth/me", { withCredentials: true });
        const uid =
          Number(me?.data?.id ??
            me?.data?.user?.id ??
            me?.data?.data?.id ??
            me?.data?.user_id);
        if (!Number.isFinite(uid)) throw new Error("Không xác định được staffId hiện tại.");
        if (!mounted) return;
        setStaffId(uid);

        // 2) Gọi staff analytics
        const res = await api.get<StaffAnalyticsResponse>("/staff/analytics", {
          params: { staffId: uid },
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Load analytics failed.";
        setErr(msg);
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ===== Derived charts =====
  const hourly = useMemo(() => {
    const arr = data?.hourlyUsage ?? [];
    // đảm bảo đủ 0…23 cho đẹp
    const full = Array.from({ length: 24 }, (_, h) => {
      const hit = arr.find((x) => Number(x.hour) === h);
      return {
        label: `${String(h).padStart(2, "0")}h`,
        sessions: Number(hit?.sessionCount ?? 0),
        energy: Number(hit?.energyKwh ?? 0),
      };
    });
    return full;
  }, [data]);

  // Buckets: Night / Morning / Afternoon / Evening (vẫn dùng ở tab Usage)
  const buckets = useMemo(() => {
    const sum = (cond: (h: number) => boolean) =>
      hourly.filter((r, i) => cond(i)).reduce((a, b) => a + b.sessions, 0);

    return [
      { name: "Night (00–06)", value: sum((h) => h < 6) },
      { name: "Morning (06–12)", value: sum((h) => h >= 6 && h < 12) },
      { name: "Afternoon (12–18)", value: sum((h) => h >= 12 && h < 18) },
      { name: "Evening (18–24)", value: sum((h) => h >= 18) },
    ];
  }, [hourly]);

  // ===== Export helpers (PNG/PDF lightweight) =====
  const exportPNG = async () => {
    const root = exportRef.current;
    if (!root) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(root, { scale: 2, backgroundColor: "#fff" });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `staff-report-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    });
  };

  const exportPDF = async () => {
    const root = exportRef.current;
    if (!root) return;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(root, { scale: 2, backgroundColor: "#fff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const iw = pw;
    const ih = (canvas.height * iw) / canvas.width;
    let left = ih;
    pdf.addImage(img, "PNG", 0, 0, iw, ih, undefined, "FAST");
    while (left > ph) {
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, -(ih - left), iw, ih, undefined, "FAST");
      left -= ph;
    }
    pdf.save(`staff-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ===== UI =====
  return (
    <StaffLayout title="Report Management">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-sky-500 to-emerald-500">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                Reports & Analytics of your Station
              </span>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={exportPDF}>Export PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPNG}>Export PNG</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div ref={exportRef} className="max-w-7xl mx-auto px-6 py-8">
          {/* Error / loading */}
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading analytics…</div>
          ) : err ? (
            <div className="p-6 text-sm text-rose-600">{err}</div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
              <TabsList
                className="
                  grid w-full grid-cols-2 rounded-2xl bg-white/80 backdrop-blur-md p-1.5
                  shadow-2xl shadow-slate-900/15 h-auto gap-1
                "
              >
                {[
                  { v: "overview", label: "Overview" },
                  { v: "usage", label: "Hourly usage" },
                ].map((t) => (
                  <TabsTrigger
                    key={t.v}
                    value={t.v}
                    className="
                      group w-full rounded-xl px-6 py-3
                      text-slate-600 font-medium hover:text-slate-900
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
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* KPIs (3 cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total revenue</p>
                          <p className="text-4xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            {fmtMoney(data?.totalRevenue)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-emerald-600" />
                            Live from staff station
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total sessions</p>
                          <p className="text-4xl font-extrabold text-slate-900">
                            {data?.totalSessions ?? 0}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Sum of all sessions on your station</p>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Energy delivered</p>
                          <p className="text-4xl font-extrabold text-slate-900">
                            {fmtKwh(data?.totalEnergyKwh, 1)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Aggregated kWh</p>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Overview charts */}
                <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900">Sessions by hour</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="w-3 h-3" />
                        Today (0–23h)
                      </div>
                    </div>
                    <CardDescription>Histogram of charging sessions across the day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      <ResponsiveContainer>
                        <BarChart data={hourly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip content={tooltip as any} />
                          <Legend wrapperStyle={{ fontSize: "14px", color: "#334155" }} />
                          <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[6, 6, 0, 0]}>
                            <LabelList
                              dataKey="sessions"
                              position="top"
                              fontSize={10}
                              fill="#10b981"
                              formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                              dy={-12}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== Usage ===== */}
              <TabsContent value="usage" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-slate-900">Cumulative sessions</CardTitle>
                      <CardDescription>Area chart (running total over the day)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 w-full">
                        <ResponsiveContainer>
                          <AreaChart
                            data={hourly.map((r, i, arr) => ({
                              ...r,
                              cum: arr.slice(0, i + 1).reduce((a, b) => a + b.sessions, 0),
                            }))}
                            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="cums" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip content={tooltip as any} />
                            <Area
                              type="monotone"
                              dataKey="cum"
                              name="Cumulative"
                              stroke="#0ea5e9"
                              fillOpacity={1}
                              fill="url(#cums)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-slate-900">Time-of-day buckets</CardTitle>
                      <CardDescription>Compare session counts by period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 w-full">
                        <ResponsiveContainer>
                          <LineChart data={buckets} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip content={tooltip as any} />
                            <Line dataKey="value" name="Sessions" stroke="#10b981" dot>
                              <LabelList
                                dataKey="value"
                                position="top"
                                fontSize={10}
                                fill="#10b981"
                                formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                                dy={-12}
                              />
                            </Line>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffReport;
