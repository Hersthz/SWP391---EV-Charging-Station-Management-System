import { useEffect, useMemo, useState } from "react";
import {
  Battery,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";

/** Toggle to always use mock data for quick UI preview */
const USE_MOCK = false;

/** ===== Types ===== */
type Vehicle = {
  id: number;
  userId?: number;
  make?: string;
  model?: string;
  batteryCapacityKwh?: number;
  acMaxKw?: number;
  dcMaxKw?: number;
  efficiency?: number;
  socNow?: number; // %
  socTarget?: number;
};

type EstimateResp = {
  energyKwh: number;
  energyFromStationKwh: number;
  estimatedCost: number;
  estimatedMinutes: number;
  advice?: string;
};

type ReservationStatus =
  | "CONFIRMED"
  | "SCHEDULED"
  | "PENDING_PAYMENT"
  | "CANCELLED"
  | "EXPIRED"
  | "VERIFYING"
  | "VERIFIED"
  | "PLUGGED"
  | "CHARGING"
  | "COMPLETED"; // ⬅️ NEW

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
  payment?: {
    depositTransactionId?: string;
    paid: boolean;
  };
}

interface MyReservationsResponse {
  items: ReservationItem[];
  nextBooking?: Partial<ReservationItem>;
}

/** ===== Backend DTO ===== */
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

/** ===== Mock data ===== */
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
      startTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 14, 0, 0).toISOString(),
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
      startTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 18, 0, 0).toISOString(),
      status: "PENDING_PAYMENT",
      holdFee: 0,
      payment: { paid: false },
    },
  ],
  nextBooking: {
    stationName: "Downtown Station #3",
    pillarCode: "P4",
    connectorType: "DC Ultra 350kW",
    startTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 14, 0, 0).toISOString(),
  },
};

/** ===== Helpers ===== */
const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");
const fmtVnd = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
const isArrivableNow = (startIso: string) => Date.now() >= new Date(startIso).getTime();

