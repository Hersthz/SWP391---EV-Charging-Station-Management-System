// src/components/staff/StaffReport.tsx
import {
  Calendar,
  Download,
  TrendingUp,
  Zap,
  Battery,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ===== mock chart data fallback =====
const usageDataFallback = [
  { date: "Mon", sessions: 24, energy: 156 },
  { date: "Tue", sessions: 28, energy: 189 },
  { date: "Wed", sessions: 32, energy: 203 },
  { date: "Thu", sessions: 29, energy: 178 },
  { date: "Fri", sessions: 35, energy: 221 },
  { date: "Sat", sessions: 42, energy: 267 },
  { date: "Sun", sessions: 38, energy: 241 },
];

const pillarPerformanceFallback = [
  { code: "P-01", uptime: 98, sessions: 45 },
  { code: "P-02", uptime: 100, sessions: 52 },
  { code: "P-03", uptime: 65, sessions: 18 },
  { code: "P-04", uptime: 85, sessions: 32 },
  { code: "P-05", uptime: 96, sessions: 41 },
  { code: "P-06", uptime: 99, sessions: 48 },
];

// ===== types từ backend (bạn chỉnh đúng tên field theo backend nha) =====
type HourlyUsageDto = {
  hour: number | string;
  sessionCount: number;
  energyKwh: number;
};

type PillarReportDto = {
  code: string;
  uptime: number;
  sessions: number;
  status?: string;
};

type StatusCountDto = {
  status: string;
  count: number;
};

type StaffAnalyticsResponse = {
  totalSessions: number;
  totalEnergy: number;
  avgUptime: number;
  avgChargeTime: number;
  hourlyUsage: HourlyUsageDto[];
  pillars: PillarReportDto[];
  statusCounts: StatusCountDto[];
};

const StaffReport = () => {
  const exportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<StaffAnalyticsResponse | null>(null);

  // ===== Load current user → staff analytics =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) lấy user
        const me = await api.get<any>("/auth/me", { withCredentials: true });
        const uid = Number(
          me?.data?.id ??
            me?.data?.user?.id ??
            me?.data?.data?.id ??
            me?.data?.user_id
        );
        if (!Number.isFinite(uid)) {
          throw new Error("Không xác định được staff hiện tại.");
        }

        // 2) gọi analytics
        const res = await api.get<StaffAnalyticsResponse>(
          "/staff/analytics",
          {
            params: { staffId: uid },
            withCredentials: true,
          }
        );

        if (!mounted) return;
        setData(res.data);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Load analytics failed.";
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
  // nếu backend trả hourlyUsage thì build lại 0..23, còn không thì dùng fallback
  const hourly = useMemo(() => {
    const arr = data?.hourlyUsage ?? [];
    if (!arr.length) {
      // không có từ BE thì trả mảng rỗng để khỏi vẽ
      return Array.from({ length: 24 }, (_, h) => ({
        label: `${String(h).padStart(2, "0")}h`,
        sessions: 0,
        energy: 0,
      }));
    }
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

  // status distribution cho pie
  const statusDistribution = useMemo(() => {
    const src = data?.statusCounts;
    if (!src || !src.length) {
      return [
        { name: "Available", value: 6, color: "hsl(var(--primary))" },
        { name: "Charging", value: 3, color: "hsl(var(--status-charging,#f97316))" },
        { name: "Maintenance", value: 1, color: "hsl(var(--destructive))" },
      ];
    }
    // map từ BE → UI
    return src.map((s, idx) => {
      const colors = [
        "hsl(var(--primary))",
        "hsl(var(--status-charging,#f97316))",
        "hsl(var(--destructive))",
        "hsl(var(--muted-foreground))",
      ];
      return {
        name: s.status,
        value: s.count,
        color: colors[idx % colors.length],
      };
    });
  }, [data]);

  // pillars
  const pillarPerformance = useMemo(() => {
    if (data?.pillars?.length) return data.pillars;
    return pillarPerformanceFallback;
  }, [data]);

  // ===== Export helpers =====
  const exportPNG = async () => {
    const root = exportRef.current;
    if (!root) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: "#fff",
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `staff-report-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.click();
    });
  };

  const exportPDF = async () => {
    const root = exportRef.current;
    if (!root) return;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: "#fff",
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ih = (canvas.height * pw) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, pw, ih, undefined, "FAST");
    pdf.save(
      `staff-report-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

const Report = () => {
  return (
    <StaffLayout title="Report Management">
      <div
        ref={exportRef}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900"
      >
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Staff analytics
                </h2>
                {err ? (
                  <p className="text-xs text-red-500">{err}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {loading ? "Loading..." : "Overview of assigned station"}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last 7 days
                </Button>
                <Button variant="outline" size="sm" onClick={exportPNG}>
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button variant="default" size="sm" onClick={exportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total sessions
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {data?.totalSessions ?? 228}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      +12% vs last week
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Energy used
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {(data?.totalEnergy ?? 1455).toLocaleString()} kWh
                    </p>
                    <p className="text-xs text-primary font-medium">
                      +8% vs last week
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Battery className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. uptime
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {(data?.avgUptime ?? 92.8).toFixed(1)}%
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {data?.avgUptime && data.avgUptime > 90
                        ? "Excellent"
                        : "Stable"}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. charge time
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {data?.avgChargeTime
                        ? `${data.avgChargeTime} minutes`
                        : "42 minutes"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Per session
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Usage Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily usage trend</CardTitle>
                <CardDescription>
                  Sessions and energy consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={data ? usageDataFallback : usageDataFallback}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Sessions"
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="hsl(var(--electric))"
                      strokeWidth={2}
                      name="Energy (kWh)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pillar performance */}
            <Card>
              <CardHeader>
                <CardTitle>Pillar performance</CardTitle>
                <CardDescription>
                  Uptime and sessions per pillar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pillarPerformance}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="code"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="uptime" fill="hsl(var(--primary))" name="Uptime (%)" />
                    <Bar dataKey="sessions" fill="hsl(var(--muted-foreground))" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status distribution</CardTitle>
                <CardDescription>
                  Current status across pillars
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Peak hours</CardTitle>
                <CardDescription>Usage by time slot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: "08:00 - 10:00", usage: 85, label: "Morning peak" },
                    { time: "12:00 - 14:00", usage: 72, label: "Lunchtime" },
                    { time: "17:00 - 19:00", usage: 95, label: "Evening peak" },
                    { time: "20:00 - 22:00", usage: 45, label: "Night" },
                  ].map((slot, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {slot.time}
                        </span>
                        <span className="text-muted-foreground">
                          {slot.label}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all"
                          style={{ width: `${slot.usage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {slot.usage}% capacity
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </StaffLayout>
  );
};

export default Report;
