// src/pages/BookingPage.tsx
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Zap,
  Clock,
  MapPin,
  Battery,
  QrCode,
  Receipt,
  CheckCircle,
  Wallet,
  CreditCard,
  AlertTriangle,
  Calendar as CalendarIcon,
  Car,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import mockStations from "../../../stations.json";
import api from "../../api/axios";
import { ChatBot } from "./../ChatBot";

/* =========================
   Types
========================= */
type BookingStep = "selection" | "summary" | "confirmed";

type Station = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: string;
  updated?: string;
  status?: string;
  offline?: boolean;
  live?: boolean;
  power?: string;
  available?: string;
  connectors?: string[] | Array<{ id: string | number; name: string }>;
  price?: string;
};

type MeResponse = {
  id?: number;
  user_id?: number;
  username?: string;
  full_name?: string;
  email?: string;
};

type ConnectorDto = {
  id: number | string;
  type?: string;
  connectorType?: string;
  name?: string;
  status?: string; // ⬅️ thêm để nắm trạng thái connector
};
type PillarDto = {
  id: number | string;
  code?: string;
  name?: string;
  connectors?: ConnectorDto[];
};
type StationDetail = {
  id: number | string;
  name?: string;
  pillars?: PillarDto[];
  ports?: PillarDto[];
  chargerPillars?: PillarDto[];
};

type BookingResponse = {
  reservationId: number | string;
  stationId: number;
  stationName?: string;
  pillarId: number;
  connectorId: number;
  status: "HELD" | "PAID" | "PENDING" | "EXPIRED" | "CANCELLED";
  holdFee: number;
  depositTransactionId?: string;
  createdAt: string;
  expiresAt?: string;
};

type Insufficient = {
  error: "insufficient_balance";
  message?: string;
  holdFee: number;
  balance?: number;
  recommended_topup: number;
  estimated_final_cost?: number;
};

// === Vehicle selection ===
type Vehicle = {
  id: number;
  name?: string;
  brand?: string;
  model?: string;
  currentSoc?: number; // % (0..100)
};

const CONNECTOR_ID_MAP: Record<string, string> = {
  CCS: "ccs",
  CCS2: "ccs2",
  Type2: "type2",
  CHAdeMO: "chademo",
  AC: "ac",
};

const formatVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

function toNum(x: number | string | undefined): number | undefined {
  if (x === undefined || x === null) return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

const HOLD_RATE_PER_MIN = 300;

/* =========================
   Time helpers 
========================= */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addMinutes = (hm: string, m: number) => {
  const [H, M] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(H, M, 0, 0);
  d.setMinutes(d.getMinutes() + m);
  return toHM(d);
};
const roundToStep = (hm: string, step = 1) => {
  const [H, M] = hm.split(":").map(Number);
  const rounded = Math.round(M / step) * step;
  const h = (H + Math.floor(rounded / 60)) % 24;
  const m = rounded % 60;
  return `${pad(h)}:${pad(m)}`;
};
const nowHM = (step = 1) => {
  const d = new Date();
  return roundToStep(`${pad(d.getHours())}:${pad(d.getMinutes())}`, step);
};
const isToday = (yyyyMmDd?: string) => {
  if (!yyyyMmDd) return false;
  const today = new Date().toISOString().slice(0, 10);
  return yyyyMmDd === today;
};
const hmToMinutes = (hm: string) => {
  const [H, M] = hm.split(":").map(Number);
  return H * 60 + M;
};

/* =========================
   Core date functions
========================= */
function combineLocalDateTimeToDate(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}`);
  return isNaN(d.getTime()) ? null : d;
}
function toUtcISOString(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}
function toLocalDateTimeString(dateStr?: string, timeStr?: string): string | null {
  if (!dateStr || !timeStr) return null;
  const hhmmss = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${hhmmss}`;
}

