// src/pages/StaffDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import StaffLayout from "./../components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  MapPin,
  Wifi,
  WifiOff,
  Signal,
  Eye,
  AlertTriangle,
  Zap,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ===================== Backend types ===================== */
type PillarDto = {
  code?: string;
  status?: string;
  power?: number;
  pricePerKwh?: number;
  connectors?: { id?: number; type?: string }[];
};
type ReviewDto = {
  id?: string;
  userName?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
};
type ChargingStationDetailResponse = {
  id?: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  availablePillars?: number;
  totalPillars?: number;
  minPrice?: number;
  maxPrice?: number;
  minPower?: number;
  maxPower?: number;
  pillars?: PillarDto[];
  reviews?: ReviewDto[];
};

/* ===================== Bảng màu & Helpers ===================== */
const STATUS_COLORS = {
  Available: {
    hex: "#10b981", // Emerald 500
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  Charging: {
    hex: "#0ea5e9", // Sky 500
    badge: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
  Maintenance: {
    hex: "#f59e0b", // Amber 500
    badge: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  Offline: {
    hex: "#f43f5e", // Rose 500
    badge: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
  Unknown: {
    hex: "#64748b", // Slate 500
    badge: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  },
};

// Helper render badge trạng thái cho Pillar
const PillarStatusBadge = ({ status }: { status?: string }) => {
  const s = (status || "UNKNOWN").toUpperCase();
  let style = STATUS_COLORS.Unknown.badge;

  if (s === "AVAILABLE") style = STATUS_COLORS.Available.badge;
  else if (s === "CHARGING") style = STATUS_COLORS.Charging.badge;
  else if (s === "MAINTENANCE") style = STATUS_COLORS.Maintenance.badge;
  else if (["UNAVAILABLE", "OFFLINE", "FAULTED"].includes(s)) style = STATUS_COLORS.Offline.badge;

  return (
    <Badge className={`${style} w-28 justify-center`}>
      {s === "FAULTED" ? "OFFLINE" : s}
    </Badge>
  );
};

/* ===================== Component ===================== */
const StaffDashboard = () => {
  const navigate = useNavigate();
  const [station, setStation] = useState<null | ChargingStationDetailResponse>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ===================== LOGIC FETCH DATA ===================== */
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const meRes = await api.get("/auth/me", { signal: controller.signal });
        const me = meRes.data;
        const userId =
          me?.user_id ?? me?.id ?? me?.userId ?? Number(localStorage.getItem("userId"));
        if (!userId) throw new Error("Không tìm thấy userId từ /auth/me");
        const res = await api.get(`/station-managers/${userId}`, { signal: controller.signal });
        const raw = res.data?.data ?? res.data;
        let stationObj: any = null;
        if (Array.isArray(raw)) {
          if (raw.length === 0) {
            setStation(null);
            return;
          }
          const first = raw[0];
          stationObj = first.station ?? first.stationDto ?? first;
        } else {
          stationObj = raw.station ?? raw.stationDto ?? raw;
        }
        if (!stationObj) {
          setStation(null);
          return;
        }
        const mapped: ChargingStationDetailResponse = {
          id: stationObj.id ?? stationObj.stationId ?? undefined,
          name: stationObj.name ?? stationObj.stationName,
          address: stationObj.address,
          latitude: stationObj.latitude,
          longitude: stationObj.longitude,
          status: stationObj.status,
          availablePillars: stationObj.availablePillars,
          totalPillars:
            stationObj.totalPillars ??
            stationObj.total_pillars ??
            (Array.isArray(stationObj.pillars) ? stationObj.pillars.length : undefined),
          minPrice: stationObj.minPrice ?? stationObj.min_price,
          maxPrice: stationObj.maxPrice ?? stationObj.max_price,
          minPower: stationObj.minPower ?? stationObj.min_power,
          maxPower: stationObj.maxPower ?? stationObj.max_power,
          pillars: Array.isArray(stationObj.pillars) ? stationObj.pillars : undefined,
          reviews: Array.isArray(stationObj.reviews) ? stationObj.reviews : undefined,
        };
        setStation(mapped);
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("StaffDashboard err:", err);
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else {
          setError(
            err?.response?.status ? `HTTP ${err.response.status}` : err.message ?? "Request failed"
          );
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [navigate]);

  // Tính toán số liệu cho biểu đồ 
  const pillarStats = useMemo(() => {
    const pillars = station?.pillars ?? [];
    const total = pillars.length; // Luôn đếm từ mảng
    let available = 0;
    let charging = 0;
    let maintenance = 0;
    let offline = 0;

    pillars.forEach((p) => {
      const status = (p.status || "UNKNOWN").toUpperCase();
      if (status === "AVAILABLE") available++;
      else if (status === "CHARGING") charging++;
      else if (status === "MAINTENANCE") maintenance++;
      else offline++; // Gộp (FAULTED, OFFLINE, UNKNOWN...)
    });

    const chartData = [
      { name: "Available", value: available },
      { name: "Charging", value: charging },
      { name: "Maintenance", value: maintenance },
      { name: "Offline", value: offline },
    ].filter((d) => d.value > 0); // Chỉ hiển thị nếu có giá trị

    return { total, available, charging, maintenance, offline, chartData };
  }, [station]);

  if (loading) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-muted-foreground">Loading station…</div>
      </StaffLayout>
    );
  }
  if (error) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-destructive">Failed to load station ({error}).</div>
      </StaffLayout>
    );
  }
  if (!station) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-muted-foreground">No assigned station.</div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Staff Dashboard">
      {/* ===== HERO HEADER ===== */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {station.name ?? "Unknown Station"}
            </h1>
            <p className="text-base text-muted-foreground">
              {station.address ?? "Address not provided"}
            </p>
            {String(station.status ?? "").toLowerCase() === "available" ? (
              <Badge className={`${STATUS_COLORS.Available.badge} mt-1 flex items-center gap-1 w-fit`}>
                <Wifi className="w-4 h-4" />
                Station Available
              </Badge>
            ) : (
              <Badge className={`${STATUS_COLORS.Offline.badge} mt-1 flex items-center gap-1 w-fit`}>
                <WifiOff className="w-4 h-4" />
                Station {station.status ?? "Unknown"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button onClick={() => navigate("/staff/stations")} className="shadow-lg shadow-primary/30">
            <Eye className="w-4 h-4 mr-2" />
            View Station Details
          </Button>
          <Button
            variant="destructive"
            onClick={() => navigate("/staff/incidents")}
            className="shadow-lg shadow-destructive/30"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* ===== BỐ CỤC CHÍNH ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === CỘT TRÁI === */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Pillar Status & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {station.pillars && station.pillars.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-slate-300 hover:bg-transparent">
                      <TableHead className="w-[100px] text-slate-900 font-semibold">
                        Pillar
                      </TableHead>
                      <TableHead className="text-center text-slate-900 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-900 font-semibold">Power</TableHead>
                      <TableHead className="text-slate-900 font-semibold">
                        Price (VND/kWh)
                      </TableHead>
                      <TableHead className="text-right text-slate-900 font-semibold">
                        Connectors
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {station.pillars.map((p, idx) => (
                      <TableRow
                        key={p.code ?? idx}
                        className="border-b-slate-200/80 hover:bg-slate-50/50"
                      >
                        <TableCell className="font-medium text-slate-800">
                          {p.code ?? `P-${idx + 1}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <PillarStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {p.power ?? "—"} kW
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {p.pricePerKwh?.toLocaleString("vi-VN") ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          {Array.isArray(p.connectors) ? p.connectors.length : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-sm text-muted-foreground p-6 text-center">
                  No pillars data available for this station.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === CỘT PHẢI === */}
        <div className="lg:col-span-1 space-y-6">
          {/* --- KPI 1 --- */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                Pillar Availability
              </CardTitle>
              <PieChartIcon className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 bg-white/90 border border-slate-200 rounded-lg shadow-lg">
                              <p className="text-sm font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
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
                    >
                      {pillarStats.chartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={
                            STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]?.hex ||
                            STATUS_COLORS.Unknown.hex
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-extrabold text-emerald-600">
                    {pillarStats.available}
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">
                    / {pillarStats.total} Total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- KPI 2 --- */}
          <Card className="relative bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15 overflow-hidden">
            <Zap className="w-32 h-32 text-emerald-500/10 absolute -right-8 -top-8" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-base font-semibold text-slate-900">
                Power Range
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Min Power</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {station.minPower ?? "—"}
                    <span className="text-xl font-medium ml-1">kW</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Power</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {station.maxPower ?? "—"}
                    <span className="text-xl font-medium ml-1">kW</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- KPI 3 --- */}
          <Card className="relative bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15 overflow-hidden">
            <DollarSign className="w-32 h-32 text-amber-500/10 absolute -right-8 -bottom-8" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-base font-semibold text-slate-900">
                Price Range (VND/kWh)
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Min Price</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {station.minPrice?.toLocaleString("vi-VN") ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Price</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {station.maxPrice?.toLocaleString("vi-VN") ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;