import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Zap,
  Clock,
  CreditCard,
  QrCode,
  Copy,
  RefreshCw,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Check,
  PlugZap,
  XCircle,
  DollarSign,
  Info,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";

/** Toggle mock for quick preview */
const USE_MOCK = false;
const DEMO_DEFAULT_TICK_SEC = 1; // 1s/patch
const DEMO_DEFAULT_KW = 0.45;

/* ===== Types ===== */
type Vehicle = {
  id: number;
  userId?: number;
  make?: string;
  model?: string;
  batteryCapacityKwh?: number;
  acMaxKw?: number;
  dcMaxKw?: number;
  efficiency?: number;
  currentSoc?: number; // %
  socTarget?: number;
};

type EstimateResp = {
  energyKwh: number;
  estimatedCost: number;
  estimatedMinutes: number;
  socTarget?: number;
  minuteUntilEnd?: number;
};

export type ReservationStatus =
  | "CONFIRMED"
  | "SCHEDULED"
  | "PENDING_PAYMENT"
  | "CANCELLED"
  | "EXPIRED"
  | "VERIFYING"
  | "VERIFIED"
  | "PLUGGED"
  | "CHARGING"
  | "COMPLETED";

interface ReservationItem {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode: string;
  connectorType: string;
  connectorId?: number;
  startTime: string;
  status: ReservationStatus;
  holdFee?: number;
  payment?: { depositTransactionId?: string; paid: boolean };
}

interface MyReservationsResponse {
  items: ReservationItem[];
  nextBooking?: Partial<ReservationItem>;
}

/* ===== Backend DTO ===== */
interface ReservationResponseBE {
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
}

/* ===== Mock ===== */
const MOCK_RESERVATIONS: MyReservationsResponse = {
  items: [
    {
      reservationId: 10101,
      stationId: 3,
      stationName: "Downtown Station #3",
      pillarId: 4,
      pillarCode: "P4",
      connectorType: "DC Ultra 350kW",
      startTime: new Date().toISOString(),
      status: "VERIFYING",
      holdFee: 50000,
      payment: { depositTransactionId: "DP-2024091101", paid: true },
    },
    {
      reservationId: 10102,
      stationId: 2,
      stationName: "Mall Station #2",
      pillarId: 2,
      pillarCode: "P2",
      connectorType: "AC Fast 22kW",
      startTime: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() + 1,
        14,
        0,
        0
      ).toISOString(),
      status: "SCHEDULED",
      holdFee: 50000,
      payment: { paid: true },
    },
    {
      reservationId: 10103,
      stationId: 7,
      stationName: "Highway Station #7",
      pillarId: 1,
      pillarCode: "P1",
      connectorType: "DC Fast 150kW",
      startTime: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        18,
        0,
        0
      ).toISOString(),
      status: "PENDING_PAYMENT",
      holdFee: 0,
      payment: { paid: false },
    },
  ],
  nextBooking: {
    stationName: "Downtown Station #3",
    pillarCode: "P4",
    connectorType: "DC Ultra 350kW",
    startTime: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() + 1,
      14,
      0,
      0
    ).toISOString(),
  },
};

/* ===== Helpers ===== */
const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "";
const fmtVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
const isArrivableNow = (startIso: string) =>
  Date.now() >= new Date(startIso).getTime();

function mapApiVehicle(v: any): Vehicle {
  const rawSoc = v?.currentSoc ?? v?.socNow ?? v?.soc_now;
  const socPct =
    typeof rawSoc === "number"
      ? rawSoc <= 1
        ? Math.round(rawSoc * 100)
        : Math.round(rawSoc)
      : undefined;
  return {
    id: v?.id ?? v?.vehicleId,
    userId: v?.userId ?? v?.user_id,
    make: v?.make,
    model: v?.model,
    batteryCapacityKwh: v?.batteryCapacityKwh ?? v?.battery_capacity_kwh,
    acMaxKw: v?.acMaxKw ?? v?.ac_max_kw,
    dcMaxKw: v?.dcMaxKw ?? v?.dc_max_kw,
    efficiency: v?.efficiency,
    currentSoc: socPct,
  };
}

function mapStatus(dbStatus?: string, startTime?: string): ReservationStatus {
  const s = (dbStatus || "").toUpperCase().trim();
  if (s === "CANCELLED") return "CANCELLED";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "PENDING" || s === "PENDING_PAYMENT") return "PENDING_PAYMENT";
  if (s === "VERIFY" || s === "VERIFYING") return "VERIFYING";
  if (s === "VERIFIED") return "VERIFIED";
  if (s === "PLUGGED") return "PLUGGED";
  if (s === "CHARGING") return "CHARGING";
  if (s === "COMPLETED") return "COMPLETED";
  if (
    s === "SCHEDULED" ||
    s === "RESERVED" ||
    s === "BOOKED" ||
    s === "PAID" ||
    s === "CONFIRMED"
  ) {
    return startTime && new Date(startTime).getTime() > Date.now()
      ? "SCHEDULED"
      : "VERIFYING";
  }
  return startTime && new Date(startTime).getTime() > Date.now()
    ? "SCHEDULED"
    : "VERIFYING";
}

function mapBEToFE(rows: ReservationResponseBE[]): ReservationItem[] {
  return rows.map((d) => {
    const normalized = (d.status || "").toUpperCase().trim();
    return {
      reservationId: d.reservationId,
      stationId: d.stationId,
      stationName: d.stationName,
      pillarId: d.pillarId,
      pillarCode: d.pillarCode ?? `P${d.pillarId}`,
      connectorType: d.connectorType ?? `Connector ${d.connectorId}`,
      connectorId: d.connectorId,
      startTime: d.startTime,
      status: mapStatus(d.status, d.startTime),
      holdFee: d.holdFee ?? 0,
      payment: {
        paid:
          (typeof d.payment?.paid === "boolean" && d.payment.paid) ||
          normalized === "PAID" ||
          normalized === "PAID_CONFIRMED",
        depositTransactionId: d.payment?.depositTransactionId || undefined,
      },
    };
  });
}