/* =========================
   Page
========================= */
export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>("selection");

  // selection UI state
  const [selectedPillarCode, setSelectedPillarCode] = useState<string>("");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>("");
  const [selectedConnectorLabel, setSelectedConnectorLabel] = useState<string>("");

  // real IDs
  const [selectedPillarId, setSelectedPillarId] = useState<number | string | null>(null);
  const [selectedConnectorIdNum, setSelectedConnectorIdNum] = useState<number | string | null>(null);

  // Timeslot
  const [bookingDate, setBookingDate] = useState<string>(""); // yyyy-MM-dd
  const [startTime, setStartTime] = useState<string>(""); // HH:mm
  const [endTime, setEndTime] = useState<string>(""); // HH:mm

  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet");

  // booking state
  const [submitting, setSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [reservationId, setReservationId] = useState<string | number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<Insufficient | null>(null);
  const [serverHoldFee, setServerHoldFee] = useState<number | null>(null);

  // estimate
  type EstimateResp = {
    energyKwh: number;
    energyFromStationKwh: number;
    estimatedCost: number;
    estimatedMinutes: number;
    advice?: string;
  };
  type EstimateState = EstimateResp | null;

  const [estimate, setEstimate] = useState<EstimateState>(null);
  const [estimating, setEstimating] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Location/station
  const loc = useLocation();
  const stationFromState = (loc.state as { station?: Station } | undefined)?.station;
  let station: Station | undefined = stationFromState;
  const params = useParams();

  if (!station && params.id) {
    const idNum = Number(params.id);
    station = (mockStations as Station[]).find((s) => s.id === idNum);
  }
  if (!station) {
    navigate("/map");
    return null;
  }

  // Derived duration
  const startDateObj = useMemo(
    () => combineLocalDateTimeToDate(bookingDate, startTime),
    [bookingDate, startTime]
  );
  const endDateObj = useMemo(
    () => combineLocalDateTimeToDate(bookingDate, endTime),
    [bookingDate, endTime]
  );

  const durationMinutes = useMemo(() => {
    if (!startDateObj || !endDateObj) return 0;
    const diff = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
    return diff > 0 ? Math.round(diff) : 0;
  }, [startDateObj, endDateObj]);

  const estimatedHold = useMemo(
    () => (durationMinutes > 0 ? durationMinutes * HOLD_RATE_PER_MIN : 0),
    [durationMinutes]
  );

  // ===== fetch station detail =====
  const [stationDetail, setStationDetail] = useState<StationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDetail(true);
        const res = await api.get(`/charging-stations/${station!.id}`);
        const data = res.data;

        if (!data || !(data.pillars || data.ports || data.chargerPillars)) {
          throw new Error("Không lấy được danh sách pillars từ backend");
        }

        const pillars: PillarDto[] = data.pillars ?? data.ports ?? data.chargerPillars ?? [];
        const normalized: StationDetail = {
          id: data.id,
          name: data.name ?? data.stationName,
          pillars: (pillars || []).map((p: any, idx: number) => ({
            id: p.id ?? p.pillarId,
            code: p.code ?? p.name ?? `P${idx + 1}`,
            name: p.name ?? p.code ?? `P${idx + 1}`,
            connectors: (p.connectors ?? p.connectorDtos ?? p.sockets ?? []).map((c: any) => ({
              id: c.id ?? c.connectorId ?? c.type ?? c.connectorType ?? c.name,
              type: c.type ?? c.connectorType ?? c.name,
              name: c.name ?? c.type ?? c.connectorType ?? `C-${idx + 1}`,
              status: c.status ?? c.connectorStatus ?? c.state ?? "Available", // ⬅️ thêm status
            })),
          })),
        };

        if (!normalized.pillars?.length) throw new Error("Detail không có pillars");
        if (mounted) setStationDetail(normalized);
      } catch (e: any) {
        toast({
          title: "Không tải được chi tiết trạm",
          description: e?.response?.data?.message ?? e?.message ?? "Thiếu pillar/connector IDs.",
          variant: "destructive",
        });
        setStationDetail(null);
      } finally {
        if (mounted) setLoadingDetail(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station?.id]);

  // helpers
  function labelOf(c: any): string {
    const raw = c?.name ?? c?.type ?? c?.connectorType ?? String(c?.id ?? "");
    return raw.trim();
  }

  // === Vehicle selection state & fetch ===
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    Number(localStorage.getItem("vehicle_id")) || null
  );

  // helper: chuẩn hóa SOC về %
  const toPercentSoc = (v: any): number | undefined => {
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    if (n <= 0) return 0;
    return n <= 1 ? Math.round(n * 100) : Math.round(n); // 0..1 -> %; nếu đã %, giữ %
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingVehicles(true);
        const me = await api.get("/auth/me");
        const userId = me.data?.user_id ?? me.data?.id;
        if (!userId) throw new Error("No userId");

        const res = await api.get(`/vehicle/${userId}`);
        const rawList: any[] = res.data?.data ?? [];
        const mapped: Vehicle[] = Array.isArray(rawList)
          ? rawList.map((v) => ({
              id: Number(v.id ?? v.vehicleId),
              name: v.name,
              brand: v.brand,
              model: v.model,
              currentSoc: toPercentSoc(v.currentSoc ?? v.socNow ?? v.soc_now),
            }))
          : [];

        if (!cancelled) {
          setVehicles(mapped);
          if (!selectedVehicleId && mapped[0]?.id) {
            setSelectedVehicleId(mapped[0].id);
            localStorage.setItem("vehicle_id", String(mapped[0].id));
            if (typeof mapped[0].currentSoc === "number") {
              localStorage.setItem("soc_now", String(mapped[0].currentSoc)); // lưu % thống nhất
            }
          }
        }
      } catch {
        // bỏ qua lỗi
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pillars UI 
  type PillarUI = {
    code: string;
    name: string;
    pillarId: number | string;
    connectorChips: { id: string | number; name: string; status?: string }[];
    availableCount: number;
    totalCount: number;
    defaultConnector?: { id: string | number; name: string } | null;
  };

  const pillarsUI: PillarUI[] = useMemo(() => {
    if (!stationDetail?.pillars?.length) return [];
    return stationDetail.pillars.map((p, idx) => {
      const list = (p.connectors ?? []) as ConnectorDto[];

      const chips = list.map((c) => ({
        id: c.id!,
        name: String(c.name ?? c.type ?? c.id),
        status: (c.status || "").toString(),
      }));

      const availableCount = chips.filter((c) => c.status.toLowerCase() === "available").length;
      const totalCount = chips.length;

      // default: connector available đầu tiên (nếu có) hoặc connector đầu tiên
      const firstAvail = chips.find((c) => c.status.toLowerCase() === "available") || chips[0];

      return {
        code: String(p.code ?? `P${idx + 1}`),
        name: String(p.name ?? p.code ?? `P${idx + 1}`),
        pillarId: p.id!,
        connectorChips: chips,
        availableCount,
        totalCount,
        defaultConnector: firstAvail ? { id: firstAvail.id, name: firstAvail.name } : null,
      };
    });
  }, [stationDetail]);

  // Connectors cho pillar đã chọn 
  const normalizedConnectors = useMemo(() => {
    if (stationDetail?.pillars?.length && selectedPillarCode) {
      const pillar = stationDetail.pillars.find((p, i) =>
        (p.code ?? p.name ?? `P${i + 1}`).toString().toLowerCase() === selectedPillarCode.toLowerCase()
      );
      const list = (pillar?.connectors ?? []) as ConnectorDto[];

      const dedup = new Map<string, { id: string | number; name: string; status?: string }>();
      list.forEach((c) => {
        const label = labelOf(c);
        const key = label.toLowerCase();
        if (!dedup.has(key)) dedup.set(key, { id: c.id ?? key, name: label, status: c.status });
      });
      return Array.from(dedup.values());
    }
    return [];
  }, [stationDetail, selectedPillarCode]);

  // flow
  const goSummary = () => {
    if (!selectedPillarId) {
      toast({ title: "Chưa chọn trụ sạc (Pillar).", variant: "destructive" });
      return;
    }
    if (!selectedConnectorIdNum) {
      toast({ title: "Chưa chọn đầu nối (Connector).", variant: "destructive" });
      return;
    }
    if (!bookingDate || !startTime || !endTime) {
      toast({ title: "Thiếu thời gian đặt", description: "Vui lòng chọn ngày và khung giờ.", variant: "destructive" });
      return;
    }
    if (durationMinutes <= 0) {
      toast({ title: "Khung giờ không hợp lệ", description: "Giờ kết thúc phải sau giờ bắt đầu.", variant: "destructive" });
      return;
    }
    setInsufficient(null);
    setCurrentStep("summary");
  };

  const handleBack = () => {
    setInsufficient(null);
    if (currentStep === "summary") setCurrentStep("selection");
    else if (currentStep === "confirmed") navigate("/map");
    else navigate("/map");
  };

  async function fetchCurrentUserId(): Promise<number> {
    try {
      const { data } = await api.get<any>("/auth/me");
      const id =
        typeof data?.user_id === "number"
          ? data.user_id
          : typeof data?.id === "number"
          ? data.id
          : undefined;
      if (!id) throw new Error("No userId");
      localStorage.setItem("userId", String(id));
      return id;
    } catch (e: any) {
      if (e?.response?.status === 401) {
        toast({
          title: "Cần đăng nhập",
          description: "Vui lòng đăng nhập để tiếp tục đặt chỗ.",
          variant: "destructive",
        });
        navigate("/login", { state: { redirect: loc.pathname } });
      }
      throw e;
    }
  }

  const confirmAndCreateBooking = async () => {
    if (!station) return;

    if (!selectedPillarId) {
      toast({
        title: "Chưa chọn trụ sạc (Pillar)",
        description: "Vui lòng chọn trụ sạc trước khi thanh toán.",
        variant: "destructive",
      });
      setCurrentStep("selection");
      return;
    }
    if (!selectedConnectorIdNum) {
      toast({
        title: "Chưa chọn đầu nối (Connector)",
        description: "Vui lòng chọn đầu nối trước khi thanh toán.",
        variant: "destructive",
      });
      setCurrentStep("selection");
      return;
    }
    if (!bookingDate || !startTime || !endTime) {
      toast({
        title: "Thiếu thời gian đặt",
        description: "Vui lòng chọn ngày và khung giờ.",
        variant: "destructive",
      });
      return;
    }
    if (durationMinutes <= 0) {
      toast({
        title: "Khung giờ không hợp lệ",
        description: "Giờ kết thúc phải sau giờ bắt đầu.",
        variant: "destructive",
      });
      return;
    }

    if (!stationDetail || loadingDetail) {
      toast({
        title: "Thiếu dữ liệu trạm",
        description: "Dữ liệu trụ sạc chưa tải xong, vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setInsufficient(null);
    setServerHoldFee(null);

    try {
      const userId = await fetchCurrentUserId();

      const startStr = toLocalDateTimeString(bookingDate, startTime);
      const endStr = toLocalDateTimeString(bookingDate, endTime);

      if (!startStr || !endStr) {
        toast({ title: "Thiếu thời gian", description: "Ngày/giờ không hợp lệ.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const payload = {
        userId,
        stationId: station.id,
        pillarId: Number(selectedPillarId),
        connectorId: Number(selectedConnectorIdNum),
        startTime: startStr,
        endTime: endStr,
      };

      const { data } = await api.post("/book/booking", payload);
      setReservationId(data.reservationId);
      setServerHoldFee(Number(data.holdFee ?? 0));
      setTransactionId(data.depositTransaction ?? data.depositTransactionId ?? null);
      setCurrentStep("confirmed");
      toast({ title: "Đặt chỗ thành công", description: `Mã: ${data.reservationId}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Đặt chỗ thất bại!";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- helper lấy vehicle + SoC ---
  async function resolveVehicleContext() {
    try {
      const vehicleId =
        selectedVehicleId ?? Number(localStorage.getItem("vehicle_id"));

      // FE lưu %; khi gửi estimate sẽ chia 100
      const socNow = Number(localStorage.getItem("soc_now") ?? "50");
      const socTarget = Number(localStorage.getItem("soc_target") ?? "80");

      if (!vehicleId || Number.isNaN(socNow) || Number.isNaN(socTarget)) return null;
      return { vehicleId, socNow, socTarget };
    } catch {
      return null;
    }
  }

  // --- gọi estimate khi chọn Pillar + Connector ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedPillarId || !selectedConnectorIdNum || !station?.id) {
        setEstimate(null);
        return;
      }

      const vctx = await resolveVehicleContext();
      setEstimating(true);
      setEstimate(null);
      try {
        const payload: any = {
          vehicleId: vctx?.vehicleId,
          stationId: Number(station.id),
          pillarId: Number(selectedPillarId),
          connectorId: Number(selectedConnectorIdNum),
        };
        if (vctx && Number.isFinite(vctx.socNow) && Number.isFinite(vctx.socTarget)) {
          payload.socNow = vctx.socNow / 100;     // chuyển % -> 0..1
          payload.socTarget = vctx.socTarget / 100;
        }

        const { data } = await api.post("/estimate/estimate-kw", payload, { withCredentials: true });

        if (!cancelled && typeof data?.estimatedMinutes === "number") {
          setEstimate({
            energyKwh: data.energyKwh ?? 0,
            energyFromStationKwh: data.energyFromStationKwh ?? 0,
            estimatedCost: data.estimatedCost ?? 0,
            estimatedMinutes: data.estimatedMinutes ?? 0,
            advice: data.advice,
          });
        }
      } catch {
        if (!cancelled) setEstimate(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [station?.id, selectedPillarId, selectedConnectorIdNum, selectedVehicleId]);

  // === UI helpers ===
  const renderPaymentSwitch = () => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={paymentMethod === "wallet" ? "default" : "outline"}
        onClick={() => setPaymentMethod("wallet")}
        className={`h-9 px-3 rounded-full text-sm font-medium transition-all
          ${paymentMethod === "wallet"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md shadow-cyan-500/30"
            : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          }`}
      >
        <Wallet className="w-4 h-4 mr-2" /> Ví
      </Button>
      <Button
        type="button"
        variant={paymentMethod === "card" ? "default" : "outline"}
        onClick={() => setPaymentMethod("card")}
        className={`h-9 px-3 rounded-full text-sm font-medium transition-all
        ${paymentMethod === "card"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md shadow-cyan-500/30"
            : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          }`}
      >
        <CreditCard className="w-4 h-4 mr-2" /> Thẻ
      </Button>
    </div>
  );

  /* =========================
     Steps
  ========================= */

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: "easeInOut" },
  };

  const renderSelectionStep = () => (
    <motion.div
      key="selection"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={stepVariants.transition}
      className="space-y-10"
    >
      <Card className="rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-900/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
              <span className="font-semibold text-zinc-900"> {station!.name} </span>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-medium"
            >
              {station!.available ?? "Available"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div>
              <div className="text-sm text-zinc-500">Distance</div>
              <div className="font-semibold text-zinc-800">{station!.distance ?? "—"}</div>
            </div>
            <div className="flex items-center justify-center">
              {station!.live && (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5" />
                  <span className="text-sm font-medium text-emerald-700">Live</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Vehicle selection === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 tracking-tight">
            <Car className="w-5 h-5 text-emerald-600" /> Select Vehicle
          </h3>
          {loadingVehicles && <span className="text-xs text-zinc-500">Loading vehicles…</span>}
        </div>

        {!vehicles.length && !loadingVehicles ? (
          <div className="text-sm text-zinc-500">
            No vehicle yet. You can add one in Profile/Vehicle, or continue with the reservation (estimated to use default SoC).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map((v) => {
              const active = selectedVehicleId === v.id;
              return (
                <motion.div key={v.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
                  <Card
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      localStorage.setItem("vehicle_id", String(v.id));
                      if (typeof v.currentSoc === "number") {
                        localStorage.setItem("soc_now", String(v.currentSoc)); // lưu %
                      }
                    }}
                    className={[
                      "cursor-pointer transition-all duration-200 rounded-xl overflow-hidden",
                      active
                        ? "border-2 border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                        : "border border-zinc-200/70 bg-white hover:border-emerald-500 hover:shadow-lg hover:shadow-zinc-900/10",
                    ].join(" ")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-zinc-900">
                          {v.name || [v.brand, v.model].filter(Boolean).join(" ") || `Vehicle #${v.id}`}
                        </div>
                      </div>
                      {typeof v.currentSoc === "number" && (
                        <div className="mt-2 text-sm text-zinc-500 flex items-center gap-1.5">
                          <Battery className="w-4 h-4 text-emerald-600" /> SoC ~{" "}
                          <b className="text-zinc-700">{`${v.currentSoc}%`}</b>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {/* === END Vehicle selection === */}

      {/* Reservation Time */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 tracking-tight">
            <CalendarIcon className="w-5 h-5 text-sky-600" /> Reservation Time
          </h3>
        </div>

        <Card className="rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-900/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-700">Date</div>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().slice(0, 10)} // ⬅️ KHÓA QUÁ KHỨ
                  onChange={(e) => {
                    const val = e.target.value;
                    setBookingDate(val);
                    if (isToday(val) && startTime && hmToMinutes(startTime) < hmToMinutes(nowHM(1))) {
                      const nw = nowHM(1);
                      setStartTime(nw);
                      if (!endTime || hmToMinutes(endTime) <= hmToMinutes(nw)) {
                        setEndTime(addMinutes(nw, 30));
                      }
                    }
                  }}
                  className="w-full h-11 px-3 border border-zinc-300 bg-white rounded-lg focus-visible:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* START TIME: input time chuẩn */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-700">Start time</div>
                <input
                  type="time"
                  value={startTime}
                  step={60} // 1 phút
                  min={isToday(bookingDate) ? nowHM(1) : undefined}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartTime(v);
                    if (!endTime || hmToMinutes(endTime) <= hmToMinutes(v)) {
                      setEndTime(addMinutes(v, 15));
                    }
                  }}
                  className="w-full h-11 px-3 border border-zinc-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* END TIME: min = startTime */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-700">End time</div>
                <input
                  type="time"
                  value={endTime}
                  step={60}
                  min={startTime || undefined}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (startTime && hmToMinutes(v) <= hmToMinutes(startTime)) {
                      setEndTime(addMinutes(startTime, 15));
                    } else setEndTime(v);
                  }}
                  className="w-full h-11 px-3 border border-zinc-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Duration</span>
              </div>
              <Badge variant="secondary" className="rounded-full bg-sky-500/10 text-sky-700 text-base font-semibold px-4 py-1">
                {durationMinutes > 0 ? `${durationMinutes} minutes` : "—"}
              </Badge>
            </div>

            {/* Estimated charge */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-zinc-600">Estimated charge</div>
              <div className="text-sm">
                {!selectedPillarId || !selectedConnectorIdNum ? (
                  <span className="text-zinc-400">Select pillar & connector to estimate</span>
                ) : estimating ? (
                  <span className="text-emerald-700">Estimating…</span>
                ) : estimate?.estimatedMinutes != null ? (
                  <span className="font-medium text-zinc-900">{`~ ${estimate.estimatedMinutes} min`}</span>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </div>
            </div>

            {/* info: kWh + cost + advice */}
            {estimate && !estimating && (
              <div className="mt-1 text-xs text-zinc-600 flex items-center gap-2 flex-wrap">
                <span>
                  Energy ~ <b className="text-zinc-800">{estimate.energyKwh.toFixed(1)} kWh</b>
                </span>
                <span>•</span>
                <span>
                  Est. cost ~ <b className="text-emerald-700">{formatVND(estimate.estimatedCost)}</b>
                </span>
              </div>
            )}
            {estimate?.advice && (
              <div className="mt-2 text-sm text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {estimate.advice}
              </div>
            )}

            <div className="mt-3 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="text-sm text-zinc-700">
                <span className="font-semibold">{formatVND(HOLD_RATE_PER_MIN)}</span>/minute ×{" "}
                <span className="font-semibold">{durationMinutes || 0} minutes</span>
              </div>
              <div className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {formatVND(estimatedHold || 0)}
              </div>
            </div>

            {durationMinutes <= 0 && bookingDate && startTime && endTime && (
              <div className="text-xs text-red-600 mt-1 font-medium">* The end time must be after the start time.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PILLARS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Select Charging Pillar</h3>
          {loadingDetail && <span className="text-xs text-zinc-500">Loading pillars…</span>}
        </div>

        {!pillarsUI.length && !loadingDetail && (
          <div className="text-sm text-red-600">There are no pillars available at this station.</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pillarsUI.map((p) => {
            const active = selectedPillarCode === p.code;
            return (
              <motion.div
                key={String(p.pillarId)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => {
                    setSelectedPillarCode(p.code);
                    setSelectedPillarId(
                      typeof p.pillarId === "string" && /^\d+$/.test(p.pillarId)
                        ? Number(p.pillarId)
                        : p.pillarId
                    );
                    setSelectedConnectorId("");
                    setSelectedConnectorIdNum(null);
                    setSelectedConnectorLabel("");
                    if (p.defaultConnector) {
                      setSelectedConnectorId(String(p.defaultConnector.id));
                      setSelectedConnectorIdNum(p.defaultConnector.id);
                      setSelectedConnectorLabel(p.defaultConnector.name);
                    }
                  }}
                  className={[
                    "transition-all duration-200 rounded-xl overflow-hidden text-center cursor-pointer",
                    active
                      ? "border-2 border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                      : "border border-zinc-200/70 bg-white hover:border-emerald-500 hover:shadow-lg hover:shadow-zinc-900/10",
                  ].join(" ")}
                >
                  <CardContent className="p-5">
                    <div className="font-semibold text-lg text-zinc-800">{p.name}</div>

                    {/* chips connector theo status */}
                    <div className="flex flex-wrap gap-1.5 justify-center mt-2 min-h-[22px]">
                      {p.connectorChips.length ? (
                        p.connectorChips.map((c) => {
                          const st = (c.status || "").toLowerCase();
                          const cls =
                            st === "available"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : st === "occupied"
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : "border-slate-300 bg-slate-50 text-slate-600";
                          return (
                            <span key={String(c.id)} className={`px-2 py-0.5 rounded-full border text-xs leading-5 ${cls}`}>
                              {c.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </div>

                    {/* tóm tắt available theo connector */}
                    <Badge
                      variant="default"
                      className="mt-3 text-xs rounded-full font-medium px-3 py-1 border bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                    >
                      {p.availableCount}/{p.totalCount} available
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CONNECTOR TYPE */}
      <div>
        <h3 className="text-xl font-bold mb-3 text-zinc-900 tracking-tight">Select Connector</h3>
        {!selectedPillarCode ? (
          <div className="text-sm text-zinc-500">Select the charging station first.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {normalizedConnectors.map((c) => {
              const active = selectedConnectorId === String(c.id);
              const st = (c.status || "").toLowerCase();
              const disabled = st && st !== "available";

              const activeCls =
                "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-105";
              const normalCls =
                "bg-white border border-zinc-300 text-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-700";
              const disabledCls = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed";

              return (
                <motion.button
                  key={String(c.id)}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedConnectorId(String(c.id));
                    setSelectedConnectorIdNum(c.id);
                    setSelectedConnectorLabel(c.name);
                  }}
                  whileHover={disabled ? {} : { scale: 1.05 }}
                  whileTap={disabled ? {} : { scale: 0.95 }}
                  disabled={disabled}
                  className={[
                    "px-6 h-10 rounded-full text-sm font-medium transition-all duration-300 transform",
                    disabled ? disabledCls : active ? activeCls : normalCls,
                  ].join(" ")}
                  title={c.status ? `Status: ${c.status}` : undefined}
                >
                  {c.name}{c.status ? ` · ${c.status}` : ""}
                </motion.button>
              );
            })}
            {selectedPillarCode && normalizedConnectors.length === 0 && (
              <div className="text-sm text-zinc-500">This pillar does not have a connector.</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderInsufficientBanner = () =>
    insufficient && (
      <Card className="border border-red-500/30 bg-red-500/10 rounded-xl">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-red-700 mb-1">Insufficient wallet balance</div>
            <div className="mb-1 text-zinc-800">
              Need to top up <b>{formatVND(insufficient.recommended_topup)}</b> to reserve.
            </div>
            <div className="text-zinc-700">
              Phí giữ chỗ: <b>{formatVND(insufficient.holdFee)}</b>
            </div>
            {insufficient.estimated_final_cost ? (
              <div className="text-zinc-600">
                Estimated charging session cost: {formatVND(insufficient.estimated_final_cost)}
              </div>
            ) : null}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="h-9 bg-white border-red-300 text-red-700 hover:bg-red-50 transition-colors"
              onClick={() => toast({ title: "Chưa nối top-up API", description: "Gọi /wallet/topup ở đây." })}
            >
              Nạp {formatVND(insufficient.recommended_topup)}
            </Button>
          </div>
        </CardContent>
      </Card>
    );

  const renderSummaryStep = () => {
    const holdToShow = serverHoldFee ?? estimatedHold;
    const vehicleChosen = vehicles.find((v) => v.id === selectedVehicleId);
    return (
      <motion.div
        key="summary"
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={stepVariants.transition}
        className="space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-emerald-500 to-cyan-600"
          >
            <Receipt className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-zinc-900 mb-2 tracking-tight">Booking Summary</h2>
          <p className="text-zinc-600">Check times, select and pay for your reservation</p>
        </div>

        {renderInsufficientBanner()}

        <Card className="rounded-2xl border border-zinc-200/70 bg-white shadow-xl shadow-zinc-900/10">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200/60">
                  <MapPin className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-zinc-600">Station</div>
                    <div className="font-bold text-lg text-zinc-900">{station!.name}</div>
                    <div className="text-xs text-zinc-500">{station!.address}</div>
                  </div>
                </div>

                {/* Vehicle summary */}
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-emerald-100/40 to-emerald-50 border border-emerald-200/60">
                  <Car className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-zinc-600">Vehicle</div>
                    <div className="font-bold text-lg text-zinc-900">
                      {vehicleChosen
                        ? vehicleChosen.name ||
                          [vehicleChosen.brand, vehicleChosen.model].filter(Boolean).join(" ") ||
                          `Vehicle #${vehicleChosen.id}`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-sky-50 to-sky-100/40 border border-sky-200/60">
                  <Clock className="w-5 h-5 text-sky-600 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-zinc-600">Timeslot</div>
                    <div className="font-bold text-lg text-zinc-900">
                      {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200/60">
                  <Zap className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-zinc-600">Pillar</div>
                    <div className="font-bold text-lg text-zinc-900">{selectedPillarCode}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200/60 pt-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-cyan-50 border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-zinc-800">Hold fee</span>
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {formatVND(holdToShow)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderConfirmedStep = () => {
    const holdToShow = serverHoldFee ?? estimatedHold;
    return (
      <motion.div
        key="confirmed"
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={stepVariants.transition}
        className="space-y-8 text-center"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 bg-gradient-to-br from-emerald-500 to-cyan-600"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
        </div>

        <div>
          <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
            Booking Confirmed!
          </h2>
          <div className="flex justify-center mb-4">
            <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-4 py-2 text-base font-semibold rounded-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              Hold created successfully
            </Badge>
          </div>
          {transactionId && (
            <p className="text-emerald-700 font-bold text-lg mb-6">
              Transaction ID: <span className="font-mono text-zinc-900">{transactionId}</span>
            </p>
          )}
        </div>

        <Card className="rounded-2xl border border-zinc-200/70 bg-white shadow-xl shadow-zinc-900/10">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-center text-zinc-900">
              <QrCode className="w-6 h-6 mr-2 text-emerald-600" />
              Your Reservation Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-left">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-xl border border-emerald-200/60">
                  <div className="text-sm text-zinc-600 mb-1">Station</div>
                  <div className="font-bold text-lg text-zinc-900">{station!.name}</div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100/40 p-4 rounded-xl border border-amber-200/60">
                  <div className="text-sm text-zinc-600 mb-1">Pillar</div>
                  <div className="font-bold text-lg text-amber-700">{selectedPillarCode}</div>
                </div>

                <div className="bg-gradient-to-r from-sky-50 to-sky-100/40 p-4 rounded-xl border border-sky-200/60">
                  <div className="text-sm text-zinc-600 mb-1">Timeslot</div>
                  <div className="font-bold text-lg text-zinc-900">
                    {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/40 p-4 rounded-xl border border-emerald-200/60">
                  <div className="text-sm text-zinc-600 mb-1">Connector</div>
                  <div className="font-bold text-lg text-zinc-900">{selectedConnectorLabel}</div>
                </div>

                <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 p-4 rounded-xl border border-zinc-200">
                  <div className="text-sm text-zinc-600 mb-1">Booking ID</div>
                  <div className="font-bold text-lg text-zinc-900">{reservationId ?? "—"}</div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-xl border border-emerald-200/60">
                  <div className="text-sm text-zinc-600 mb-1">Hold fee</div>
                  <div className="font-bold text-lg text-zinc-900">{formatVND(holdToShow)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/map")}
                className="min-w-[200px] h-11 border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-full transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Back to Map
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="min-w-[200px] h-11 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white 
                  hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transform transition-all duration-300 shadow-lg shadow-cyan-500/30"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "selection":
        return renderSelectionStep();
      case "summary":
        return renderSummaryStep();
      case "confirmed":
        return renderConfirmedStep();
      default:
        return renderSelectionStep();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full px-3 py-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === "selection" ? "Back to Selection" : "Back"}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 shadow flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {currentStep === "confirmed" ? "Booking Confirmed" : "Book Station"}
              </span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-0 py-8 md:py-12">
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>

      {currentStep !== "confirmed" && (
        <div className="sticky bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {currentStep === "summary" ? (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("selection")}
                  className="h-11 px-6 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  Back
                </Button>
              ) : (
                <span />
              )}

              {currentStep === "selection" && (
                <Button
                  onClick={goSummary}
                  disabled={
                    !selectedPillarId ||
                    !selectedConnectorIdNum ||
                    !bookingDate ||
                    !startTime ||
                    !endTime ||
                    durationMinutes <= 0
                  }
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white 
                    hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transform transition-all duration-300 shadow-lg shadow-cyan-500/30
                    disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                >
                  Continue to Payment
                </Button>
              )}
  
              {currentStep === "summary" && (
                <Button
                  onClick={confirmAndCreateBooking}
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white 
                    hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transform transition-all duration-300 shadow-lg shadow-cyan-500/30
                    disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  disabled={submitting || loadingDetail}
                >
                  {submitting ? "Processing..." : "Confirm"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <ChatBot />
    </div>
  );
}
