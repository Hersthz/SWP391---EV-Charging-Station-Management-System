import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import {
  Zap,
  Users,
  MapPin,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Database,
  CreditCard,
  Brain,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { motion, type Variants } from "framer-motion";

/* ================== BE types ================== */
type AdminAnalyticsResponse = {
  totalUsers: number;
  totalStations: number;
  totalEnergyKwh: number;
  totalRevenue: number;
  revenue6Months: { month: string; revenue: number }[];
  revenueByStation: { stationId: number; stationName: string; revenue: number; energyKwh: number }[];
  peakHour: { hour: number; sessionCount: number }[];
};

type ApiResponse<T> = { code?: string; message?: string; data?: T };

/* ========== Voucher stats ========== */
type VoucherStat = {
  id: number;
  status: string;
  endDate?: string | null;
};

const mapVoucherStat = (x: any): VoucherStat => ({
  id: x?.id ?? x?.voucherId ?? x?.voucherID ?? x?.VoucherId ?? 0,
  status: x?.status ?? "ACTIVE",
  endDate: x?.endDate ?? x?.end_date ?? null,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ================== Helpers ================== */
const fmtVND = (n: any) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const fmtKwh = (n?: number) => `${Number(n || 0).toFixed(1)} kWh`;

const ymLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y || 1970, (m || 1) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-slate-900">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="text-sm">
            {pld.name}: <span className="font-semibold">{fmtVND(pld.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipArea = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-slate-900">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="text-sm">
            {pld.name}: <span className="font-semibold">{pld.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const kpiContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const kpiCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1],
    },
  },
};

/* ================== Component ================== */
const AdminReports = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);

  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  });

  const handleLogout = () => navigate("/");

  /* ============= Load admin + analytics + voucher stats ============= */
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await api.get<any>("/auth/me", { withCredentials: true });
        const uidRaw =
          me?.data?.id ??
          me?.data?.user_id ??
          me?.data?.data?.id ??
          me?.data?.user?.id ??
          me?.data?.profile?.id;
        const uid = Number(uidRaw);
        if (!Number.isFinite(uid)) throw new Error("Cannot determine current admin id.");
        if (!mounted) return;
        setAdminId(uid);

        const res = await api.get("/admin/analytics", {
          params: { adminId: uid },
          withCredentials: true,
        });
        const payload = (res as any)?.data;
        if (!mounted) return;
        setData(payload && payload.data ? payload.data : payload);

        // ==== Voucher stats ====
        const voucherRes = await api.get<ApiResponse<any[]>>("/api/vouchers", {
          withCredentials: true,
        });

        if (!mounted) return;

        const raw = Array.isArray(voucherRes.data?.data)
          ? voucherRes.data!.data!
          : Array.isArray(voucherRes.data as any)
          ? (voucherRes.data as any)
          : [];

        const vouchers: VoucherStat[] = raw.map(mapVoucherStat);
        const today = todayISO();

        let active = 0;
        let inactive = 0;
        let expired = 0;

        vouchers.forEach((v) => {
          const s = String(v.status).toUpperCase();
          const isExpired = s === "EXPIRED" || (!!v.endDate && String(v.endDate) < today);
          if (isExpired) {
            expired++;
          } else if (s === "ACTIVE") {
            active++;
          } else {
            inactive++;
          }
        });

        setVoucherStats({
          total: vouchers.length,
          active,
          inactive,
          expired,
        });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load analytics.");
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  /* ============= Derive charts from BE ============= */
  const revenueData = useMemo(() => {
    if (!data?.revenue6Months?.length) return [];
    const sorted = [...data.revenue6Months].sort((a, b) => (a.month > b.month ? 1 : -1));
    return sorted.map((m) => ({ name: ymLabel(m.month), revenue: Number(m.revenue || 0) }));
  }, [data]);

  const topStations = useMemo(() => {
    if (!data?.revenueByStation?.length) return [];
    const sorted = [...data.revenueByStation].sort((a, b) => Number(b.revenue) - Number(a.revenue));
    const maxEnergy = Math.max(...sorted.map((s) => Number(s.energyKwh || 0)), 1);
    return sorted.slice(0, 5).map((s) => ({
      name: s.stationName,
      revenue: Number(s.revenue || 0),
      energy: Number(s.energyKwh || 0),
      utilization: Math.round((Number(s.energyKwh || 0) / maxEnergy) * 100),
    }));
  }, [data]);

  const hourlyUsage = useMemo(() => {
    if (!data?.peakHour?.length) return [];
    return [...data.peakHour]
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({ hour: `${String(h.hour).padStart(2, "0")}:00`, sessions: h.sessionCount }));
  }, [data]);

  const voucherChartData = useMemo(() => {
    const { active, inactive, expired } = voucherStats;
    const items = [
      { name: "Active", value: active, color: "#10b981" },
      { name: "Inactive", value: inactive, color: "#0f766e" },
      { name: "Expired", value: expired, color: "#f97316" },
    ];
    return items.filter((x) => x.value > 0);
  }, [voucherStats]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-foreground">ChargeHub</span>
                </div>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  Admin Portal
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 ml-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white h-screen sticky top-16 overflow-y-auto border-r border-gray-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
          <nav className="p-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/stations"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Stations</span>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Link>

            <Link
              to="/admin/staff"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Staff & Admin</span>
            </Link>

            <Link
              to="/admin/kyc"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>KYC</span>
            </Link>

            <Link
              to="/admin/voucher"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Voucher</span>
            </Link>

            <Link
              to="/admin/reports"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
            >
              <Database className="w-4 h-4" />
              <span className="font-medium">Reports</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-slate-100">
          <div className="max-w-[1600px] mx-auto">
            {/* Header row */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Reports</h1>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>          
            </div>

            {/* KPI Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              variants={kpiContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <StatCard
                title="Total Revenue"
                value={fmtVND(data?.totalRevenue || 0)}
                subtitle="from all time"
                icon={<DollarSign className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Total Users"
                value={data?.totalUsers ?? (loading ? "…" : 0)}
                subtitle="drivers only"
                icon={<Users className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Total Stations"
                value={data?.totalStations ?? (loading ? "…" : 0)}
                subtitle="active + inactive"
                icon={<MapPin className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Total Energy"
                value={`${(data?.totalEnergyKwh ?? 0).toLocaleString()} kWh`}
                subtitle="delivered"
                icon={<TrendingUp className="w-6 h-6" />}
                color="yellow"
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
              {/* Revenue Trends (6 months) */}
              <motion.div className="lg:col-span-3" variants={kpiCardVariants} initial="hidden" animate="visible">
                <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                      Revenue Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {revenueData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData} margin={{ top: 10, right: 0, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `${Number(v) / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.7)" }} />
                            <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="p-6 text-sm text-slate-500 h-full flex items-center justify-center">
                          No revenue data.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Peak Hours Analysis */}
              <motion.div className="lg:col-span-2" variants={kpiCardVariants} initial="hidden" animate="visible">
                <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                      <Clock className="w-5 h-5 mr-2 text-emerald-600" />
                      Peak Hours Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {hourlyUsage.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                              dataKey="hour"
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltipArea />} />
                            <Area
                              type="monotone"
                              dataKey="sessions"
                              name="Sessions"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorSessions)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="p-6 text-sm text-slate-500 h-full flex items-center justify-center">
                          No hourly data.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
              {/* Top Performing Stations */}
              <motion.div className="lg:col-span-3" variants={kpiCardVariants} initial="hidden" animate="visible">
                <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      Top Performing Stations
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 px-6 pb-6">
                    {(() => {
                      if (!topStations.length && !loading) {
                        return <div className="text-sm text-slate-500">No station analytics.</div>;
                      }

                      return topStations.map((st, index) => (
                        <div
                          key={st.name + index}
                          className="flex items-center justify-between p-4 bg-slate-100/80 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 bg-white border border-slate-200/80 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{st.name}</div>
                              <div className="text-sm text-slate-500">energy index</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="font-semibold text-emerald-600">{fmtVND(st.revenue)}</div>
                              <div className="text-xs text-slate-500">{fmtKwh(st.energy)}</div>
                            </div>
                            <div className="flex items-center space-x-2 w-28">
                              <Progress
                                value={st.utilization}
                                className="w-full h-2 bg-slate-200 [&>div]:bg-blue-500"
                              />
                              <span className="text-sm text-slate-600 font-medium w-8">
                                {st.utilization}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Voucher statistics */}
              <motion.div className="lg:col-span-2" variants={kpiCardVariants} initial="hidden" animate="visible">
                <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                      <TicketPercent className="w-5 h-5 mr-2 text-blue-600" />
                      Voucher Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center -mt-4">
                      {voucherStats.total > 0 && voucherChartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={voucherChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={3}
                              dataKey="value"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {voucherChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any, name: any) => [value, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="p-6 text-sm text-slate-500 h-full flex items-center justify-center">
                          {loading ? "Loading voucher statistics…" : "No voucher data."}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Active</span>
                        <span className="font-semibold text-emerald-600">
                          {voucherStats.active}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Inactive</span>
                        <span className="font-semibold text-slate-700">
                          {voucherStats.inactive}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Expired</span>
                        <span className="font-semibold text-amber-600">
                          {voucherStats.expired}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  color: "blue" | "green" | "yellow" | "purple";
};

const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-l-blue-500", shadow: "shadow-blue-500/10" },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-l-emerald-500",
      shadow: "shadow-emerald-500/10",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-l-yellow-500",
      shadow: "shadow-yellow-500/10",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-l-purple-500",
      shadow: "shadow-purple-500/10",
    },
  };
  const c = colors[color];

  return (
    <motion.div variants={kpiCardVariants} className="h-full">
      <Card className={`bg-white border-l-4 ${c.border} shadow-2xl ${c.shadow} rounded-2xl h-full`}>
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className={`text-4xl font-extrabold ${c.text}`}>{value}</p>
            </div>
            <div
              className={`w-16 h-16 bg-gradient-to-br from-white ${c.bg} rounded-2xl flex items-center justify-center ${c.text} flex-shrink-0`}
            >
              {icon}
            </div>
          </div>
          <p className={`text-sm font-medium ${c.text} opacity-80 mt-2`}>{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminReports;