function pickNext(
  items: ReservationItem[]
): Partial<ReservationItem> | undefined {
  const future = items
    .filter((i) => new Date(i.startTime).getTime() > Date.now())
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const n = future[0];
  return n
    ? {
        stationName: n.stationName,
        pillarCode: n.pillarCode,
        connectorType: n.connectorType,
        startTime: n.startTime,
      }
    : undefined;
}

/* ===== UI palette per status ===== */
type UIConf = {
  stripe: string;
  ring: string;
  glow: string;
  badge: string;
  text: string;
  btn: string;
  btnGlow: string;
  halo: string;
  icon: React.ReactNode;
  label: string;
};
const Icon = {
  ready: <PlugZap className="w-4 h-4" />,
  scheduled: <Clock className="w-4 h-4" />,
  pay: <CreditCard className="w-4 h-4" />,
  verifying: <QrCode className="w-4 h-4" />,
  verified: <Check className="w-4 h-4" />,
  danger: <ShieldAlert className="w-4 h-4" />,
  done: <CheckCircle2 className="w-4 h-4" />,
};

const UI: Record<ReservationStatus, UIConf> = {
  CONFIRMED: {
    stripe: "from-emerald-500 to-emerald-600",
    ring: "ring-emerald-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(16,185,129,.70)]",
    badge: "bg-emerald-600 text-white border-0",
    text: "text-emerald-700",
    btn: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:to-emerald-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(16,185,129,.7)]",
    halo: "from-emerald-400/60 via-emerald-500/30 to-emerald-400/60",
    icon: Icon.ready,
    label: "Ready",
  },
  SCHEDULED: {
    stripe: "from-amber-500 to-amber-600",
    ring: "ring-amber-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(245,158,11,.70)]",
    badge: "bg-amber-500 text-white border-0",
    text: "text-amber-700",
    btn: "bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(245,158,11,.7)]",
    halo: "from-amber-300/60 via-amber-500/30 to-amber-300/60",
    icon: Icon.scheduled,
    label: "Scheduled",
  },
  PENDING_PAYMENT: {
    stripe: "from-rose-600 to-rose-700",
    ring: "ring-rose-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(244,63,94,.70)]",
    badge: "bg-rose-600 text-white border-0",
    text: "text-rose-700",
    btn: "bg-gradient-to-r from-rose-600 to-rose-500 hover:to-rose-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(244,63,94,.7)]",
    halo: "from-rose-400/60 via-rose-500/30 to-rose-400/60",
    icon: Icon.pay,
    label: "Payment required",
  },
  CANCELLED: {
    stripe: "from-rose-700 to-rose-800",
    ring: "ring-rose-300/60",
    glow: "shadow-[0_22px_58px_-24px_rgba(190,18,60,.55)]",
    badge: "bg-rose-700 text-white border-0",
    text: "text-rose-800",
    btn: "bg-white hover:bg-slate-50 text-slate-900 border",
    btnGlow: "shadow-[0_8px_24px_-10px_rgba(2,6,23,.12)]",
    halo: "from-rose-400/50 via-rose-500/20 to-rose-400/50",
    icon: Icon.danger,
    label: "Cancelled",
  },
  EXPIRED: {
    stripe: "from-zinc-500 to-zinc-600",
    ring: "ring-zinc-300/60",
    glow: "shadow-[0_22px_58px_-24px_rgba(24,24,27,.45)]",
    badge: "bg-zinc-600 text-white border-0",
    text: "text-zinc-700",
    btn: "bg-white hover:bg-slate-50 text-slate-900 border",
    btnGlow: "shadow-[0_8px_24px_-10px_rgba(2,6,23,.12)]",
    halo: "from-zinc-400/50 via-zinc-500/30 to-zinc-400/50",
    icon: Icon.danger,
    label: "Expired",
  },
  VERIFYING: {
    stripe: "from-amber-600 to-amber-700",
    ring: "ring-amber-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(245,158,11,.70)]",
    badge: "bg-amber-600 text-white border-0",
    text: "text-amber-700",
    btn: "bg-gradient-to-r from-amber-600 to-amber-500 hover:to-amber-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(245,158,11,.7)]",
    halo: "from-amber-400/60 via-amber-500/30 to-amber-400/60",
    icon: Icon.verifying,
    label: "Verifying",
  },
  VERIFIED: {
    stripe: "from-teal-600 to-teal-700",
    ring: "ring-teal-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(13,148,136,.70)]",
    badge: "bg-teal-600 text-white border-0",
    text: "text-teal-700",
    btn: "bg-gradient-to-r from-teal-600 to-teal-500 hover:to-teal-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(13,148,136,.7)]",
    halo: "from-teal-400/60 via-teal-500/30 to-teal-400/60",
    icon: Icon.verified,
    label: "Verified",
  },
  PLUGGED: {
    stripe: "from-sky-600 to-sky-700",
    ring: "ring-sky-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(2,132,199,.70)]",
    badge: "bg-sky-600 text-white border-0",
    text: "text-sky-700",
    btn: "bg-gradient-to-r from-sky-600 to-sky-500 hover:to-sky-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(2,132,199,.7)]",
    halo: "from-sky-400/60 via-sky-500/30 to-sky-400/60",
    icon: Icon.ready,
    label: "Plugged",
  },
  CHARGING: {
    stripe: "from-emerald-600 to-emerald-700",
    ring: "ring-emerald-300/70",
    glow: "shadow-[0_26px_70px_-26px_rgba(16,185,129,.70)]",
    badge: "bg-emerald-600 text-white border-0",
    text: "text-emerald-700",
    btn: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:to-emerald-600 text-white",
    btnGlow: "shadow-[0_8px_28px_-8px_rgba(16,185,129,.7)]",
    halo: "from-emerald-400/60 via-emerald-500/30 to-emerald-400/60",
    icon: Icon.ready,
    label: "Charging",
  },
  COMPLETED: {
    stripe: "from-zinc-500 to-zinc-600",
    ring: "ring-zinc-300/70",
    glow: "shadow-[0_22px_58px_-24px_rgba(24,24,27,.45)]",
    badge: "bg-zinc-600 text-white border-0",
    text: "text-zinc-700",
    btn: "bg-white hover:bg-slate-50 text-slate-900 border",
    btnGlow: "shadow-[0_8px_24px_-10px_rgba(2,6,23,.12)]",
    halo: "from-zinc-400/60 via-zinc-500/30 to-zinc-400/60",
    icon: Icon.done,
    label: "Completed",
  },
};

