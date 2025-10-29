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

// === Vehicle selection ===
type Vehicle = {
  id: number;
  name?: string;
  brand?: string;
  model?: string;
  socNow?: number; // %
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
  date?: string; // yyyy-MM-dd
  step?: number; // minutes
  minHM?: string | null; // clamp min HM (ví dụ End >= Start)
  maxHM?: string | null; // clamp max HM
  suggest?: string[]; // quick presets
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

  const todayMin = isToday(date) ? nowHM(step) : null;
  const effectiveMin = minHM ?? todayMin;

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
      M = minM;
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
    return H < Number(minH);
  };

  const minuteDisabled = (m: string, hPicked?: string) => {
    if (!effectiveMin) return false;
    const H = Number(hPicked ?? hCur ?? new Date().getHours());
    const M = Number(m);
    if (minH === undefined || minM === undefined) return false;
    if (H < minH) return true;
    if (H > minH) return false;
    return M < minM;
  };

  return (
    <div className="relative">
      {label && <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-lg text-left hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        {btnText}
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-[320px] rounded-xl border border-slate-200 bg-white shadow-xl p-3">
          <div className="mb-2 flex gap-2">
            {suggest.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pressPreset(s)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm text-slate-700"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              {hours.map((h) => {
                const disabled = hourDisabled(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(h, mCur ?? "00")}
                    className={[
                      "w-full px-3 py-2 text-left hover:bg-slate-100 text-slate-800",
                      h === hCur ? "bg-emerald-50 text-emerald-700 font-semibold" : "",
                      disabled ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              {minutes.map((m) => {
                const disabled = minuteDisabled(m);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(hCur ?? pad(new Date().getHours()), m)}
                    className={[
                      "w-full px-3 py-2 text-left hover:bg-slate-100 text-slate-800",
                      m === mCur ? "bg-emerald-50 text-emerald-700 font-semibold" : "",
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
              className="text-sm px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-600"
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

  // Timeslot (date, start, end)
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

  // ---  estimate types & state  ---
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

  // === NEW: Vehicle selection state & fetch ===
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    Number(localStorage.getItem("vehicle_id")) || null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingVehicles(true);
        const me = await api.get("/auth/me");
        const userId = me.data?.user_id ?? me.data?.id;
        if (!userId) throw new Error("No userId");

        const res = await api.get(`/vehicle/${userId}`);
        const list: Vehicle[] = res.data?.data ?? [];
        if (!cancelled) {
          setVehicles(list);
          // nếu chưa có chọn, tự set chiếc đầu tiên
          if (!selectedVehicleId && list[0]?.id) {
            setSelectedVehicleId(list[0].id);
            localStorage.setItem("vehicle_id", String(list[0].id));
          }
        }
      } catch {
        // bỏ qua lỗi, user vẫn có thể đặt (estimate sẽ không có vehicleId)
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
        // NOTE: ĐẶT CHỖ hiện tại BE không yêu cầu vehicleId -> không gửi.
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

  // --- helper lấy vehicle + SoC  ---
  async function resolveVehicleContext() {
    try {
      // Ưu tiên chiếc user vừa chọn (đã lưu localStorage)
      const vehicleId =
        selectedVehicleId ??
        Number(localStorage.getItem("vehicle_id"));

      // FE lưu %; nếu BE cần 0..1 thì sẽ chia 100 khi gửi payload
      const socNow = Number(localStorage.getItem("soc_now") ?? "50"); // %
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

      const vctx = await resolveVehicleContext(); // có thì gửi, không có thì bỏ
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
          payload.socNow = vctx.socNow / 100;
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
  }, [station?.id, selectedPillarId, selectedConnectorIdNum, selectedVehicleId]); // <- theo xe chọn

  // UI helpers
  const renderPaymentSwitch = () => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={paymentMethod === "wallet" ? "default" : "outline"}
        onClick={() => setPaymentMethod("wallet")}
        className="h-9 px-3 rounded-full border text-sm font-medium transition-colors bg-white data-[state=on]:bg-gradient-to-r from-emerald-500 to-cyan-600"
      >
        <Wallet className="w-4 h-4 mr-2" /> Ví
      </Button>
      <Button
        type="button"
        variant={paymentMethod === "card" ? "default" : "outline"}
        onClick={() => setPaymentMethod("card")}
        className="h-9 px-3 rounded-full border text-sm font-medium transition-colors"
      >
        <CreditCard className="w-4 h-4 mr-2" /> Thẻ
      </Button>
    </div>
  );

  /* =========================
     Steps
  ========================= */
  const renderSelectionStep = () => (
    <div className="space-y-8">
      <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
              <span className="font-semibold text-slate-900"> {station!.name} </span>
            </div>
            <Badge variant="outline" className="rounded-full border-emerald-200 text-emerald-700 bg-emerald-50">
              {station!.available ?? "Available"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div>
              <div className="text-sm text-slate-500">Distance</div>
              <div className="font-semibold text-slate-800">{station!.distance ?? "—"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Rate</div>
              <div className="font-semibold text-slate-800">{station!.price ?? "—"}</div>
            </div>
            <div className="flex items-center justify-center">
              {station!.live && (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
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
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <Car className="w-5 h-5 text-emerald-600" /> Select Vehicle
          </h3>
          {loadingVehicles && <span className="text-xs text-slate-500">Loading vehicles…</span>}
        </div>

        {!vehicles.length && !loadingVehicles ? (
          <div className="text-sm text-slate-500">
            Chưa có xe nào. Bạn có thể thêm trong Profile/Vehicle, hoặc tiếp tục đặt chỗ (ước tính sẽ dùng SoC mặc định).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map((v) => {
              const active = selectedVehicleId === v.id;
              return (
                <Card
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    localStorage.setItem("vehicle_id", String(v.id));
                    if (typeof v.socNow === "number") {
                      localStorage.setItem("soc_now", String(v.socNow));
                    }
                  }}
                  className={[
                    "cursor-pointer transition-all duration-200 rounded-xl overflow-hidden",
                    active
                      ? "border-2 border-emerald-500 bg-emerald-50 shadow-lg ring-4 ring-emerald-500/10"
                      : "border border-slate-200/70 bg-white hover:border-emerald-400 hover:shadow-md",
                  ].join(" ")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        {v.name || [v.brand, v.model].filter(Boolean).join(" ") || `Vehicle #${v.id}`}
                      </div>
                    </div>
                    {typeof v.socNow === "number" && (
                      <div className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
                        <Battery className="w-4 h-4 text-emerald-600" /> SoC ~{" "}
                        <b className="text-slate-700">{`${v.socNow}%`}</b>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {/* === END Vehicle selection === */}

      {/* Reservation Time */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <CalendarIcon className="w-5 h-5 text-sky-600" /> Reservation Time
          </h3>
          {renderPaymentSwitch()}
        </div>

        <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-700">Date</div>
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
                  className="w-full h-11 px-3 border border-slate-300 bg-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
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
                minHM={startTime || null}
              />
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Duration</span>
              </div>
              <Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-800 text-base font-semibold px-4 py-1">
                {durationMinutes > 0 ? `${durationMinutes} minutes` : "—"}
              </Badge>
            </div>

            {/* Estimated charge */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-slate-600">Estimated charge</div>
              <div className="text-sm">
                {!selectedPillarId || !selectedConnectorIdNum ? (
                  <span className="text-slate-400">Chọn trụ & đầu nối để ước tính</span>
                ) : estimating ? (
                  <span className="text-emerald-700">Estimating…</span>
                ) : estimate?.estimatedMinutes != null ? (
                  <span className="font-medium text-slate-900">{`~ ${estimate.estimatedMinutes} min`}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>

            {/* info: kWh + cost + advice */}
            {estimate && !estimating && (
              <div className="mt-1 text-xs text-slate-600 flex items-center gap-2">
                <span>
                  Energy ~ <b className="text-slate-800">{estimate.energyKwh.toFixed(1)} kWh</b>
                </span>
                <span>•</span>
                <span>
                  From station ~ <b className="text-slate-800">{estimate.energyFromStationKwh.toFixed(1)} kWh</b>
                </span>
                <span>•</span>
                <span>
                  Est. cost ~ <b className="text-emerald-700">{formatVND(estimate.estimatedCost)}</b>
                </span>
              </div>
            )}
            {estimate?.advice && (
              <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                {estimate.advice}
              </div>
            )}

            {/* cảnh báo nếu slot < estimate */}
            {estimate?.estimatedMinutes != null &&
              durationMinutes > 0 &&
              durationMinutes < estimate.estimatedMinutes && (
                <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  Estimated charge (~{estimate.estimatedMinutes} min) exceeds your slot ({durationMinutes} min).
                </div>
              )}

            <div className="mt-3 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                <span className="font-semibold">{formatVND(HOLD_RATE_PER_MIN)}</span>/minute ×{" "}
                <span className="font-semibold">{durationMinutes || 0} minutes</span>
              </div>
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {formatVND(estimatedHold || 0)}
              </div>
            </div>

            {durationMinutes <= 0 && bookingDate && startTime && endTime && (
              <div className="text-xs text-red-600 mt-1 font-medium">* Giờ kết thúc phải sau giờ bắt đầu.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PILLARS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Select Charging Pillar</h3>
          {loadingDetail && <span className="text-xs text-slate-500">Loading pillars…</span>}
        </div>

        {!pillarsUI.length && !loadingDetail && (
          <div className="text-sm text-red-600">Không có pillar khả dụng ở trạm này.</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  "cursor-pointer transition-all duration-200 rounded-xl overflow-hidden text-center",
                  active
                    ? "border-2 border-emerald-500 bg-emerald-50 shadow-lg ring-4 ring-emerald-500/10"
                    : !isAvailable
                    ? "border border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed"
                    : "border border-slate-200/70 bg-white hover:border-emerald-400 hover:shadow-md",
                ].join(" ")}
              >
                <CardContent className="p-5">
                  <div className="font-semibold text-lg text-slate-800">{p.name}</div>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-2 min-h-[22px]">
                    {p.connectorLabels.length ? (
                      p.connectorLabels.map((lbl) => (
                        <span
                          key={lbl}
                          className="px-2 py-0.5 rounded-full border border-slate-300 bg-white text-xs leading-5 text-slate-600"
                        >
                          {lbl}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  {p.power && <div className="text-xs font-medium text-emerald-700 mt-1">{p.power}</div>}
                  <Badge
                    variant="default"
                    className={[
                      "mt-3 text-xs rounded-full capitalize font-medium px-3 py-1 border",
                      isAvailable
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : p.status === "occupied"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-amber-100 text-amber-800 border-amber-200",
                    ].join(" ")}
                  >
                    {isAvailable ? "available" : p.status === "occupied" ? "occupied" : "maintenance"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CONNECTOR TYPE */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-slate-900">Select Connector</h3>
        {!selectedPillarCode ? (
          <div className="text-sm text-slate-500">Vui lòng chọn trụ sạc trước.</div>
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
                    "px-6 h-10 rounded-full text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md ring-2 ring-emerald-500/20 border-transparent"
                      : "bg-white border border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })}
            {selectedPillarCode && normalizedConnectors.length === 0 && (
              <div className="text-sm text-slate-500">Pillar này chưa có connector.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInsufficientBanner = () =>
    insufficient && (
      <Card className="border border-red-200 bg-red-50 rounded-xl">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-red-700 mb-1">Số dư ví không đủ</div>
            <div className="mb-1">
              Cần nạp thêm <b>{formatVND(insufficient.recommended_topup)}</b> để giữ chỗ.
            </div>
            <div>Phí giữ chỗ: <b>{formatVND(insufficient.holdFee)}</b></div>
            {insufficient.estimated_final_cost ? (
              <div className="text-slate-600">
                Ước tính chi phí phiên sạc: {formatVND(insufficient.estimated_final_cost)}
              </div>
            ) : null}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="h-9 bg-white border-red-300 text-red-700 hover:bg-red-100"
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
    // === vehicle selected for display ===
    const vehicleChosen = vehicles.find(v => v.id === selectedVehicleId);
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-emerald-500 to-cyan-600">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Summary</h2>
          <p className="text-slate-600">Kiểm tra thời gian, lựa chọn và thanh toán giữ chỗ</p>
        </div>

        {renderInsufficientBanner()}

        <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100">
                  <MapPin className="w-5 h-5 text-emerald-600 mr-3" />
                  <div>
                    <div className="text-sm text-slate-600">Station</div>
                    <div className="font-bold text-lg text-slate-900">{station!.name}</div>
                    <div className="text-xs text-slate-500">{station!.address}</div>
                  </div>
                </div>

                {/* Vehicle summary */}
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-emerald-100/40 to-emerald-50 border border-emerald-200/60">
                  <Car className="w-5 h-5 text-emerald-600 mr-3" />
                  <div>
                    <div className="text-sm text-slate-600">Vehicle</div>
                    <div className="font-bold text-lg text-slate-900">
                      {vehicleChosen
                        ? (vehicleChosen.name || [vehicleChosen.brand, vehicleChosen.model].filter(Boolean).join(" ") || `Vehicle #${vehicleChosen.id}`)
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-sky-50 to-sky-100/40 border border-sky-100">
                  <Clock className="w-5 h-5 text-sky-600 mr-3" />
                  <div>
                    <div className="text-sm text-slate-600">Timeslot</div>
                    <div className="font-bold text-lg text-slate-900">
                      {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-100">
                  <Zap className="w-5 h-5 text-amber-600 mr-3" />
                  <div>
                    <div className="text-sm text-slate-600">Pillar & Rate</div>
                    <div className="font-bold text-lg text-slate-900">
                      {selectedPillarCode} • {station!.price ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-cyan-50 border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-slate-800">Hold fee</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {formatVND(holdToShow)}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
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
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 bg-gradient-to-br from-emerald-500 to-cyan-600 animate-[fadeIn_0.4s_ease-out]">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Booking Confirmed!
          </h2>
          <div className="flex justify-center mb-4">
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 text-base font-semibold rounded-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              Hold created successfully
            </Badge>
          </div>
          {transactionId && (
            <p className="text-emerald-700 font-bold text-lg mb-6">
              Mã giao dịch: <span className="font-mono text-slate-900">{transactionId}</span>
            </p>
          )}
        </div>

        <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-xl">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-center text-slate-900">
              <QrCode className="w-6 h-6 mr-2 text-emerald-600" />
              Your Reservation Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-left">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">Station</div>
                  <div className="font-bold text-lg text-slate-900">{station!.name}</div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100/40 p-4 rounded-xl border border-amber-100">
                  <div className="text-sm text-slate-600 mb-1">Pillar</div>
                  <div className="font-bold text-lg text-amber-700">{selectedPillarCode}</div>
                </div>

                <div className="bg-gradient-to-r from-sky-50 to-sky-100/40 p-4 rounded-xl border border-sky-100">
                  <div className="text-sm text-slate-600 mb-1">Timeslot</div>
                  <div className="font-bold text-lg text-slate-900">
                    {bookingDate || "—"} • {startTime || "--:--"} → {endTime || "--:--"} ({durationMinutes}’)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/40 p-4 rounded-xl border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">Connector</div>
                  <div className="font-bold text-lg text-slate-900">{selectedConnectorLabel}</div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">Booking ID</div>
                  <div className="font-bold text-lg text-slate-900">{reservationId ?? "—"}</div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">Hold fee</div>
                  <div className="font-bold text-lg text-slate-900">{formatVND(holdToShow)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/map")}
                className="min-w-[200px] h-11 border-slate-300 hover:bg-slate-50 text-slate-700 rounded-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Quay về bản đồ
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="min-w-[200px] h-11 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/30"
              >
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
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full px-3 py-1.5 transition-colors"
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

      <div className="max-w-3xl mx-auto px-4 md:px-0 py-8 md:py-12">{renderStepContent()}</div>

      {currentStep !== "confirmed" && (
        <div className="sticky bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {currentStep === "summary" ? (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("selection")}
                  className="h-11 px-6 text-slate-600 hover:bg-slate-100 rounded-full"
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
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/30"
                >
                  Continue to Payment
                </Button>
              )}

              {currentStep === "summary" && (
                <Button
                  onClick={confirmAndCreateBooking}
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/30"
                  disabled={submitting || loadingDetail}
                >
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
