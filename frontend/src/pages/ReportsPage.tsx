// src/pages/ReportsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  Activity,
  Target,
  Car,
  IdCard,
} from "lucide-react";
import { ChatBot } from "./ChatBot";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

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
  status?: string | null;
  energyCount?: number | null; // kWh
  chargedAmount?: number | null; // money
  ratePerKwh?: number | null;
  targetSoc?: number | null;
  socNow?: number | null;
  startTime?: string | null; // ISO
  endTime?: string | null; // ISO
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

/* ---------- Analytics mirror ---------- */
type AnalyticsOverview = {
  totalSessions?: number;
  totalEnergyKwh?: number;
  totalCost?: number;
  averageSessionDuration?: number;
  avgCostPerKwh?: number;
  percentChangeCost?: number;
};

type MonthlyAnalytics = {
  yearMonth: string; // normalized to "yyyy-MM"
  cost?: number;
  energyKwh?: number;
  sessionCount?: number;
  averageDuration?: number;
};

type StationAnalytics = {
  stationId: string;
  stationName: string;
  address: string;
  sessionCount: number;
  totalEnergyKwh: number;
  totalCost: number;
  usagePercentage: number;
  lat?: number | null;
  lng?: number | null;
  rank: number;
};

type ConnectorAnalytics = {
  connectorType: string;
  sessionCount: number;
  totalEnergyKwh: number;
  usagePercentage: number;
};

type HourlyUsage = {
  hour: number;
  sessionCount: number;
};

type UserAnalyticsResponse = {
  overview: AnalyticsOverview;
  monthlyTrends: MonthlyAnalytics[];
  topStations: StationAnalytics[];
  connectorUsage: ConnectorAnalytics[];
  hourlyUsage: HourlyUsage[];
};

/* ===================== Helpers ===================== */
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtMoney = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
    : "0 ₫";