/* ===== Dialog animation  ===== */
const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.96,
    transition: { duration: 0.18 },
  },
};

const StatusCards = () => {
  /* ===== State ===== */
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [next, setNext] = useState<MyReservationsResponse["nextBooking"]>();
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  const [kycStatus, setKycStatus] =
    useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [kycAtOpen, setKycAtOpen] =
    useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [qrStation, setQrStation] = useState<string>("");
  const [lastResId, setLastResId] = useState<number | null>(null);

  const [pmOpen, setPmOpen] = useState(false);
  const [pmResId, setPmResId] = useState<number | null>(null);
  const [payFlow, setPayFlow] = useState<"prepaid" | "postpaid" | "cash">(
    "prepaid"
  );
  const [payChannel, setPayChannel] = useState<
    "wallet" | "vnpay" | "cash"
  >("wallet");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [est, setEst] = useState<EstimateResp | null>(null);
  const [estimating, setEstimating] = useState<boolean>(false);

  const [currentSoc, setCurrentSoc] = useState<number>(() => {
    const v = Number(localStorage.getItem("soc_now"));
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 50;
  });
  const TARGET_SOC_FIXED = 100;

  // dialog chi tiết reservation
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRes, setDetailRes] = useState<ReservationItem | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  /* ===== Load reservations + KYC ===== */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (USE_MOCK) {
          if (!mounted) return;
          setItems(mapBEToFE(MOCK_RESERVATIONS.items as any));
          setNext(MOCK_RESERVATIONS.nextBooking);
          setCurrentUserId(1);
          setKycStatus("APPROVED");
          return;
        }

        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          typeof me.data?.user_id === "number"
            ? me.data.user_id
            : typeof me.data?.id === "number"
            ? me.data.id
            : undefined;
        if (!userId) throw new Error("Cannot determine current user id.");
        setCurrentUserId(userId);

        const { data } = await api.get<ReservationResponseBE[]>(
          `/user/${userId}/reservations`,
          { withCredentials: true }
        );
        if (!mounted) return;
        const feItems = mapBEToFE(Array.isArray(data) ? data : []);
        setItems(feItems);
        setNext(pickNext(feItems));

        try {
          const kycRes = await api.get(`/kyc/${userId}`, {
            withCredentials: true,
          });
          const payload = kycRes?.data ?? {};
          const kyc = payload?.data ?? payload?.result ?? payload;
          const raw = String(kyc?.status ?? "").toUpperCase().trim();
          const norm: "PENDING" | "APPROVED" | "REJECTED" =
            raw === "APPROVED"
              ? "APPROVED"
              : raw === "REJECTED"
              ? "REJECTED"
              : "PENDING";
          setKycStatus(norm);
        } catch {
          setKycStatus("PENDING");
        }
      } catch (e: any) {
        setItems(mapBEToFE((MOCK_RESERVATIONS.items as any) ?? []));
        setNext(MOCK_RESERVATIONS.nextBooking);
        setCurrentUserId(1);
        setKycStatus("APPROVED");
        toast({
          title: "Showing mock data",
          description:
            e?.response?.data?.message ||
            e?.message ||
            "Could not reach backend.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  /* ===== QR countdown ===== */
  useEffect(() => {
    if (!qrOpen || secondsLeft <= 0) return;
    const t = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(t);
  }, [qrOpen, secondsLeft]);

  const activeCount = useMemo(
    () =>
      items.filter((i) =>
        [
          "CONFIRMED",
          "SCHEDULED",
          "PENDING_PAYMENT",
          "VERIFYING",
          "VERIFIED",
          "PLUGGED",
          "CHARGING",
        ].includes(i.status)
      ).length,
    [items]
  );

  /* ===== Actions ===== */
  const gotoReview = (r: ReservationItem) =>
    navigate(`/stations/${r.stationId}/review`, {
      state: { stationName: r.stationName, pillarCode: r.pillarCode },
    });

  const onStartChargingAPI = async (reservationId: number) => {
    try {
      const r = items.find((x) => x.reservationId === reservationId);
      if (!r) throw new Error("Reservation not found.");
      if (!currentUserId) throw new Error("Cannot determine current user id.");
      if (!vehicleId) throw new Error("Please choose a vehicle.");

      if (USE_MOCK) {
        toast({
          title: "Charging session started ",
          description: `Reservation #${reservationId}`,
        });
        navigate(
          `/charging?start=true&reservationId=${reservationId}&sessionId=MOCK-SESS-1`
        );
        return;
      }

      const payload = {
        reservationId: r.reservationId,
        pillarId: r.pillarId,
        driverId: currentUserId,
        vehicleId: vehicleId,
        targetSoc: 1,
        paymentMethod:
          payChannel === "wallet"
            ? "WALLET"
            : payChannel === "vnpay"
            ? "VNPAY"
            : "CASH",
      };
      const { data } = await api.post("/session/create", payload, {
        withCredentials: true,
      });
      const ret = data?.data ?? data;
      const sid = ret?.sessionId ?? ret?.id;
      if (!sid) throw new Error("Invalid start response (missing sessionId).");

      toast({ title: "Charging session started" });

      const initialSocFrac = (Number(currentSoc) || 0) / 100;
      const targetSocFrac = 1;
      localStorage.setItem(
        `session_meta_${sid}`,
        JSON.stringify({
          vehicleId,
          initialSoc: initialSocFrac,
          targetSoc: targetSocFrac,
          reservationId,
        })
      );
      localStorage.setItem(
        `reservation_cache_${reservationId}`,
        JSON.stringify({
          reservationId,
          stationId: r.stationId,
          stationName: r.stationName,
          pillarId: r.pillarId,
          pillarCode: r.pillarCode,
        })
      );

      navigate(
        `/charging?sessionId=${encodeURIComponent(sid)}` +
          `&reservationId=${reservationId}` +
          `&vehicleId=${vehicleId}` +
          `&initialSoc=${initialSocFrac}` +
          `&targetSoc=${targetSocFrac}`
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Cannot start the session.";
      toast({
        title: "Action failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const onPayNow = (r: ReservationItem) => {
    const amount =
      (typeof r.holdFee === "number" && !Number.isNaN(r.holdFee)
        ? r.holdFee
        : undefined) ?? 50000;
    navigate("/reservation/deposit", {
      state: {
        reservationId: r.reservationId,
        amount,
        stationName: r.stationName,
        portLabel: r.pillarCode,
        connectorLabel: r.connectorType,
        startTime: r.startTime,
        description: `Deposit for reservation #${r.reservationId}`,
      },
    });
  };

  const openQrFor = async (r: ReservationItem) => {
    if (USE_MOCK) {
      const token = "MOCK-" + r.reservationId;
      const expires = new Date(
        Date.now() + 5 * 60 * 1000
      ).toISOString();
      const qr = `${window.location.origin}/checkin?token=${token}`;
      setQrToken(token);
      setQrExpiresAt(expires);
      setQrUrl(qr);
      setSecondsLeft(5 * 60);
      setQrStation(`${r.stationName} • ${r.pillarCode}`);
      setLastResId(r.reservationId);
      setQrOpen(true);
      return;
    }
    try {
      if (!currentUserId) throw new Error("Cannot determine current user id.");
      const { data } = await api.post(
        "/api/token/create",
        { userId: currentUserId, reservationId: r.reservationId },
        { withCredentials: true }
      );
      const payload = data?.data ?? data;
      const token = String(payload?.token || "");
      let url = payload?.qrUrl || "";
      if (!url || url.includes("your-fe.com"))
        url = `${window.location.origin}/checkin?token=${token}`;
      const exp = String(payload?.expiresAt || "");
      if (!token || !url || !exp)
        throw new Error("Invalid token response.");

      setQrToken(token);
      setQrUrl(url);
      setQrExpiresAt(exp);
      setSecondsLeft(
        Math.max(
          0,
          Math.floor((new Date(exp).getTime() - Date.now()) / 1000)
        )
      );
      setQrStation(`${r.stationName} • ${r.pillarCode}`);
      setLastResId(r.reservationId);
      setQrOpen(true);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Could not create check-in token.";
      toast({
        title: "Action failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const markPlugged = async (r: ReservationItem) => {
    try {
      if (USE_MOCK) {
        setItems((xs) =>
          xs.map((x) =>
            x.reservationId === r.reservationId
              ? { ...x, status: "PLUGGED" }
              : x
          )
        );
        toast({
          title: "Plugged in",
          description: `${r.stationName} • ${r.pillarCode}`,
        });
        return;
      }
      await api.post(`/book/${r.reservationId}`, {}, { withCredentials: true });
      setItems((xs) =>
        xs.map((x) =>
          x.reservationId === r.reservationId
            ? { ...x, status: "PLUGGED" }
            : x
        )
      );
      toast({ title: "Plugged in" });
    } catch (e: any) {
      toast({
        title: "Action failed",
        description:
          e?.response?.data?.message || "Cannot mark plugged.",
        variant: "destructive",
      });
    }
  };

  /* Cancel (SCHEDULED only) */
  const onCancel = async (r: ReservationItem) => {
    try {
      if (USE_MOCK) {
        setItems((xs) =>
          xs.map((x) =>
            x.reservationId === r.reservationId
              ? { ...x, status: "CANCELLED" }
              : x
          )
        );
        toast({ title: "Reservation cancelled (mock)" });
        return;
      }
      await api.post(`/book/cancel/${r.reservationId}`, {}, { withCredentials: true });
      setItems((xs) =>
        xs.map((x) =>
          x.reservationId === r.reservationId
            ? { ...x, status: "CANCELLED" }
            : x
        )
      );
      toast({ title: "Reservation cancelled" });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Cannot cancel reservation.";
      toast({
        title: "Action failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const openPayment = async (r: ReservationItem) => {
    setPmResId(r.reservationId);

    // Snapshot KYC tại thời điểm mở popup
    let effectiveKyc = kycStatus;
    if (currentUserId) {
      try {
        const kycRes = await api.get(`/kyc/${currentUserId}`, {
          withCredentials: true,
        });
        const payload = kycRes?.data ?? {};
        const kyc = payload?.data ?? payload?.result ?? payload;
        const raw = String(kyc?.status ?? "")
          .toUpperCase()
          .trim();
        effectiveKyc =
          raw === "APPROVED"
            ? "APPROVED"
            : raw === "REJECTED"
            ? "REJECTED"
            : "PENDING";
        setKycStatus(effectiveKyc);
      } catch {
        // giữ nguyên
      }
    }
    setKycAtOpen(effectiveKyc);

    const initialFlow: "prepaid" | "postpaid" =
      effectiveKyc === "APPROVED" ? "postpaid" : "prepaid";
    setPayFlow(initialFlow);
    setPayChannel(initialFlow === "prepaid" ? "wallet" : "vnpay");

    let enriched = r;
    try {
      const { data } = await api.post(
        `/book/${r.reservationId}`,
        {},
        { withCredentials: true }
      );
      const d = data?.data ?? data ?? {};
      enriched = {
        ...r,
        stationId: d.stationId ?? r.stationId,
        pillarId: d.pillarId ?? r.pillarId,
        connectorId: d.connectorId ?? r.connectorId,
        connectorType: d.connectorType ?? r.connectorType,
        pillarCode: d.pillarCode ?? r.pillarCode,
      };
      setItems((xs) =>
        xs.map((x) =>
          x.reservationId === r.reservationId ? { ...x, ...enriched } : x
        )
      );
    } catch {
      // ignore
    }

    if (currentUserId) {
      api
        .get(`/vehicle/${currentUserId}`, { withCredentials: true })
        .then((res) => {
          const raw =
            res?.data?.data ?? res?.data?.content ?? res?.data ?? [];
          const list: Vehicle[] = Array.isArray(raw)
            ? raw.map(mapApiVehicle)
            : [];
          setVehicles(list);
          if (list.length === 1) {
            setVehicleId(list[0].id);
            if (typeof list[0].currentSoc === "number")
              setCurrentSoc(list[0].currentSoc);
            fetchEstimateFor(enriched, list[0].id, list[0].currentSoc);
          }
        })
        .catch(() => setVehicles([]));
    }

    setEst(null);
    setPmOpen(true);
  };

  // Tìm sessionId đang chạy từ localStorage theo reservationId
  function findSessionIdByReservation(
    reservationId: number
  ): string | null {
    try {
      const prefix = "session_meta_";
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (!k.startsWith(prefix)) continue;
        const sid = k.slice(prefix.length);
        const meta = JSON.parse(localStorage.getItem(k) || "null");
        if (meta && Number(meta.reservationId) === Number(reservationId)) {
          return String(sid);
        }
      }
    } catch {}
    return null;
  }

  async function fetchEstimateFor(
    r?: ReservationItem,
    vehId?: number,
    socNowOverride?: number
  ) {
    if (!r || !vehId || !r.pillarId || !r.connectorId) {
      setEst(null);
      return;
    }
    setEstimating(true);
    try {
      const socToUse =
        typeof socNowOverride === "number" ? socNowOverride : currentSoc;

      const payload = {
        vehicleId: vehId,
        stationId: r.stationId,
        pillarId: r.pillarId,
        connectorId: r.connectorId,
        reservationId: r.reservationId,
        socNow: isFinite(socToUse) ? socToUse / 100 : undefined,
        socTarget: 1,
        kW: DEMO_DEFAULT_KW,
        tick: DEMO_DEFAULT_TICK_SEC,
      };

      const { data } = await api.post("/estimate/estimateReal", payload, {
        withCredentials: true,
      });
      const ret = data?.data ?? data;

      if (ret && typeof ret.estimatedMinutes === "number") {
        setEst({
          energyKwh: ret.energyKwh ?? 0,
          estimatedCost: ret.estimatedCost ?? 0,
          estimatedMinutes: ret.estimatedMinutes ?? 0,
          socTarget: ret.socTarget,
          minuteUntilEnd: ret.minuteUntilEnd,
        });
      } else {
        setEst(null);
      }
    } catch {
      setEst(null);
    } finally {
      setEstimating(false);
    }
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken || "");
      toast({
        title: "Copied",
        description: "Token copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Cannot copy token.",
        variant: "destructive",
      });
    }
  };
  const regenerate = async () => {
    const r = items.find((x) => x.reservationId === lastResId);
    if (r) await openQrFor(r);
  };

  const openDetails = (r: ReservationItem) => {
    setDetailRes(r);
    setDetailOpen(true);
  };

  /* ===== Row renderer ===== */
  const renderReservation = (r: ReservationItem) => {
    const ready = r.status === "CONFIRMED";
    const scheduled = r.status === "SCHEDULED";
    const pending = r.status === "PENDING_PAYMENT";
    const ui = UI[r.status];

    return (
      <div
        key={r.reservationId}
        className={[
          "group relative grid grid-cols-[10px_1fr_auto] items-stretch gap-0 rounded-2xl",
          "bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75",
          "border border-white/40 ring-1",
          ui.ring,
          "transition-all duration-300",
          "hover:-translate-y-[2px] hover:shadow-[0_28px_90px_-34px_rgba(2,6,23,.35)]",
          ui.glow,
        ].join(" ")}
        style={{ minHeight: 104 }}
      >
        {/* left stripe */}
        <div
          className={`rounded-l-2xl bg-gradient-to-b ${ui.stripe} relative overflow-hidden`}
        >
          <span className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,.25),transparent)] animate-[shine_2.4s_ease-in-out_infinite]" />
        </div>

        {/* content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${ui.badge} shadow-sm`}
            >
              {ui.icon}
              <span className="font-medium">{ui.label}</span>
            </div>

            {/* Detail button */}
            <button
              type="button"
              onClick={() => openDetails(r)}
              className="
                inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full
                border border-slate-200/70 bg-slate-50/70 text-slate-600
                hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700
                transition-colors shadow-sm
              "
              title="View reservation details"
            >
              <Info className="w-3 h-3" />
              <span>Details</span>
            </button>
          </div>

          <h4 className="mt-2 font-bold text-[15.5px] sm:text-[16.5px] text-slate-900 tracking-tight">
            {r.stationName}
          </h4>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="text-xs rounded-full border-dashed"
            >{`Port ${r.pillarCode}`}</Badge>
            <Badge
              variant="outline"
              className="text-xs rounded-full border-dashed"
            >
              {r.connectorType}
            </Badge>
          </div>

          <p className={`mt-2 text-[13.5px] font-medium ${ui.text}`}>
            {fmtDateTime(r.startTime)}
            {ready && r.holdFee ? ` • Deposit ${fmtVnd(r.holdFee)}` : null}
            {pending ? " • Waiting for payment" : null}
          </p>
        </div>

        {/* actions */}
        <div className="pr-4 sm:pr-5 py-4 flex flex-col items-end justify-center gap-2">
          {ready && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                ui.btn,
                ui.btnGlow,
                "transition-all active:scale-[.98]",
              ].join(" ")}
              onClick={() => openPayment(r)}
            >
              <span className="relative z-10 flex items-center">
                <Zap className="w-4 h-4 mr-1" /> Start Charging
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {scheduled &&
            (isArrivableNow(r.startTime) ? (
              <Button
                size="sm"
                className={[
                  "relative overflow-hidden rounded-full px-4 h-9",
                  UI.SCHEDULED.btn,
                  UI.SCHEDULED.btnGlow,
                ].join(" ")}
                onClick={() => openQrFor(r)}
                title="Generate QR to check-in"
              >
                <span className="relative z-10 flex items-center">
                  <QrCode className="w-4 h-4 mr-1" /> Arrived
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
                />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-4 h-9 border-amber-200 text-amber-700"
                disabled
              >
                <Clock className="w-4 h-4 mr-1" /> Not yet
              </Button>
            ))}

          {/* Cancel for SCHEDULED */}
          {r.status === "SCHEDULED" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 h-9 border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => onCancel(r)}
              title="Cancel this reservation"
            >
              <XCircle className="w-4 h-4 mr-1" /> Cancel
            </Button>
          )}

          {r.status === "VERIFYING" && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.VERIFYING.btn,
                UI.VERIFYING.btnGlow,
              ].join(" ")}
              onClick={() => openQrFor(r)}
            >
              <span className="relative z-10 flex items-center">
                <QrCode className="w-4 h-4 mr-1" /> Verify
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {r.status === "VERIFIED" && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.VERIFIED.btn,
                UI.VERIFIED.btnGlow,
              ].join(" ")}
              onClick={() => markPlugged(r)}
            >
              <span className="relative z-10 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Plug
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {r.status === "PLUGGED" && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.PLUGGED.btn,
                UI.PLUGGED.btnGlow,
              ].join(" ")}
              onClick={() => openPayment(r)}
            >
              <span className="relative z-10 flex items-center">
                <Zap className="w-4 h-4 mr-1" /> Start Charging
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {r.status === "PENDING_PAYMENT" && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.PENDING_PAYMENT.btn,
                UI.PENDING_PAYMENT.btnGlow,
                "animate-[pulse_2.5s_ease-in-out_infinite]",
              ].join(" ")}
              onClick={() => onPayNow(r)}
            >
              <span className="relative z-10 flex items-center">
                <CreditCard className="w-4 h-4 mr-1" /> Pay now
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {r.status === "CHARGING" && (
            <Button
              size="sm"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.CHARGING.btn,
                UI.CHARGING.btnGlow,
                "transition-all active:scale-[.98]",
              ].join(" ")}
              onClick={() => {
                const sid = findSessionIdByReservation(
                  r.reservationId
                );
                if (sid) {
                  navigate(
                    `/charging?sessionId=${encodeURIComponent(
                      sid
                    )}&reservationId=${r.reservationId}`
                  );
                } else {
                  toast({
                    title: "Cannot find current session",
                    description:
                      "Phiên sạc đang chạy không tìm thấy trên máy. Thử mở lại từ mục gần đây hoặc vào QR/Start.",
                    variant: "destructive",
                  });
                }
              }}
              title="Re-open the active charging session"
            >
              <span className="relative z-10 flex items-center">
                <Zap className="w-4 h-4 mr-1" /> Return to session
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-900 group-hover:translate-x-full"
              />
            </Button>
          )}

          {r.status === "COMPLETED" && (
            <Button
              size="sm"
              variant="outline"
              className={[
                "relative overflow-hidden rounded-full px-4 h-9",
                UI.COMPLETED.btn,
                UI.COMPLETED.btnGlow,
              ].join(" ")}
              onClick={() => gotoReview(r)}
            >
              Review <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {(r.status === "CANCELLED" || r.status === "EXPIRED") && (
            <div className={`text-xs px-2 py-1 rounded-full ${ui.badge}`}>
              {ui.label}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight">
          Today’s Overview
        </h2>

        {/* next booking pill */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-slate-600">Next Booking</span>
          {next?.startTime ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 backdrop-blur px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-[13px] text-slate-800">
                {new Date(next.startTime).toLocaleDateString()}{" "}
                <span className="text-slate-500">
                  {new Date(next.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              {next.stationName && (
                <span className="hidden md:inline-flex items-center gap-1 text-[12px] text-slate-600">
                  <MapPin className="w-3.5 h-3.5" />
                  {next.stationName}
                </span>
              )}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="rounded-full text-slate-600"
            >
              No upcoming
            </Badge>
          )}
        </div>
      </div>

      {/* reservations */}
      <Card className="rounded-2xl border border-slate-200/70 shadow-[0_22px_60px_-20px_rgba(2,6,23,.15)]">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg">My Reservations</span>
            </div>
            {!loading && (
              <Badge variant="secondary" className="rounded-full">
                {activeCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[104px] rounded-2xl bg-slate-100/70 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              You have no reservations yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 nice-scroll">
              {items.map(renderReservation)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          className="
            sm:max-w-lg p-0 border-none bg-transparent shadow-none
            overflow-visible
          "
        >
          <AnimatePresence mode="wait">
            {detailOpen && detailRes && (
              <motion.div
                key={detailRes.reservationId}
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="
                  overflow-hidden rounded-2xl
                  border border-white/70 bg-white/85 backdrop-blur-xl
                  shadow-[0_30px_90px_-30px_rgba(2,6,23,.45)]
                "
              >
                {/* header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/70">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="flex items-center gap-2 text-[18px]">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent font-extrabold">
                        Reservation Details
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700">
                        ID&nbsp;#{detailRes.reservationId}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700">
                        <MapPin className="w-3 h-3 mr-1" />
                        {detailRes.stationName}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* body */}
                <div className="px-6 py-5 space-y-5 bg-slate-50/70">
                  {/* status row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={[
                        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shadow-sm",
                        UI[detailRes.status].badge,
                      ].join(" ")}
                    >
                      {UI[detailRes.status].icon}
                      <span className="font-semibold">
                        {UI[detailRes.status].label}
                      </span>
                    </div>

                    {detailRes.holdFee ? (
                      <div className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Lock className="w-3 h-3" />
                        Deposit {fmtVnd(detailRes.holdFee)}
                      </div>
                    ) : null}

                    {detailRes.payment?.paid && (
                      <div className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                        <Check className="w-3 h-3" />
                        Deposit paid
                      </div>
                    )}
                  </div>

                  {/* row 1: Station + Start time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Station */}
                    <div className="h-full rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          Station
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {detailRes.stationName}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] rounded-full border-dashed"
                        >
                          Port {detailRes.pillarCode}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[11px] rounded-full border-dashed"
                        >
                          {detailRes.connectorType}
                        </Badge>
                      </div>
                    </div>

                    {/* Start time */}
                    <div className="h-full rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm flex flex-col justify-center">
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Start time
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {fmtDateTime(detailRes.startTime)}
                      </div>
                    </div>
                  </div>

                  {/* row 2: Connector ID + Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Connector ID */}
                    <div className="h-full rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm flex flex-col justify-center">
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                        <QrCode className="w-3.5 h-3.5" />
                        Connector ID
                      </div>
                      <div className="text-sm text-slate-900">
                        {typeof detailRes.connectorId === "number"
                          ? `#${detailRes.connectorId}`
                          : "—"}
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="h-full rounded-2xl border border-slate-200/70 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          Payment
                        </span>
                        {detailRes.payment?.depositTransactionId && (
                          <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                            {detailRes.payment.depositTransactionId}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-900 flex items-center gap-1.5">
                        {detailRes.holdFee ? (
                          <>
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            Hold fee{" "}
                            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                              {fmtVnd(detailRes.holdFee)}
                            </span>
                          </>
                        ) : (
                          <span>No deposit recorded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* hint */}
                  <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-[11.5px] text-slate-600 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-amber-500" />
                    <span>Reservation details are read-only here.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* QR dialog with animation */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
          <AnimatePresence mode="wait">
            {qrOpen && (
              <motion.div
                key={qrToken ?? "qr-shell"}
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="
                  rounded-2xl border border-white/70 bg-white/90
                  backdrop-blur-xl p-6
                  shadow-[0_26px_80px_-30px_rgba(2,6,23,.45)]
                "
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Check-in QR
                  </DialogTitle>
                  <DialogDescription>
                    Show this QR at the station to check in. Expires in{" "}
                    <span className="font-semibold">
                      {Math.floor(secondsLeft / 60)}:
                      {String(secondsLeft % 60).padStart(2, "0")}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col items-center gap-3">
                  {qrUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (qrToken)
                          navigate(
                            `/checkin?token=${encodeURIComponent(qrToken)}`
                          );
                      }}
                      title="Open check-in in this tab"
                      className="focus:outline-none"
                    >
                      <img
                        alt="Check-in QR"
                        className="rounded-lg border p-2 cursor-pointer"
                        width={240}
                        height={240}
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                          qrUrl
                        )}`}
                      />
                      <div className="mt-1 text-xs text-slate-500 text-center">
                        Tap to open Check-in here
                      </div>
                    </button>
                  ) : null}

                  <div className="text-sm text-center text-muted-foreground">
                    {qrStation}
                  </div>

                  <div className="w-full text-xs break-all rounded-lg bg-muted p-2">
                    <div className="text-muted-foreground">Token</div>
                    <div className="font-mono">{qrToken}</div>
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <div className="flex w-full justify-between gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={copyToken}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                      <Button className="flex-1" onClick={regenerate}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Expires at:{" "}
                    {qrExpiresAt
                      ? new Date(qrExpiresAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Payment dialog with animation */}
      <Dialog open={pmOpen} onOpenChange={setPmOpen}>
        <DialogContent
          className="
            sm:max-w-lg p-0 border-none bg-transparent shadow-none
            overflow-visible
          "
        >
          <AnimatePresence mode="wait">
            {pmOpen && (
              <motion.div
                key={pmResId ?? "payment-shell"}
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="
                  rounded-2xl overflow-hidden
                  border border-white/60 bg-white/85 backdrop-blur-xl
                  shadow-[0_30px_90px_-30px_rgba(2,6,23,.35)]
                "
              >
                {/* header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/60 via-white to-cyan-50/60">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="flex items-center gap-2 text-[18px]">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg
                                bg-gradient-to-br from-emerald-500 to-cyan-600"
                      >
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent font-extrabold">
                        Select Payment Method
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      {kycAtOpen === "APPROVED"
                        ? "Choose a payment flow below. Channel is auto-selected and secured."
                        : "KYC chưa duyệt: chỉ khả dụng hình thức Prepaid."}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* body */}
                <div className="px-6 py-5 space-y-6">
                  {/* Flow segmented */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800">
                      Method
                    </div>
                    <div
                      className="
                  grid grid-cols-3 p-1 rounded-2xl bg-white/70 border border-slate-200/70
                  shadow-[inset_0_1px_0_rgba(255,255,255,.8)]
                "
                    >
                      <Button
                        variant="ghost"
                        className={[
                          "h-10 rounded-xl text-sm font-semibold transition-all",
                          "data-[active=true]:text-white data-[active=true]:shadow-[0_8px_22px_-10px_rgba(16,185,129,.55)]",
                          "data-[active=true]:bg-[linear-gradient(90deg,#10B981_0%,#06B6D4_100%)]",
                        ].join(" ")}
                        data-active={payFlow === "prepaid"}
                        onClick={() => {
                          setPayFlow("prepaid");
                          setPayChannel("wallet");
                        }}
                      >
                        Prepaid
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={kycAtOpen !== "APPROVED"}
                        className={[
                          "h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-60",
                          "data-[active=true]:text-white data-[active=true]:shadow-[0_8px_22px_-10px_rgba(16,185,129,.55)]",
                          "data-[active=true]:bg-[linear-gradient(90deg,#10B981_0%,#06B6D4_100%)]",
                        ].join(" ")}
                        data-active={payFlow === "postpaid"}
                        onClick={() => {
                          setPayFlow("postpaid");
                          setPayChannel("vnpay");
                        }}
                      >
                        Postpaid
                      </Button>
                      <Button
                        variant="ghost"
                        className={[
                          "h-10 rounded-xl text-sm font-semibold transition-all",
                          "data-[active=true]:text-white data-[active=true]:shadow-[0_8px_22px_-10px_rgba(16,185,129,.55)]",
                          "data-[active=true]:bg-[linear-gradient(90deg,#10B981_0%,#06B6D4_100%)]",
                        ].join(" ")}
                        data-active={payFlow === "cash"}
                        onClick={() => {
                          setPayFlow("cash");
                          setPayChannel("cash");
                        }}
                      >
                        Cash
                      </Button>
                    </div>
                  </div>

                  {/* Channel card */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800">
                      Payment
                    </div>

                    {payFlow === "prepaid" && (
                      <div
                        className="
                    flex items-center gap-3 rounded-xl border border-emerald-200/70
                    bg-gradient-to-r from-emerald-50/80 to-cyan-50/60 px-4 py-3
                    shadow-[0_8px_24px_-12px_rgba(16,185,129,.35)]
                  "
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center
                                  bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-md"
                        >
                          <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="leading-tight">
                          <div className="font-semibold text-slate-900">
                            Wallet
                          </div>
                          <div className="text-xs text-slate-500">
                            Auto-selected for Prepaid
                          </div>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700">
                          <Lock className="w-3.5 h-3.5" /> secured
                        </span>
                      </div>
                    )}

                    {payFlow === "postpaid" && (
                      <div
                        className="
                    flex items-center gap-3 rounded-xl border border-sky-200/70
                    bg-gradient-to-r from-sky-50/80 to-emerald-50/60 px-4 py-3
                    shadow-[0_8px_24px_-12px_rgba(14,165,233,.35)]
                  "
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center
                                  bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md"
                        >
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div className="leading-tight">
                          <div className="font-semibold text-slate-900">
                            VNPay
                          </div>
                          <div className="text-xs text-slate-500">
                            Auto-selected for Postpaid
                          </div>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-600">
                          <Lock className="w-3.5 h-3.5" /> secured
                        </span>
                      </div>
                    )}

                    {payFlow === "cash" && (
                      <div
                        className="
                    flex items-center gap-3 rounded-xl border border-slate-200/70
                    bg-white/70 px-4 py-3 shadow-sm
                  "
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-900/90">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="leading-tight">
                          <div className="font-semibold text-slate-900">
                            Cash (Pay at station)
                          </div>
                          <div className="text-xs text-slate-500">
                            On-site payment
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-800">
                      Charging Vehicle
                    </div>
                    <select
                      className="
                  w-full h-11 rounded-xl px-3 border border-slate-300/80
                  bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
                  shadow-[inset_0_1px_0_rgba(255,255,255,.8)]
                "
                      value={vehicleId ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value) || null;
                        setVehicleId(v);
                        const picked = vehicles.find(
                          (x) => x.id === v
                        );
                        const socPct =
                          typeof picked?.currentSoc === "number"
                            ? picked!.currentSoc!
                            : currentSoc;
                        setCurrentSoc(socPct);
                        const rr = items.find(
                          (x) => x.reservationId === pmResId!
                        );
                        if (rr) fetchEstimateFor(rr, v!, socPct);
                      }}
                    >
                      <option value="" disabled>
                        Choose vehicle
                      </option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make || ""} {v.model || ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SOC */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-800">
                        Current SOC
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {currentSoc}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={currentSoc}
                      disabled
                      readOnly
                      className="w-full opacity-70 cursor-not-allowed accent-emerald-500"
                    />
                  </div>

                  {/* Estimate */}
                  <div
                    className="
                rounded-xl border bg-white/70 p-3
                ring-1 ring-transparent hover:ring-emerald-200/70 transition
              "
                  >
                    {!vehicleId || !pmResId ? (
                      <div className="text-sm text-slate-500">
                        Select vehicle to estimate.
                      </div>
                    ) : estimating ? (
                      <div className="text-sm text-emerald-700">
                        Estimating…
                      </div>
                    ) : est ? (
                      <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                        <div>
                          Time ~ <b>{est.estimatedMinutes} minutes</b>
                        </div>
                        <div>
                          Cost ~{" "}
                          <b className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                            {fmtVnd(est.estimatedCost)}
                          </b>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Cannot estimate.
                      </div>
                    )}
                  </div>
                </div>

                {/* footer */}
                <div className="px-6 pb-5 pt-4 border-t border-slate-200/60 bg-white/70">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPmOpen(false)}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!pmResId) return;
                        if (payFlow === "postpaid" && kycAtOpen !== "APPROVED") {
                          toast({
                            title: "KYC required",
                            description:
                              "Bạn cần KYC ở trạng thái APPROVED để dùng Trả sau.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setPmOpen(false);
                        onStartChargingAPI(pmResId);
                      }}
                      disabled={!vehicleId}
                      className="
                  rounded-full px-5
                  bg-gradient-to-r from-emerald-600 to-cyan-600 text-white
                  shadow-[0_10px_28px_-12px_rgba(16,185,129,.6)]
                  hover:brightness-110 active:scale-[.98] transition
                  disabled:opacity-50 disabled:shadow-none
                "
                    >
                      <Zap className="w-4 h-4 mr-1" /> Start
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StatusCards;