function mapApiVehicle(v: any): Vehicle {
  const rawSoc = v?.socNow ?? v?.soc_now;
  const socPct = typeof rawSoc === "number" ? (rawSoc <= 1 ? Math.round(rawSoc * 100) : Math.round(rawSoc)) : undefined;
  return {
    id: v?.id ?? v?.vehicleId,
    userId: v?.userId ?? v?.user_id,
    make: v?.make,
    model: v?.model,
    batteryCapacityKwh: v?.batteryCapacityKwh ?? v?.battery_capacity_kwh,
    acMaxKw: v?.acMaxKw ?? v?.ac_max_kw,
    dcMaxKw: v?.dcMaxKw ?? v?.dc_max_kw,
    efficiency: v?.efficiency,
    socNow: socPct, // %
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
  if (s === "COMPLETED") return "COMPLETED"; // ⬅️ NEW

  if (s === "SCHEDULED" || s === "RESERVED" || s === "BOOKED" || s === "PAID" || s === "CONFIRMED") {
    return startTime && new Date(startTime).getTime() > Date.now() ? "SCHEDULED" : "VERIFYING";
  }
  return startTime && new Date(startTime).getTime() > Date.now() ? "SCHEDULED" : "VERIFYING";
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

function pickNext(items: ReservationItem[]): Partial<ReservationItem> | undefined {
  const future = items
    .filter((i) => new Date(i.startTime).getTime() > Date.now())
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const n = future[0];
  if (!n) return undefined;
  return { stationName: n.stationName, pillarCode: n.pillarCode, connectorType: n.connectorType, startTime: n.startTime };
}

/** ===== Component ===== */
const StatusCards = () => {
  const batteryPct = 85;
  const batteryRangeKm = 425;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [next, setNext] = useState<MyReservationsResponse["nextBooking"]>();
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  /** KYC 3 trạng thái */
  const [kycStatus, setKycStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  /** snapshot KYC tại thời điểm mở popup */
  const [kycAtOpen, setKycAtOpen] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  // QR dialog state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [qrStation, setQrStation] = useState<string>("");
  const [lastResId, setLastResId] = useState<number | null>(null);

  // Payment dialog state
  const [pmOpen, setPmOpen] = useState(false);
  const [pmResId, setPmResId] = useState<number | null>(null);
  const [payFlow, setPayFlow] = useState<"prepaid" | "postpaid">("prepaid");
  const [payChannel, setPayChannel] = useState<"wallet" | "vnpay">("wallet");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [est, setEst] = useState<EstimateResp | null>(null);
  const [estimating, setEstimating] = useState<boolean>(false);

  // SOC (current)
  const [currentSoc, setCurrentSoc] = useState<number>(() => {
    const v = Number(localStorage.getItem("soc_now"));
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 50;
  });

  // Target luôn FULL = 100 (không cho chỉnh)
  const TARGET_SOC_FIXED = 100;

  const navigate = useNavigate();
  const { toast } = useToast();

  // Load reservations (+ KYC status)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (USE_MOCK) {
          if (!mounted) return;
          setItems(mapBEToFE(MOCK_RESERVATIONS.items as any));
          setNext(MOCK_RESERVATIONS.nextBooking);
          setCurrentUserId(1);
          setKycStatus("APPROVED"); // mock: cho phép Postpaid
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

        // lấy reservation list
        const { data } = await api.get<ReservationResponseBE[]>(`/user/${userId}/reservations`, {
          withCredentials: true,
        });
        if (!mounted) return;
        const feItems = mapBEToFE(Array.isArray(data) ? data : []);
        setItems(feItems);
        setNext(pickNext(feItems));

        // lấy KYC status từ /kyc/{userId}
        try {
          const kycRes = await api.get(`/kyc/${userId}`, { withCredentials: true });
          const payload = kycRes?.data ?? {};
          const kyc =
            payload?.data ??
            payload?.result ??
            payload;

          const raw = String(kyc?.status ?? "").toUpperCase().trim();
          const norm: "PENDING" | "APPROVED" | "REJECTED" =
            raw === "APPROVED" ? "APPROVED" : raw === "REJECTED" ? "REJECTED" : "PENDING";

          console.debug("[KYC] response raw =", payload, "parsed status =", norm);
          setKycStatus(norm);
        } catch (err) {
          console.warn("[KYC] fetch failed", err);
          setKycStatus("PENDING");
        }
      } catch (e: any) {
        setItems(mapBEToFE((MOCK_RESERVATIONS.items as any) ?? []));
        setNext(MOCK_RESERVATIONS.nextBooking);
        setCurrentUserId(1);
        setKycStatus("APPROVED"); // fallback mock
        toast({
          title: "Showing mock data",
          description: e?.response?.data?.message || e?.message || "Could not reach backend.",
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

  // countdown for QR token
  useEffect(() => {
    if (!qrOpen || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [qrOpen, secondsLeft]);

  const activeCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === "CONFIRMED" ||
          i.status === "SCHEDULED" ||
          i.status === "PENDING_PAYMENT" ||
          i.status === "VERIFYING" ||
          i.status === "VERIFIED" ||
          i.status === "PLUGGED" ||
          i.status === "CHARGING"
      ).length,
    [items]
  );

  // ====== Actions ======
  const gotoReview = (r: ReservationItem) => {
    navigate(`/stations/${r.stationId}/review`, {
      state: { stationName: r.stationName, pillarCode: r.pillarCode },
    });
  };

  const onStartChargingAPI = async (reservationId: number) => {
    try {
      const r = items.find((x) => x.reservationId === reservationId);
      if (!r) throw new Error("Reservation not found.");
      if (!currentUserId) throw new Error("Cannot determine current user id.");
      if (!vehicleId) throw new Error("Please choose a vehicle.");

      if (USE_MOCK) {
        toast({ title: "Charging session started ", description: `Reservation #${reservationId}` });
        navigate(`/charging?start=true&reservationId=${reservationId}&sessionId=MOCK-SESS-1`);
        return;
      }

      const payload = {
        reservationId: r.reservationId,
        pillarId: r.pillarId,
        driverId: currentUserId,
        vehicleId: vehicleId,
        targetSoc: 1, // luôn FULL
        paymentMethod: payChannel === "wallet" ? "WALLET" : "VNPAY",
      };

      const { data } = await api.post("/session/create", payload);
      const ret = data?.data ?? data;
      const sid = ret?.sessionId ?? ret?.id;
      if (!sid) throw new Error("Invalid start response (missing sessionId).");

      toast({ title: "Charging session started" });

      const initialSocFrac = (Number(currentSoc) || 0) / 100;
      const targetSocFrac = 1; // luôn FULL
      localStorage.setItem(
        `session_meta_${sid}`,
        JSON.stringify({ vehicleId, initialSoc: initialSocFrac, targetSoc: targetSocFrac, reservationId })
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
      const msg = e?.response?.data?.message || "Cannot start the session.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    }
  };

  const onPayNow = (r: ReservationItem) => {
    const amount =
      (typeof r.holdFee === "number" && !Number.isNaN(r.holdFee) ? r.holdFee : undefined) ?? 50000;
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

  /** Create one-time token & open QR dialog */
  const openQrFor = async (r: ReservationItem) => {
    if (USE_MOCK) {
      const token = "MOCK-" + r.reservationId;
      const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
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
      if (!url || url.includes("your-fe.com")) url = `${window.location.origin}/checkin?token=${token}`;
      const exp = String(payload?.expiresAt || "");
      if (!token || !url || !exp) throw new Error("Invalid token response.");

      setQrToken(token);
      setQrUrl(url);
      setQrExpiresAt(exp);
      setSecondsLeft(Math.max(0, Math.floor((new Date(exp).getTime() - Date.now()) / 1000)));
      setQrStation(`${r.stationName} • ${r.pillarCode}`);
      setLastResId(r.reservationId);
      setQrOpen(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not create check-in token.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    }
  };

  const markPlugged = async (r: ReservationItem) => {
    try {
      if (USE_MOCK) {
        setItems((xs) => xs.map((x) => (x.reservationId === r.reservationId ? { ...x, status: "PLUGGED" } : x)));
        toast({ title: "Plugged in", description: `${r.stationName} • ${r.pillarCode}` });
        return;
      }
      await api.post(`/book/${r.reservationId}`, {}, { withCredentials: true });
      setItems((xs) => xs.map((x) => (x.reservationId === r.reservationId ? { ...x, status: "PLUGGED" } : x)));
      toast({ title: "Plugged in" });
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.response?.data?.message || "Cannot mark plugged.",
        variant: "destructive",
      });
    }
  };

  // mở popup Start Charging để chọn payment
  const openPayment = async (r: ReservationItem) => {
    setPmResId(r.reservationId);

    // 1) Lấy KYC đồng bộ vào biến cục bộ
    let effectiveKyc = kycStatus;
    if (currentUserId) {
      try {
        const kycRes = await api.get(`/kyc/${currentUserId}`, { withCredentials: true });
        const payload = kycRes?.data ?? {};
        const kyc = payload?.data ?? payload?.result ?? payload;
        const raw = String(kyc?.status ?? "").toUpperCase().trim();
        effectiveKyc = raw === "APPROVED" ? "APPROVED" : raw === "REJECTED" ? "REJECTED" : "PENDING";
        setKycStatus(effectiveKyc);
      } catch {
        // giữ nguyên effectiveKyc 
      }
    }
    setKycAtOpen(effectiveKyc);

    // 2) Quyết định flow dựa trên biến cục bộ
    const initialFlow: "prepaid" | "postpaid" = effectiveKyc === "APPROVED" ? "postpaid" : "prepaid";
    setPayFlow(initialFlow);
    setPayChannel(initialFlow === "prepaid" ? "wallet" : "vnpay");

    let enriched = r;
    try {
      const { data } = await api.get(`/reservation/${r.reservationId}`, { withCredentials: true });
      const d = data?.data ?? data ?? {};
      enriched = {
        ...r,
        stationId: d.stationId ?? r.stationId,
        pillarId: d.pillarId ?? r.pillarId,
        connectorId: d.connectorId ?? r.connectorId,
        connectorType: d.connectorType ?? r.connectorType,
        pillarCode: d.pillarCode ?? r.pillarCode,
      };
      setItems(xs => xs.map(x => x.reservationId === r.reservationId ? { ...x, ...enriched } : x));
    } catch {
      // fetchEstimateFor sẽ tự bỏ qua nếu thiếu connectorId
    }

    if (currentUserId) {
      api
        .get(`/vehicle/${currentUserId}`, { withCredentials: true })
        .then((res) => {
          const raw = res?.data?.data ?? res?.data?.content ?? res?.data ?? [];
          const list: Vehicle[] = Array.isArray(raw) ? raw.map(mapApiVehicle) : [];
          setVehicles(list);
          if (list.length === 1) {
            setVehicleId(list[0].id);
            if (typeof list[0].socNow === "number") setCurrentSoc(list[0].socNow);
            fetchEstimateFor(enriched, list[0].id, list[0].socNow);
          }
        })
        .catch(() => setVehicles([]));
    }

    setEst(null);
    setPmOpen(true);
  };

  // estimate (target luôn 100%)
  async function fetchEstimateFor(r?: ReservationItem, vehId?: number, socNowOverride?: number) {
    if (!r || !vehId || !r.pillarId || !r.connectorId) {
      setEst(null);
      return;
    }
    setEstimating(true);
    try {
      const socToUse = typeof socNowOverride === "number" ? socNowOverride : currentSoc;
      const payload = {
        vehicleId: vehId,
        stationId: r.stationId,
        pillarId: r.pillarId,
        connectorId: r.connectorId,
        socNow: isFinite(socToUse) ? socToUse / 100 : undefined,
        socTarget: 1, // FULL
      };
      const { data } = await api.post("/estimate/estimate-kw", payload, { withCredentials: true });
      if (typeof data?.estimatedMinutes === "number") {
        setEst({
          energyKwh: data.energyKwh ?? 0,
          energyFromStationKwh: data.energyFromStationKwh ?? 0,
          estimatedCost: data.estimatedCost ?? 0,
          estimatedMinutes: data.estimatedMinutes ?? 0,
          advice: data.advice,
        });
      } else setEst(null);
    } catch {
      setEst(null);
    } finally {
      setEstimating(false);
    }
  }

  // helpers
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken || "");
      toast({ title: "Copied", description: "Token copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Cannot copy token.", variant: "destructive" });
    }
  };
  const regenerate = async () => {
    const r = items.find((x) => x.reservationId === lastResId);
    if (r) await openQrFor(r);
  };

  /** Row renderer */
  const renderReservation = (r: ReservationItem) => {
    const ready = r.status === "CONFIRMED";
    const scheduled = r.status === "SCHEDULED";
    const pending = r.status === "PENDING_PAYMENT";

    const bgClass = pending
      ? "bg-rose-50/60 border-rose-200"
      : r.status === "VERIFYING" || scheduled
      ? "bg-amber-50/60 border-amber-200"
      : r.status === "VERIFIED"
      ? "bg-teal-50/60 border-teal-200"
      : r.status === "PLUGGED"
      ? "bg-sky-50/60 border-sky-200"
      : r.status === "CHARGING"
      ? "bg-emerald-50/60 border-emerald-200"
      : r.status === "COMPLETED"
      ? "bg-zinc-50/60 border-zinc-200" // ⬅️ NEW color for completed
      : ready
      ? "bg-emerald-50/60 border-emerald-200"
      : "bg-emerald-50/60 border-emerald-200";

    const toneClass = pending
      ? "text-rose-700"
      : r.status === "VERIFYING" || scheduled
      ? "text-amber-700"
      : r.status === "VERIFIED"
      ? "text-teal-700"
      : r.status === "PLUGGED"
      ? "text-sky-700"
      : r.status === "CHARGING"
      ? "text-emerald-700"
      : r.status === "COMPLETED"
      ? "text-zinc-700"
      : ready
      ? "text-emerald-700"
      : "text-emerald-700";

    const iconBg =
      pending
        ? "bg-rose-500"
        : r.status === "VERIFYING" || scheduled
        ? "bg-amber-500"
        : r.status === "VERIFIED"
        ? "bg-teal-500"
        : r.status === "PLUGGED"
        ? "bg-sky-500"
        : r.status === "CHARGING"
        ? "bg-emerald-600"
        : r.status === "COMPLETED"
        ? "bg-zinc-500" 
        : "bg-emerald-500";

    return (
      <div
        key={r.reservationId}
        className={[
          "group relative overflow-hidden flex items-center justify-between rounded-2xl border",
          "p-4 sm:p-5 transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-[1px]",
          bgClass,
        ].join(" ")}
        style={{ minHeight: 92 }}
      >
        {/* left info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className={["size-12 rounded-2xl flex items-center justify-center shadow-inner text-white", iconBg].join(" ")}>
            {pending ? <CreditCard className="size-6" /> : <Calendar className="size-6" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate text-base">{r.stationName}</h4>
            <div className="flex flex-wrap gap-2 my-1">
              <Badge variant="outline" className="text-xs rounded-full border-dashed">{`Port ${r.pillarCode}`}</Badge>
              <Badge variant="outline" className="text-xs rounded-full border-dashed">{r.connectorType}</Badge>
            </div>
            <p className={["text-xs sm:text-[13px] font-medium", toneClass].join(" ")}>
              {fmtDateTime(r.startTime)}
              {ready && r.holdFee ? ` • Deposit ${fmtVnd(r.holdFee)}` : null}
              {pending ? " • Waiting for payment" : null}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="text-right flex flex-col gap-2 shrink-0">
          {/* READY */}
          {ready && (
            <>
              <Badge className="bg-emerald-600 text-white border-0 rounded-full">Ready</Badge>
              <Button
                size="sm"
                className="rounded-full px-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => openPayment(r)}
              >
                <Zap className="w-4 h-4 mr-1" /> Start Charging
              </Button>
            </>
          )}

          {/* SCHEDULED */}
          {scheduled && (
            <>
              <Badge className="rounded-full bg-amber-100 text-amber-700 border-amber-200">Scheduled</Badge>
              {isArrivableNow(r.startTime) ? (
                <Button
                  size="sm"
                  className="rounded-full px-4 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => openQrFor(r)}
                  title="Generate QR to check-in"
                >
                  <QrCode className="w-4 h-4 mr-1" /> Arrived
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full px-4 border-amber-200 text-amber-700" disabled>
                  <Clock className="w-4 h-4 mr-1" /> Not yet
                </Button>
              )}
            </>
          )}

          {/* VERIFYING → Verify  */}
          {r.status === "VERIFYING" && (
            <>
              <Badge className="rounded-full bg-amber-600 text-white border-0">Verifying</Badge>
              <Button
                size="sm"
                className="rounded-full px-4 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => openQrFor(r)}
                title="Generate QR to check-in"
              >
                <QrCode className="w-4 h-4 mr-1" /> Verify
              </Button>
            </>
          )}

          {/* VERIFIED → Plug */}
          {r.status === "VERIFIED" && (
            <>
              <Badge className="rounded-full bg-teal-600 text-white border-0">Verified</Badge>
              <Button size="sm" className="rounded-full px-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => markPlugged(r)}>
                Plug
              </Button>
            </>
          )}

          {/* PLUGGED → Start Charging (open payment) */}
          {r.status === "PLUGGED" && (
            <>
              <Badge className="rounded-full bg-sky-600 text-white border-0">Plugged</Badge>
              <Button
                size="sm"
                className="rounded-full px-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => openPayment(r)}
              >
                <Zap className="w-4 h-4 mr-1" /> Start Charging
              </Button>
            </>
          )}

          {/* CHARGING */}
          {r.status === "CHARGING" && (
            <Badge className="rounded-full bg-emerald-600 text-white border-0">Charging</Badge>
          )}

          {/* PENDING_PAYMENT */}
          {pending && (
            <>
              <Badge className="rounded-full bg-rose-500 text-white border-0 animate-pulse">Payment required</Badge>
              <Button size="sm" className="rounded-full px-4 bg-rose-500 hover:bg-rose-600" onClick={() => onPayNow(r)}>
                <CreditCard className="w-4 h-4 mr-1" /> Pay now
              </Button>
            </>
          )}

          {/* COMPLETED */}
          {r.status === "COMPLETED" && (
            <>
              <Badge className="rounded-full bg-zinc-600 text-white border-0">Completed</Badge>
              <Button
                size="sm"
                className="rounded-full px-4"
                onClick={() => gotoReview(r)}
              >
                Review
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Today’s Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Battery + Next booking */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-90">
                  <Battery className="w-5 h-5" />
                  <span className="text-sm font-medium">Current Battery Level</span>
                </div>
                <span className="text-xs/5 bg-white/15 px-2 py-1 rounded-full">Live</span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-extrabold drop-shadow">85%</span>
                <span className="text-sm opacity-90 mb-1">425 km</span>
              </div>

              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-white/30 overflow-hidden">
                  <div className="h-2 rounded-full bg-white" style={{ width: `85%` }} />
                </div>
                <p className="text-xs mt-2 opacity-90">Enough for a long trip</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Booking */}
          <Card className="rounded-2xl border-2 border-primary/15">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Next Booking</span>
              </div>

              {next?.startTime ? (
                <div className="mt-4 space-y-2">
                  <div className="text-2xl font-bold">
                    {new Date(next.startTime).toLocaleDateString()}
                    <span className="text-base text-muted-foreground ml-2">
                      {new Date(next.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {next.stationName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{next.stationName}</span>
                    </div>
                  )}

                  {next.pillarCode && (
                    <div className="mt-2 inline-flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">{`Port ${next.pillarCode}`}</Badge>
                      <Badge variant="secondary" className="rounded-full">{next.connectorType}</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">No upcoming booking</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Reservations list */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-2 border-primary/15">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg">My Reservations</span>
                  <Badge variant="outline" className="ml-2 border-primary/30 text-primary rounded-full">
                    Core
                  </Badge>
                </div>
                {!loading && <Badge variant="secondary" className="rounded-full">{activeCount} active</Badge>}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">You have no reservations yet.</div>
              ) : (
                <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1 nice-scroll">
                  {items.map(renderReservation)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Check-in QR
            </DialogTitle>
            <DialogDescription>
              Show this QR at the station to check in. Expires in{" "}
              <span className="font-semibold">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            {qrUrl ? (
              <a href={qrUrl} target="_blank" rel="noreferrer">
                <img
                  alt="Check-in QR"
                  className="rounded-lg border p-2 cursor-pointer"
                  width={240}
                  height={240}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`}
                  title="Open check-in page"
                />
              </a>
            ) : null}

            <div className="text-sm text-center text-muted-foreground">{qrStation}</div>

            <div className="w-full text-xs break-all rounded-lg bg-muted p-2">
              <div className="text-muted-foreground">Token</div>
              <div className="font-mono">{qrToken}</div>
            </div>

            <div className="flex w-full justify-between gap-2">
              <Button variant="outline" className="flex-1" onClick={copyToken}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
              <Button className="flex-1" onClick={regenerate}>
                <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Expires at: {qrExpiresAt ? new Date(qrExpiresAt).toLocaleString() : "—"}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog khi Start Charging */}
      <Dialog open={pmOpen} onOpenChange={setPmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Select Payment Method
            </DialogTitle>
            {/* ⬇️ dùng kycAtOpen thay vì kycStatus */}
            <DialogDescription>
              {kycAtOpen === "APPROVED"
                ? "Choose payment flow. Channel is auto-selected by flow."
                : "Your KYC is not approved. Only Prepaid is available."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Method (segmented) */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Method</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  //  chọn Prepaid sẽ tự set Wallet
                  variant={payFlow === "prepaid" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setPayFlow("prepaid");
                    setPayChannel("wallet");
                  }}
                >
                  Prepaid
                </Button>
                <Button
                  //  chọn Postpaid sẽ tự set VNPay — disable nếu KYC không APPROVED
                  variant={payFlow === "postpaid" ? "default" : "outline"}
                  className="rounded-xl disabled:opacity-60"
                  disabled={kycAtOpen !== "APPROVED"}
                  onClick={() => {
                    setPayFlow("postpaid");
                    setPayChannel("vnpay");
                  }}
                >
                  Postpaid
                </Button>
              </div>
            </div>

            {/* Payment channel – hiển thị duy nhất 1 lựa chọn tương ứng flow */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Payment</div>

              {payFlow === "prepaid" ? (
                <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-medium">Wallet</span>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> auto-selected for Prepaid
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">VNPay</span>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> auto-selected for Postpaid
                  </span>
                </div>
              )}
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Charging Vehicle</div>
              <select
                className="w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={vehicleId ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value) || null;
                  setVehicleId(v);
                  const picked = vehicles.find((x) => x.id === v);
                  const socPct = typeof picked?.socNow === "number" ? picked!.socNow! : currentSoc;
                  setCurrentSoc(socPct);
                  const r = items.find((x) => x.reservationId === pmResId!);
                  if (r) fetchEstimateFor(r, v!, socPct);
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

            {/* Current SOC (read-only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Current SOC</div>
                <div className="text-sm font-semibold">{currentSoc}%</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={currentSoc}
                disabled
                readOnly
                className="w-full opacity-70 cursor-not-allowed"
              />
            </div>

            {/* Target SOC – luôn 100%, read-only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">SOC Target</div>
                <div className="text-sm font-semibold">{TARGET_SOC_FIXED}%</div>
              </div>
              <input type="range" max={100} value={100} readOnly disabled className="w-full opacity-70 cursor-not-allowed" />
            </div>

            {/* Estimate */}
            <div className="rounded-xl border p-3 bg-muted/40">
              {!vehicleId || !pmResId ? (
                <div className="text-sm text-muted-foreground">Select vehicle to estimate.</div>
              ) : estimating ? (
                <div className="text-sm text-primary">Estimating…</div>
              ) : est ? (
                <div className="text-sm space-y-1">
                  <div>
                    Time ~ <b>{est.estimatedMinutes} minutes</b>
                  </div>                
                  {est.advice && <div className="text-xs text-amber-600">{est.advice}</div>}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Cannot estimate.</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!pmResId) return;
                  // dùng snapshot KYC tại thời điểm mở popup để kiểm tra Postpaid
                  if (payFlow === "postpaid" && kycAtOpen !== "APPROVED") {
                    toast({
                      title: "KYC required",
                      description: "Bạn cần KYC ở trạng thái APPROVED để dùng Trả sau.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setPmOpen(false);
                  onStartChargingAPI(pmResId);
                }}
                disabled={!vehicleId}
              >
                <Zap className="w-4 h-4 mr-1" /> Start
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusCards;