const fmtKwh = (n?: number | null, d = 1) =>
  typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(d)} kWh` : "—";
const fmtMinute = (m?: number | null) => (typeof m === "number" && Number.isFinite(m) ? `${m} min` : "—");

const minutesBetween = (a?: string | null, b?: string | null) => {
  if (!a) return 0;
  const end = b ? new Date(b).getTime() : Date.now();
  const start = new Date(a).getTime();
  const ms = end - start;
  return Math.max(0, Math.round(ms / 60000));
};
const humanDuration = (mins: number) => {
  if (mins < 1) return "< 1m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Accept both "yyyy-MM" string or {year,month} object
const normalizeYearMonth = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const anyV = v as any;
    if (typeof anyV.year === "number" && typeof anyV.month === "number") {
      const m = String(anyV.month).padStart(2, "0");
      return `${anyV.year}-${m}`;
    }
  }
  return "";
};

const ymLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y || 1970, (m || 1) - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
};

const PIE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#6366f1"];

const CustomTooltip = ({ active, payload, label }: any) => {
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

const PieSliceLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, sessions } = props;
  const RADIAN = Math.PI / 180;
  // Tính % dạng SỐ
  const percentValue = percent * 100;
  // So sánh SỐ với SỐ
  if (percentValue < 10) return null; 
  // Tính toán vị trí
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  // Tạo string sau khi đã so sánh xong
  const percString = percentValue.toFixed(0);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight="bold"
    >
      {`${sessions} (${percString}%)`}
    </text>
  );
};

const kpiContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const kpiCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.42, 0, 0.58, 1] } },
};

/* ===================== Detail helpers & types ===================== */

const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");
const fmtDurationRange = (start?: string | null, end?: string | null) => {
  if (!start) return "—";
  const t0 = new Date(start).getTime();
  const t1 = end ? new Date(end).getTime() : Date.now();
  const sec = Math.max(0, Math.floor((t1 - t0) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};
const safeReadJSON = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Vehicle
type VehicleDetail = {
  id: number;
  brand?: string;
  model?: string;
  plate?: string; // fallback name
  batteryCapacityKwh?: number;
};

type SessionDetail = {
  id: number;
  stationName?: string;
  portLabel?: string;
  connector?: string;
  startTime?: string | null;
  endTime?: string | null;
  energyKwh?: number;
  totalCost?: number;
  ratePerKwh?: number;
  status?: string;
  vehicleId?: number;
  paymentMethod?: string;
  currency?: string;
  vehicle?: {
    brand?: string;
    model?: string;
    plate?: string;
    capacityKwh?: number;
  };
};

type PaymentItem = {
  id?: number | string;
  sessionId?: number;
  chargingSessionId?: number;
  method?: string;
  paymentMethod?: string;
  provider?: string;
  currency?: string;
};

const pickPaymentMethod = (x: any): string | undefined =>
  x?.method || x?.paymentMethod || x?.provider || undefined;

/* ===================== Component ===================== */
const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] =
    useState<"week" | "month" | "quarter" | "year">("month");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChargingSessionResponse[]>([]);

  const [pillarMeta, setPillarMeta] = useState<
    Map<number, { stationName?: string; pillarCode?: string; connectorType?: string }>
  >(new Map());

  const [analytics, setAnalytics] = useState<UserAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  const [vehiclesById, setVehiclesById] = useState<Map<number, VehicleDetail>>(new Map());

  async function resolvePaymentMethod(sessionId: number): Promise<{ method?: string; currency?: string }> {
    // localStorage
    const last = safeReadJSON(localStorage.getItem(`session_last_${sessionId}`));
    const stop = safeReadJSON(localStorage.getItem(`session_stop_${sessionId}`));
    const m0 = pickPaymentMethod(stop?.payment) || pickPaymentMethod(stop) || pickPaymentMethod(last?.payment) || pickPaymentMethod(last);
    const c0 = stop?.currency || last?.currency;
    if (m0) return { method: String(m0), currency: c0 ?? "VND" };

    const extractItems = (raw: any): any[] => {
      if (!raw) return [];
      // BE trả Page<PaymentTransactionResponse>
      if (Array.isArray(raw?.content)) return raw.content;
      if (Array.isArray(raw?.data?.content)) return raw.data.content;
      // Trường hợp từng nơi có bọc ApiResponse hoặc trả thẳng mảng
      if (Array.isArray(raw?.data)) return raw.data;
      if (Array.isArray(raw)) return raw;
      return [];
    };

    const match = (arr: any[]) =>
      arr.find((p) =>
        Number(p?.referenceId ?? p?.sessionId ?? p?.chargingSessionId) === Number(sessionId) &&
        String(p?.type || "").toUpperCase().includes("CHARGING")
      );

    // user payments
    try {
      const r1 = await api.get(`/api/payment/getPaymentU`, { withCredentials: true });
      const hit = match(extractItems(r1.data));
      if (hit) return { method: pickPaymentMethod(hit), currency: (hit as any)?.currency ?? "VND" };
    } catch {}

    // all payments 
    try {
      const r2 = await api.get(`/api/payment/getPayment`, { withCredentials: true });
      const hit = match(extractItems(r2.data));
      if (hit) return { method: pickPaymentMethod(hit), currency: (hit as any)?.currency ?? "VND" };
    } catch {}

    return {};
  }


  const openSessionDetail = async (id: number) => {
    const s = sessions.find((x) => Number(x.id) === Number(id));
    if (!s) return;

    const meta = typeof s.pillarId === "number" ? pillarMeta.get(s.pillarId) : undefined;
    const last = safeReadJSON(localStorage.getItem(`session_last_${id}`));
    const stop = safeReadJSON(localStorage.getItem(`session_stop_${id}`));

    const merged: SessionDetail = {
      id: Number(id),
      stationName:
        meta?.stationName ||
        last?.stationName ||
        (typeof s.stationId === "number" ? `Station #${s.stationId}` : "Station"),
      portLabel: meta?.pillarCode || (s.pillarId ? `P${s.pillarId}` : "P—"),
      connector: meta?.connectorType,
      startTime: last?.startTime ?? s.startTime ?? null,
      endTime: last?.endTime ?? s.endTime ?? null,
      energyKwh: num(stop?.totalEnergy ?? last?.energyCount ?? s.energyCount ?? 0),
      totalCost: num(stop?.totalAmount ?? stop?.totalCost ?? last?.chargedAmount ?? s.chargedAmount ?? 0),
      ratePerKwh: num(stop?.ratePerKwh ?? last?.ratePerKwh ?? s.ratePerKwh ?? 0),
      status: (stop?.status ?? last?.status ?? s.status) || "—",
      vehicleId: num(last?.vehicleId ?? s.vehicleId ?? 0) || undefined,
      paymentMethod: (stop?.paymentMethod ?? last?.paymentMethod ?? "")?.toString(),
      currency: (stop?.currency ?? last?.currency ?? "VND")?.toString(),
    };

    if (merged.vehicleId && vehiclesById.has(merged.vehicleId)) {
      const v = vehiclesById.get(merged.vehicleId)!;
      merged.vehicle = {
        brand: v.brand,
        model: v.model,
        capacityKwh: Number.isFinite(v.batteryCapacityKwh || NaN) ? (v.batteryCapacityKwh as number) : undefined,
      };
    }

    setDetail(merged);
    setDetailOpen(true);

    if (!merged.paymentMethod) {
      try {
        const pm = await resolvePaymentMethod(id);
        if (pm.method || pm.currency) {
          setDetail((prev) =>
            prev ? { ...prev, paymentMethod: pm.method ?? prev.paymentMethod, currency: (pm.currency ?? prev.currency) as any } : prev
          );
        }
      } catch {}
    }
  };

  const closeDetail = () => setDetailOpen(false);

  /* ===================== Data load  ===================== */
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
        const uid = Number.isFinite(Number(uidRaw)) ? Number(uidRaw) : undefined;

        if (!uid) throw new Error("Cannot determine current user id.");
        if (!mounted) return;
        setUserId(uid);

        // Sessions by user
        try {
          const sres = await api.get<ApiResponse<PageResp<ChargingSessionResponse>>>(
            `/session/user/${uid}?page=0&size=100`,
            { withCredentials: true }
          );
          const content = sres?.data?.data?.content ?? [];
          if (mounted) setSessions(Array.isArray(content) ? content : []);
        } catch (e: any) {
          if (mounted) {
            setSessions([]);
            setError(e?.response?.data?.message || e?.message || "Failed to load sessions.");
          }
        }

        // Reservation meta for station/pillar/connector
        try {
          const rres = await api.get<ReservationResponseBE[]>(`/user/${uid}/reservations`, { withCredentials: true });
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
          if (mounted) setPillarMeta(new Map());
        }

        // User analytics
        try {
          setLoadingAnalytics(true);
          const ares = await api.get<ApiResponse<UserAnalyticsResponse>>("/analytics/" + uid, {
            withCredentials: true,
          });
          const raw = ares?.data?.data || null;
          if (raw && Array.isArray(raw.monthlyTrends)) {
            const fixed: UserAnalyticsResponse = {
              ...raw,
              monthlyTrends: raw.monthlyTrends.map((m: any) => ({
                yearMonth: normalizeYearMonth(m?.yearMonth),
                cost: Number(m?.cost ?? 0),
                energyKwh: Number(m?.energyKwh ?? 0),
                sessionCount: Number(m?.sessionCount ?? 0),
                averageDuration: Number(m?.averageDuration ?? 0),
              })),
            };
            if (mounted) setAnalytics(fixed);
          } else {
            if (mounted) setAnalytics(null);
          }
        } catch {
          if (mounted) setAnalytics(null);
        } finally {
          if (mounted) setLoadingAnalytics(false);
        }

        // Vehicles of current user 
        try {
          const vres = await api.get<ApiResponse<any[]>>(`/vehicle/${uid}`, { withCredentials: true });
          const arr = (vres.data?.data ?? []) as any[];
          const map = new Map<number, VehicleDetail>();
          arr.forEach((v) => {
            const id = Number(v.id);
            if (!Number.isFinite(id)) return;
            map.set(id, {
              id,
              brand: v.brand ?? v.make ?? v.maker,
              model: v.model ?? v.variant,
              batteryCapacityKwh: Number(v.batteryCapacityKwh ?? v.capacityKwh ?? v.capacity),
            });
          });
          if (mounted) setVehiclesById(map);
        } catch {
          if (mounted) setVehiclesById(new Map());
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Failed to load data.";
        setError(msg);
        setSessions([]);
        setPillarMeta(new Map());
        setAnalytics(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  /* ===================== Derive rows for session history ===================== */
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

        const isCompleted = (s.status || "").toUpperCase() === "COMPLETED";
        const mins = minutesBetween(s.startTime, isCompleted ? s.endTime : undefined);

        const station =
          meta?.stationName ||
          (typeof s.stationId === "number" ? `Station #${s.stationId}` : "Station");

        const portText =
          meta?.pillarCode ?? (typeof s.pillarId === "number" ? `P${s.pillarId}` : "P—");

        const connectorText = meta?.connectorType || "";

        return {
          id: String(s.id),
          date: fmtDate(s.startTime),
          time: fmtTime(s.startTime),
          station,
          port: portText,
          connector: connectorText,
          duration: mins ? humanDuration(mins) : "—",
          energy: typeof s.energyCount === "number" ? `${s.energyCount.toFixed(1)} kWh` : "—",
          cost: fmtMoney(typeof s.chargedAmount === "number" ? s.chargedAmount : 0),
          status: isCompleted ? "Completed" : s.status || "ACTIVE",
        };
      });
  }, [sessions, pillarMeta]);

  /* ===================== Filters & quick stats ===================== */
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

    const totalCost = filtered.reduce(
      (acc, r) => acc + (Number((r.cost || "").replace(/[^0-9.,₫\s]/g, "").replace(",", ".")) || 0),
      0
    );
    const totalEnergy = filtered.reduce(
      (acc, r) => acc + (Number((r.energy || "").replace(/[^0-9.]/g, "")) || 0),
      0
    );
    const totalSessions = filtered.length;

    const avgCostPerSession = totalSessions ? +(totalCost / totalSessions).toFixed(2) : 0;
    const avgEnergyPerSession = totalSessions ? +(totalEnergy / totalSessions).toFixed(2) : 0;

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

  /* ===================== Derived analytics for charts ===================== */
  const monthlyChart = useMemo(() => {
    if (!analytics?.monthlyTrends?.length) return [] as any[];
    const items = [...analytics.monthlyTrends]
      .map((m) => ({ ...m, yearMonth: normalizeYearMonth(m.yearMonth) }))
      .filter((m) => m.yearMonth)
      .sort((a, b) => (a.yearMonth > b.yearMonth ? 1 : -1));
    return items.map((m) => ({
      label: ymLabel(m.yearMonth),
      cost: m.cost ?? 0,
      energy: m.energyKwh ?? 0,
      sessions: m.sessionCount ?? 0,
      avgDuration: m.averageDuration ?? 0,
    }));
  }, [analytics]);

  const connectorChart = useMemo(() => {
    if (!analytics?.connectorUsage?.length) return [] as any[];
    return analytics.connectorUsage.map((c) => ({
      type: c.connectorType,
      sessions: c.sessionCount,
      energy: +(Number(c.totalEnergyKwh ?? 0).toFixed(2)),
      usage: +(Number(c.usagePercentage ?? 0).toFixed(2)),
    }));
  }, [analytics]);

  const hourlyChart = useMemo(() => {
    if (!analytics?.hourlyUsage?.length) return [] as any[];
    return [...analytics.hourlyUsage]
      .slice()
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({ hour: `${String(h.hour).padStart(2, "0")}:00`, sessions: h.sessionCount }));
  }, [analytics]);

  const [currentTab, setCurrentTab] = useState("overview");

  /* ===================== Detail modal ===================== */
  const DetailModal = () => {
    if (!detailOpen || !detail) return null;

    const currency = (detail.currency || "VND").toUpperCase();
    const moneyFmt = (val: number) =>
      currency === "VND"
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0)
        : `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const moneyText = moneyFmt(detail.totalCost || 0);
    const rateText = moneyFmt(detail.ratePerKwh || 0);

    const avgPowerKw = (() => {
      if (!detail.startTime || !detail.endTime) return "—";
      const hours = Math.max(
        0.001,
        (new Date(detail.endTime).getTime() - new Date(detail.startTime).getTime()) / 3_600_000
      );
      const kw = (num(detail.energyKwh) / hours) || 0;
      return `${kw.toFixed(1)} kW`;
    })();

    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
      <div className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0 border-slate-100">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900 text-right">{value ?? "—"}</div>
      </div>
    );

    return (
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
        onKeyDown={(e) => e.key === "Escape" && closeDetail()}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
        <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="font-semibold text-slate-900">Session #{detail.id}</div>
                <Badge className="ml-2 bg-slate-100 text-slate-700 border-slate-200">
                  {(detail.status || "—").toString().toUpperCase()}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={closeDetail}>Close</Button>
            </div>
          </div>

          {/* Body scrollable */}
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-amber-100 p-3 text-center">
                <DollarSign className="w-4 h-4 mx-auto mb-1" />
                <div className="text-2xl font-extrabold">{moneyText}</div>
                <div className="text-xs text-amber-700/80 mt-1">Total Cost</div>
              </div>
              <div className="rounded-xl border-2 border-emerald-100 p-3 text-center">
                <Battery className="w-4 h-4 mx-auto mb-1" />
                <div className="text-2xl font-extrabold">{(detail.energyKwh ?? 0).toFixed(1)} kWh</div>
                <div className="text-xs text-emerald-700/80 mt-1">Energy Delivered</div>
              </div>
              <div className="rounded-xl border-2 border-sky-100 p-3 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1" />
                <div className="text-2xl font-extrabold">{fmtDurationRange(detail.startTime, detail.endTime)}</div>
                <div className="text-xs text-sky-700/80 mt-1">Session Duration</div>
              </div>
              <div className="rounded-xl border-2 border-violet-100 p-3 text-center">
                <Target className="w-4 h-4 mx-auto mb-1" />
                <div className="text-2xl font-extrabold">{avgPowerKw}</div>
                <div className="text-xs text-violet-700/80 mt-1">Average Power</div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Session Info</div>
                <Row label="Session ID" value={<div className="inline-flex items-center gap-1"><IdCard className="w-3 h-3" />#{detail.id}</div>} />
                <Row label="Status" value={(detail.status || "—").toString()} />
                <Row label="Currency" value={currency} />
                <Row label="Payment Method" value={detail.paymentMethod || "—"} />
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Location</div>
                <Row label="Station" value={detail.stationName || "—"} />
                <Row label="# Port" value={detail.portLabel || "—"} />
                {!!detail.connector && <Row label="Connector" value={detail.connector} />}
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Timing</div>
                <Row label="Start Time" value={fmtDateTime(detail.startTime)} />
                <Row label="End Time" value={fmtDateTime(detail.endTime)} />
                <Row label="Duration" value={fmtDurationRange(detail.startTime, detail.endTime)} />
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Energy & Cost</div>
                <Row label="Energy (kWh)" value={`${(detail.energyKwh ?? 0).toFixed(3)}`} />
                <Row label="Average Power" value={avgPowerKw} />
                <Row label="Rate / kWh" value={rateText} />
                <Row label="Total Cost" value={moneyText} />
              </div>

              <div className="rounded-xl border p-4 sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Vehicle</div>
                <div className="grid grid-cols-2 gap-3">
                  <Row label="Vehicle ID" value={detail.vehicleId ? `#${detail.vehicleId}` : "—"} />
                  <Row label="Brand / Model" value={detail.vehicle ? `${detail.vehicle.brand ?? "—"} ${detail.vehicle.model ?? ""}`.trim() || "—" : "—"} />
                  <Row label="Battery capacity" value={Number.isFinite(detail.vehicle?.capacityKwh ?? NaN) ? `${detail.vehicle?.capacityKwh} kWh` : "—"} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={closeDetail}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-sky-500 to-emerald-500">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Reports & Analytics
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <SelectTrigger className="w-36 bg-white/70 border-slate-300 text-slate-900 hover:bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/90 backdrop-blur-md border-slate-200 text-slate-900">
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button className="shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110 transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export report
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-slate-600 text-lg">Insights, trends & cost analysis</p>
        </div>

        <Tabs defaultValue="overview" onValueChange={setCurrentTab} className="space-y-6">
          <TabsList
            className="
              grid w-full grid-cols-3 rounded-2xl bg-white/80 backdrop-blur-md p-1.5
              shadow-2xl shadow-slate-900/15 h-auto gap-1
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

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ===== Overview ===== */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={kpiContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Cards */}
                  <motion.div variants={kpiCardVariants}>
                    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Total cost</p>
                            <p className="text-4xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                              {fmtMoney(analytics?.overview?.totalCost ?? monthlyStats.totalCost)}
                            </p>
                            <p
                              className={`text-xs mt-1 flex items-center ${
                                (analytics?.overview?.percentChangeCost ?? 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {analytics
                                ? `${(analytics.overview?.percentChangeCost ?? 0).toFixed(1)}% vs last month`
                                : "Auto from sessions"}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={kpiCardVariants}>
                    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Energy used</p>
                            <p className="text-4xl font-extrabold text-slate-900">
                              {fmtKwh(analytics?.overview?.totalEnergyKwh ?? monthlyStats.totalEnergy, 1)}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Avg cost/kWh:&nbsp;
                              <span className="font-medium text-slate-800">
                                {fmtMoney(analytics?.overview?.avgCostPerKwh ?? 0)}
                              </span>
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={kpiCardVariants}>
                    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Total sessions</p>
                            <p className="text-4xl font-extrabold text-slate-900">
                              {analytics?.overview?.totalSessions ?? monthlyStats.totalSessions}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Avg duration:&nbsp;
                              <span className="font-medium text-slate-800">
                                {fmtMinute(analytics?.overview?.averageSessionDuration ?? 0)}
                              </span>
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={kpiCardVariants}>
                    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Charging efficiency</p>
                            <p className="text-4xl font-extrabold text-emerald-600">{monthlyStats.efficiency}</p>
                            <p className="text-xs text-emerald-600 flex items-center mt-1">
                              <Battery className="w-3 h-3 mr-1" />
                              Estimated (client)
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                            <Battery className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Monthly trends */}
                <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900">Monthly trends</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="w-3 h-3" />
                        {loadingAnalytics ? "Loading analytics…" : "Last 6 months"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {analytics ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-64 w-full">
                          <ResponsiveContainer>
                            <BarChart data={monthlyChart} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: "14px", color: "#334155" }} />
                              <Bar yAxisId="left" dataKey="energy" name="Energy (kWh)" fill="#10b981">
                                <LabelList
                                  dataKey="energy"
                                  position="top"
                                  fontSize={10}
                                  fill="#10b981"
                                  formatter={(v: any) => (typeof v === "number" && v > 0 ? v.toFixed(0) : "")}
                                  dy={-15}
                                />
                              </Bar>
                              <Bar yAxisId="right" dataKey="sessions" name="Sessions" fill="#0ea5e9">
                                <LabelList
                                  dataKey="sessions"
                                  position="top"
                                  fontSize={10}
                                  fill="#0ea5e9"
                                  formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                                  dy={-15}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>  
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer>
                            <LineChart data={monthlyChart} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: "14px", color: "#334155" }} />
                              <Line type="monotone" dataKey="cost" name="Cost (VND)" stroke="#8884d8" dot>
                                <LabelList
                                  dataKey="cost"
                                  position="top"
                                  fontSize={9}
                                  fill="#8884d8"
                                  formatter={(v: any) => {
                                    if (typeof v !== "number" || v < 1000) return ""; // Ẩn nếu < 1000
                                    return (v / 1000).toFixed(0) + "k";
                                  }}
                                  dy={-15}
                                />
                              </Line>
                              <Line type="monotone" dataKey="avgDuration" name="Avg Duration (min)" stroke="#f59e0b" dot>
                                <LabelList
                                  dataKey="avgDuration"
                                  position="top"
                                  fontSize={9}
                                  fill="#f59e0b"
                                  formatter={(v: any) => (typeof v === "number" && v > 0 ? `${v.toFixed(0)}m` : "")}
                                  dy={-15}
                                />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No analytics yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== Sessions ===== */}
              <TabsContent value="sessions" className="space-y-6 mt-0">
                <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-slate-900 text-xl font-bold">
                      <span>Session history</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/70 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="p-6 text-sm text-slate-500">Loading…</div>
                    ) : error ? (
                      <div className="p-6 text-sm text-rose-600">{error}</div>
                    ) : rows.length === 0 ? (
                      <div className="p-6 text-sm text-slate-500">No sessions yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {rows.map((session, index) => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                          >
                            <button
                              onClick={() => openSessionDetail(Number(session.id))}
                              className="w-full text-left"
                              aria-label={`Open session ${session.id}`}
                            >
                              <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-white/60 hover:shadow-lg">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                                    <Zap className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{session.station}</h4>
                                    <p className="text-sm text-slate-600 flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      {`Port ${session.port}`}
                                      {session.connector ? ` • ${session.connector}` : ""}
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center mt-1">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {session.date} • {session.time}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                                    <div>
                                      <div className="text-slate-600">Duration</div>
                                      <div className="font-medium text-slate-900">{session.duration}</div>
                                    </div>
                                    <div>
                                      <div className="text-slate-600">Energy</div>
                                      <div className="font-medium text-slate-900">{session.energy}</div>
                                    </div>
                                    <div>
                                      <div className="text-slate-600">Cost</div>
                                      <div className="font-medium text-cyan-600">{session.cost}</div>
                                    </div>
                                  </div>
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    {session.status}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                            {index < rows.length - 1 && <Separator className="bg-slate-200/80" />}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== Analytics ===== */}
              <TabsContent value="analytics" className="space-y-6 mt-0">
                {analytics && (
                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-slate-900">Key metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
                            <DollarSign className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Total cost</div>
                            <div className="font-semibold text-slate-900">
                              {fmtMoney(analytics.overview?.totalCost ?? 0)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
                            <Zap className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Energy</div>
                            <div className="font-semibold text-slate-900">
                              {fmtKwh(analytics.overview?.totalEnergyKwh ?? 0, 1)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
                            <Target className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Avg session</div>
                            <div className="font-semibold text-slate-900">
                              {fmtMinute(analytics.overview?.averageSessionDuration ?? 0)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80">
                            <Activity className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Cost / kWh</div>
                            <div className="font-semibold text-slate-900">
                              {fmtMoney(analytics.overview?.avgCostPerKwh ?? 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-slate-900">Top stations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 px-0">
                    {loadingAnalytics ? (
                      <div className="p-6 text-sm text-slate-500">Loading analytics…</div>
                    ) : !analytics?.topStations?.length ? (
                      <div className="p-6 text-sm text-slate-500">No station analytics.</div>
                    ) : (
                      <div className="h-96 w-full">
                        <ResponsiveContainer>
                          <BarChart
                            data={analytics.topStations.slice(0, 5).sort((a, b) => b.totalCost - a.totalCost)}
                            layout="vertical"
                            margin={{ left: 5, right: 60, top: 10, bottom: 0 }}
                            barGap={6}
                            barCategoryGap="20%"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              type="number"
                              xAxisId="cost"
                              stroke="#64748b"
                              fontSize={12}
                              domain={[0, "dataMax"]}
                              tickFormatter={(v) => new Intl.NumberFormat("vi-VN").format(Number(v))}
                            />
                            <XAxis
                              type="number"
                              xAxisId="sessions"
                              orientation="top"
                              stroke="#64748b"
                              fontSize={12}
                              domain={[0, "dataMax"]}
                            />
                            <YAxis
                              type="category"
                              dataKey="stationName"
                              stroke="#64748b"
                              width={120}
                              tick={{ fontSize: 12, fill: "#334155" }}
                              tickMargin={6}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "14px", color: "#334155" }} />
                            <Bar xAxisId="cost" dataKey="totalCost" name="Cost (VND)" fill="#10b981">
                              <LabelList
                                dataKey="totalCost"
                                position="right"
                                fontSize={10}
                                fill="#10b981"
                                formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                              />
                            </Bar>
                            <Bar xAxisId="sessions" dataKey="sessionCount" name="Sessions" fill="#0ea5e9">
                              <LabelList
                                dataKey="sessionCount"
                                position="right"
                                fontSize={10}
                                fill="#0ea5e9"
                                formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-slate-900">Connector usage</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {analytics?.connectorUsage?.length ? (
                        <div className="h-72 w-full">
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={connectorChart}
                                dataKey="sessions"
                                nameKey="type"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                labelLine={false}
                                label={PieSliceLabel}
                              >
                                {connectorChart.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: "14px", color: "#334155" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="p-6 text-sm text-slate-500">No connector data.</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-slate-900">Hourly usage</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {analytics?.hourlyUsage?.length ? (
                        <div className="h-72 w-full">
                          <ResponsiveContainer>
                            <AreaChart data={hourlyChart} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="sessions"
                                name="Sessions"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorSessions)"
                              >
                                <LabelList
                                  dataKey="sessions"
                                  position="top"
                                  fontSize={10}
                                  fill="#10b981"
                                  formatter={(v: any) => (typeof v === "number" && v > 0 ? v : "")}
                                  dy={-15}
                                />
                              </Area>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="p-6 text-sm text-slate-500">No hourly data.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
                      
      {/* Modal */}
      <DetailModal />
      <ChatBot />
    </div>
  );
};

export default ReportsPage;
