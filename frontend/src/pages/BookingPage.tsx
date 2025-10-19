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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import mockStations from "../../stations.json";
import api from "../api/axios";
import { ChatBot } from "./ChatBot";

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
   Time helpers + TimePicker
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
const roundToStep = (hm: string, step = 5) => {
  const [H, M] = hm.split(":").map(Number);
  const rounded = Math.round(M / step) * step;
  const h = (H + Math.floor(rounded / 60)) % 24;
  const m = rounded % 60;
  return `${pad(h)}:${pad(m)}`;
};
const nowHM = (step = 5) => {
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

type TimePickerProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  date?: string;          // yyyy-MM-dd
  step?: number;          // minutes
  minHM?: string | null;  // clamp min HM (ví dụ End >= Start)
  maxHM?: string | null;  // clamp max HM
  suggest?: string[];     // quick presets
};

const TimePicker = ({
  label,
  value,
  onChange,
  date,
  step = 5,
  minHM = null,
  maxHM = null,
  suggest = ["Now", "+15", "+30", "+60"],
}: TimePickerProps) => {
  const [open, setOpen] = useState(false);

  // Min hiệu lực: ưu tiên minHM (ràng buộc logic), nếu không thì nếu là hôm nay -> chặn quá khứ
  const todayMin = isToday(date) ? nowHM(step) : null;
  const effectiveMin = minHM ?? todayMin;

  // Tách giờ/phút của min để áp rule cùng-giờ-thì-phút-≥-min
  const [minH, minM] = effectiveMin ? effectiveMin.split(":").map(Number) : [undefined, undefined];

  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: Math.floor(60 / step) }, (_, i) => pad(i * step));

  const clampByMinMax = (hm: string) => {
    let v = hm;
    if (effectiveMin && hmToMinutes(v) < hmToMinutes(effectiveMin)) v = effectiveMin;
    if (maxHM && hmToMinutes(v) > hmToMinutes(maxHM)) v = maxHM;
    return v;
  };

  const pick = (h: string, m: string) => {
    let H = Number(h);
    let M = Number(m);
    if (effectiveMin && minH !== undefined && minM !== undefined && H === minH && M < minM) {
      M = minM; // cùng giờ -> nâng phút lên min
    }
    let v = `${pad(H)}:${pad(M)}`;
    v = clampByMinMax(v);
    onChange(v);
    setOpen(false);
  };

  const pressPreset = (preset: string) => {
    let v = value || nowHM(step);
    if (preset === "Now") v = nowHM(step);
    if (preset.startsWith("+")) {
      const mins = Number(preset.slice(1));
      v = addMinutes(value || nowHM(step), mins);
      v = roundToStep(v, step);
    }
    v = clampByMinMax(v);
    onChange(v);
  };

  const [hCur, mCur] = (value || "").split(":");
  const btnText = value ? value : "--:--";

  const hourDisabled = (h: string) => {
    if (!effectiveMin) return false;
    const H = Number(h);
    return H < Number(minH); // giờ nhỏ hơn min -> disable, =min thì ok (phút sẽ được lọc ở list phút)
  };

  const minuteDisabled = (m: string, hPicked?: string) => {
    if (!effectiveMin) return false;
    const H = Number(hPicked ?? hCur ?? new Date().getHours());
    const M = Number(m);
    if (minH === undefined || minM === undefined) return false;
    if (H < minH) return true;
    if (H > minH) return false;
    return M < minM; // cùng giờ -> phút < minM thì disable
  };

  return (
    <div className="relative">
      {label && <div className="text-sm text-muted-foreground mb-1">{label}</div>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 px-3 border rounded-lg text-left hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {btnText}
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-[320px] rounded-xl border bg-white shadow-xl p-3">
          {/* Presets */}
          <div className="mb-2 flex gap-2">
            {suggest.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pressPreset(s)}
                className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 text-sm"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div className="max-h-48 overflow-auto rounded-lg border">
              {hours.map((h) => {
                const disabled = hourDisabled(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(h, mCur ?? "00")}
                    className={[
                      "w-full px-3 py-2 text-left hover:bg-slate-100",
                      h === hCur ? "bg-primary/10 font-semibold" : "",
                      disabled ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minutes */}
            <div className="max-h-48 overflow-auto rounded-lg border">
              {minutes.map((m) => {
                const disabled = minuteDisabled(m);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(hCur ?? pad(new Date().getHours()), m)}
                    className={[
                      "w-full px-3 py-2 text-left hover:bg-slate-100",
                      m === mCur ? "bg-primary/10 font-semibold" : "",
                      disabled ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const hhmmss = timeStr.length === 5 ? `${timeStr}:00` : timeStr; // đảm bảo có giây
  return `${dateStr}T${hhmmss}`; // KHÔNG có 'Z'
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

  // Timeslot (date, start, end)
  const [bookingDate, setBookingDate] = useState<string>(""); // yyyy-MM-dd
  const [startTime, setStartTime] = useState<string>("");     // HH:mm
  const [endTime, setEndTime] = useState<string>("");         // HH:mm

  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet");

  // booking state
  const [submitting, setSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [reservationId, setReservationId] = useState<string | number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<Insufficient | null>(null);
  const [serverHoldFee, setServerHoldFee] = useState<number | null>(null);

  // --- ADD: estimate state ---
  type EstimateState = { minutes: number; advice?: string } | null;
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

  // Pillars UI
  type PillarUI = {
    code: string;
    name: string;
    pillarId: number | string;
    status: "available" | "occupied" | "maintenance";
    power?: string;
    connectorLabels: string[];
    defaultConnector?: { id: string | number; name: string } | null;
  };

  const pillarsUI: PillarUI[] = useMemo(() => {
    if (!stationDetail?.pillars?.length) return [];
    return stationDetail.pillars.map((p, idx) => {
      const list = p.connectors ?? [];
      const labels = Array.from(new Set(list.map((c) => labelOf(c).toUpperCase())));
      const first = list[0];
      return {
        code: String(p.code ?? `P${idx + 1}`),
        name: String(p.name ?? p.code ?? `P${idx + 1}`),
        pillarId: p.id!,
        status: "available", // TODO: map real status when BE provides
        power: undefined,
        connectorLabels: labels,
        defaultConnector: first
          ? { id: first.id, name: String(first.name ?? first.type ?? first.id) }
          : null,
      };
    });
  }, [stationDetail]);

  // Connectors for selected pillar
  const normalizedConnectors = useMemo(() => {
    if (stationDetail?.pillars?.length && selectedPillarCode) {
      const pillar = stationDetail.pillars.find((p, i) =>
        (p.code ?? p.name ?? `P${i + 1}`).toString().toLowerCase() ===
        selectedPillarCode.toLowerCase()
      );
      const list = pillar?.connectors ?? [];
      const dedup = new Map<string, { id: string | number; name: string }>();
      list.forEach((c) => {
        const label = labelOf(c);
        const key = label.toLowerCase();
        if (!dedup.has(key)) dedup.set(key, { id: c.id ?? key, name: label });
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
      const id = typeof data?.user_id === "number"
        ? data.user_id
        : (typeof data?.id === "number" ? data.id : undefined);
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
      const endStr   = toLocalDateTimeString(bookingDate, endTime);

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
      const me = await api.get("/auth/me", { withCredentials: true });
      const vehicleId =
        me.data?.vehicleId ??
        Number(localStorage.getItem("vehicle_id"));

      // Nếu BE yêu cầu 0..1, chia 100 ở payload.
      const socNow = Number(localStorage.getItem("soc_now") ?? "50");     // %
      const socTarget = Number(localStorage.getItem("soc_target") ?? "80"); // %

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
      if (!vctx) {
        setEstimate(null);
        return;
      }

      setEstimating(true);
      setEstimate(null);
      try {
        const payload = {
          vehicleId: vctx.vehicleId,
          stationId: Number(station.id),
          pillarId: Number(selectedPillarId),
          connectorId: Number(selectedConnectorIdNum),
          socNow: vctx.socNow/100,
          socTarget: vctx.socTarget/100,
        };
        const { data } = await api.post("/estimate/estimate-kw", payload, { withCredentials: true });
        if (!cancelled && typeof data?.estimatedMinutes === "number") {
          setEstimate({ minutes: data.estimatedMinutes, advice: data.advice });
        }
      } catch {
        if (!cancelled) setEstimate(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [station?.id, selectedPillarId, selectedConnectorIdNum]);

  // UI helpers
  const renderPaymentSwitch = () => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={paymentMethod === "wallet" ? "default" : "outline"}
        onClick={() => setPaymentMethod("wallet")}
        className="h-9 px-3"
      >
        <Wallet className="w-4 h-4 mr-2" /> Ví
      </Button>
      <Button
        type="button"
        variant={paymentMethod === "card" ? "default" : "outline"}
        onClick={() => setPaymentMethod("card")}
        className="h-9 px-3"
      >
        <CreditCard className="w-4 h-4 mr-2" /> Thẻ
      </Button>
    </div>
  );

  /* =========================
     Steps
  ========================= */
  const renderSelectionStep = () => (
    <div className="space-y-6">
      <Card className="shadow-card rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              <span className="font-semibold"> {station!.name} </span>
            </div>
            <Badge className="bg-success/10 text-success border-success/20 rounded-full">
              {station!.available ?? "Available"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div>
              <div className="text-sm text-muted-foreground">Distance</div>
              <div className="font-semibold">{station!.distance ?? "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rate</div>
              <div className="font-semibold">{station!.price ?? "—"}</div>
            </div>
            <div className="flex items-center justify-center">
              {station!.live && (
                <>
                  <span className="w-2 h-2 bg-success rounded-full mr-1" />
                  <span className="text-sm font-medium text-success">Live</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Time (Date + Start + End with TimePicker) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Reservation Time
          </h3>
          {renderPaymentSwitch()}
        </div>

        <Card className="rounded-2xl border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Date</div>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBookingDate(val);
                    if (isToday(val) && startTime && hmToMinutes(startTime) < hmToMinutes(nowHM(5))) {
                      const nw = nowHM(5);
                      setStartTime(nw);
                      if (!endTime || hmToMinutes(endTime) <= hmToMinutes(nw)) {
                        setEndTime(addMinutes(nw, 30));
                      }
                    }
                  }}
                  className="w-full border rounded-lg h-10 px-3"
                />
              </div>

              <TimePicker
                label="Start time"
                value={startTime}
                onChange={(v) => {
                  setStartTime(v);
                  if (!endTime) setEndTime(addMinutes(v, 30));
                  else if (hmToMinutes(endTime) <= hmToMinutes(v)) setEndTime(addMinutes(v, 15));
                }}
                date={bookingDate}
                step={5}
                suggest={["Now", "+15", "+30", "+60"]}
              />

              <TimePicker
                label="End time"
                value={endTime}
                onChange={(v) => {
                  if (startTime && hmToMinutes(v) <= hmToMinutes(startTime)) {
                    setEndTime(addMinutes(startTime, 15));
                  } else setEndTime(v);
                }}
                date={bookingDate}
                step={5}
                minHM={startTime || null} // rule: End >= Start; nếu cùng giờ thì phút >= phút Start
              />
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-info" />
                <span>Duration</span>
              </div>
              <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">
                {durationMinutes > 0 ? `${durationMinutes} minutes` : "—"}
              </Badge>
            </div>

            {/* === ALWAYS SHOW Estimated charge line === */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Estimated charge</div>
              <div className="text-sm">
                {!selectedPillarId || !selectedConnectorIdNum ? (
                  <span className="text-slate-400">Chọn trụ & đầu nối để ước tính</span>
                ) : estimating ? (
                  <span className="text-primary">Estimating…</span>
                ) : estimate?.minutes != null ? (
                  <span className="font-medium">{`~ ${estimate.minutes} min`}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>

            {/* (optional) cảnh báo nếu thời lượng đặt < ước tính sạc */}
            {estimate?.minutes != null && durationMinutes > 0 && durationMinutes < estimate.minutes && (
              <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Estimated charge (~{estimate.minutes} min) exceeds your slot ({durationMinutes} min).
              </div>
            )}

            <div className="mt-3 bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-xl flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold">{formatVND(HOLD_RATE_PER_MIN)}</span>/minute ×{" "}
                <span className="font-semibold">{durationMinutes || 0} minutes</span>
              </div>
              <div className="text-lg font-bold text-primary">{formatVND(estimatedHold || 0)}</div>
            </div>

            {durationMinutes <= 0 && bookingDate && startTime && endTime && (
              <div className="text-xs text-destructive mt-1">* Giờ kết thúc phải sau giờ bắt đầu.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PILLARS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Select Charging Pillar</h3>
          {loadingDetail && <span className="text-xs text-muted-foreground">Loading pillars…</span>}
        </div>

        {!pillarsUI.length && !loadingDetail && (
          <div className="text-sm text-destructive">Không có pillar khả dụng ở trạm này.</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {pillarsUI.map((p) => {
            const active = selectedPillarCode === p.code;
            const isAvailable = p.status === "available";
            return (
              <Card
                key={String(p.pillarId)}
                onClick={() => {
                  if (!isAvailable) return;
                  setSelectedPillarCode(p.code);
                  setSelectedPillarId(
                    typeof p.pillarId === "string" && /^\d+$/.test(p.pillarId)
                      ? Number(p.pillarId)
                      : p.pillarId
                  );
                  setSelectedConnectorId("");
                  setSelectedConnectorIdNum(null);
                  setSelectedConnectorLabel("");
                  if (p.defaultConnector && p.connectorLabels?.length === 1) {
                    setSelectedConnectorId(String(p.defaultConnector.id));
                    setSelectedConnectorIdNum(p.defaultConnector.id);
                    setSelectedConnectorLabel(p.defaultConnector.name);
                  }
                }}
                className={[
                  "cursor-pointer transition-colors rounded-xl",
                  active
                    ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md"
                    : !isAvailable
                    ? "bg-muted/50 opacity-60 cursor-not-allowed"
                    : "hover:border-primary/40",
                ].join(" ")}
              >
                <CardContent className="p-3 text-center">
                  <div className="font-semibold">{p.name}</div>
                  <div className="flex flex-wrap gap-1 justify-center mt-1 min-h-[22px]">
                    {p.connectorLabels.length ? (
                      p.connectorLabels.map((lbl) => (
                        <span key={lbl} className="px-2 py-0.5 rounded-full border text-xs leading-5">
                          {lbl}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  {p.power && <div className="text-xs font-medium text-primary mt-1">{p.power}</div>}
                  <Badge
                    className={[
                      "mt-2 text-xs rounded-full",
                      isAvailable
                        ? "bg-success/10 text-success border-success/20"
                        : p.status === "occupied"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-warning/10 text-warning border-warning/20",
                    ].join(" ")}
                  >
                    {isAvailable ? "Available" : p.status === "occupied" ? "Occupied" : "Maintenance"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CONNECTOR TYPE */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Connector</h3>
        {!selectedPillarCode ? (
          <div className="text-sm text-muted-foreground">Vui lòng chọn trụ sạc trước.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {normalizedConnectors.map((c) => {
              const active = selectedConnectorId === String(c.id);
              return (
                <button
                  key={String(c.id)}
                  onClick={() => {
                    setSelectedConnectorId(String(c.id));
                    setSelectedConnectorIdNum(c.id);
                    setSelectedConnectorLabel(c.name);
                  }}
                  className={[
                    "px-4 py-2 rounded-full text-sm transition-colors",
                    active
                      ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20"
                      : "border border-border bg-white",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })}
            {selectedPillarCode && normalizedConnectors.length === 0 && (
              <div className="text-sm text-muted-foreground">Pillar này chưa có connector.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInsufficientBanner = () =>
    insufficient && (
      <Card className="border-destructive/30 bg-destructive/10 rounded-xl">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-destructive mb-1">Số dư ví không đủ</div>
            <div className="mb-1">
              Cần nạp thêm <b>{formatVND(insufficient.recommended_topup)}</b> để giữ chỗ.
            </div>
            <div>Phí giữ chỗ: <b>{formatVND(insufficient.holdFee)}</b></div>
            {insufficient.estimated_final_cost ? (
              <div className="text-muted-foreground">
                Ước tính chi phí phiên sạc: {formatVND(insufficient.estimated_final_cost)}
              </div>
            ) : null}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="h-9"
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
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Summary</h2>
          <p className="text-muted-foreground">Kiểm tra thời gian, lựa chọn và thanh toán giữ chỗ</p>
        </div>

        {renderInsufficientBanner()}

        <Card className="shadow-electric border-2 border-primary/20 rounded-2xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <div className="text-sm text-muted-foreground">Station</div>
                    <div className="font-bold text-lg">{station!.name}</div>
                    <div className="text-xs text-muted-foreground">{station!.address}</div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-xl">
                  <Battery className="w-5 h-5 text-success mr-3" />
                  <div>
                    <div className="text-sm text-muted-foreground">Connector</div>
                    <div className="font-bold text-lg">{selectedConnectorLabel}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-info/10 to-info/5 rounded-xl">
                  <Clock className="w-5 h-5 text-info mr-3" />
                  <div>
                    <div className="text-sm text-muted-foreground">Timeslot</div>
                    <div className="font-bold text-lg">
                      {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl">
                  <Zap className="w-5 h-5 text-warning mr-3" />
                  <div>
                    <div className="text-sm text-muted-foreground">Pillar & Rate</div>
                    <div className="font-bold text-lg">
                      {selectedPillarCode} • {station!.price ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-primary/20 pt-6">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Hold fee</span>
                  <span className="text-3xl font-bold text-primary">{formatVND(holdToShow)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Phương thức: <b>{paymentMethod === "wallet" ? "Ví" : "Thẻ"}</b>. Hệ thống sẽ khóa số tiền
                  tạm giữ tương ứng với thời lượng đặt chỗ. Phần dư sẽ hoàn lại sau khi kết thúc phiên sạc.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConfirmedStep = () => {
    const holdToShow = serverHoldFee ?? estimatedHold;
    return (
      <div className="space-y-8 text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto shadow-glow animate-scale-in">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
            Booking Confirmed!
          </h2>
          <div className="flex justify-center mb-4">
            <Badge className="bg-success/10 text-success border-success/30 px-4 py-2 text-base font-semibold rounded-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              Hold created successfully
            </Badge>
          </div>
          {transactionId && (
            <p className="text-success font-bold text-lg mb-6">
              Mã giao dịch: <span className="font-mono">{transactionId}</span>
            </p>
          )}
        </div>

        <Card className="shadow-electric border-2 border-success/20 rounded-2xl">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-center">
              <QrCode className="w-6 h-6 mr-2 text-primary" />
              Your Reservation Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Station</div>
                  <div className="font-bold text-lg">{station!.name}</div>
                </div>

                <div className="bg-gradient-to-r from-warning/10 to-warning/5 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Pillar</div>
                  <div className="font-bold text-lg text-warning">{selectedPillarCode}</div>
                </div>

                <div className="bg-gradient-to-r from-info/10 to-info/5 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Timeslot</div>
                  <div className="font-bold text-lg">
                    {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-success/10 to-success/5 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Connector</div>
                  <div className="font-bold text-lg">{selectedConnectorLabel}</div>
                </div>

                <div className="bg-gradient-to-r from-muted/30 to-muted/20 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Booking ID</div>
                  <div className="font-bold text-lg">{reservationId ?? "—"}</div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Hold fee</div>
                  <div className="font-bold text-lg">{formatVND(holdToShow)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-2">
              <Button variant="outline" onClick={() => navigate("/map")} className="min-w-[200px] h-11">
                <MapPin className="w-4 h-4 mr-2" />
                Quay về bản đồ
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="min-w-[200px] h-11">
                Xem Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === "selection" ? "Back to Selection" : "Back"}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-primary">
                {currentStep === "confirmed" ? "Booking Confirmed" : "Book Station"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">{renderStepContent()}</div>

      {currentStep !== "confirmed" && (
        <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {currentStep === "summary" ? (
                <Button variant="outline" onClick={() => setCurrentStep("selection")} className="h-11 px-6">
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
                  className="h-11 px-8"
                >
                  Continue to Payment
                </Button>
              )}

              {currentStep === "summary" && (
                <Button onClick={confirmAndCreateBooking} className="h-11 px-8" disabled={submitting || loadingDetail}>
                  <QrCode className="w-5 h-5 mr-2" />
                  {submitting ? "Processing..." : "Pay & Hold Reservation"}
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
