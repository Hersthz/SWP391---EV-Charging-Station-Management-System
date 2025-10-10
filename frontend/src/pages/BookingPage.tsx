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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import mockStations from "../../stations.json";
import api from "../api/axios";
import { v4 as uuid } from "uuid";

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

const HOLD_RATE_PER_MIN = 1500;

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>("selection");

  // selection UI state
  const [selectedPillarCode, setSelectedPillarCode] = useState<string>("");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(""); // for highlight
  const [selectedConnectorLabel, setSelectedConnectorLabel] = useState<string>("");

  // NEW: keep real IDs to submit
  const [selectedPillarId, setSelectedPillarId] = useState<number | string | null>(null);
  const [selectedConnectorIdNum, setSelectedConnectorIdNum] = useState<number | string | null>(null);

  const [etaMinutes, setEtaMinutes] = useState<number>(30);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet");

  // booking state
  const [submitting, setSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<Insufficient | null>(null);
  const [serverHoldFee, setServerHoldFee] = useState<number | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Location: giữ kiểu gốc, chỉ cast state khi cần
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

  const estimatedHold = useMemo(() => etaMinutes * HOLD_RATE_PER_MIN, [etaMinutes]);

  // ===== fetch station detail (pillars from backend) =====
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
            id: p.id ?? p.pillarId ?? p.code ?? `P${idx + 1}`,
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

  // ===== helpers =====
  function labelOf(c: any): string {
    const raw = c?.name ?? c?.type ?? c?.connectorType ?? String(c?.id ?? "");
    return raw.trim();
  }

  // ===== Pillars UI from backend =====
  type PillarUI = {
    code: string;
    name: string;
    pillarId: number | string;
    status: "available" | "occupied" | "maintenance";
    power?: string;
    connectorLabels: string[]; // all types on this pillar
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

  // ===== CONNECTORS: chỉ hiển thị của đúng Pillar đã chọn =====
  const normalizedConnectors = useMemo(() => {
    if (stationDetail?.pillars?.length && selectedPillarCode) {
      const pillar = stationDetail.pillars.find((p, i) =>
        (p.code ?? p.name ?? `P${i + 1}`).toString().toLowerCase() === selectedPillarCode.toLowerCase()
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

  // ===== flow =====
  const goSummary = () => {
    if (!selectedPillarId) {
      toast({ title: "Chưa chọn trụ sạc (Pillar).", variant: "destructive" });
      return;
    }
    if (!selectedConnectorIdNum) {
      toast({ title: "Chưa chọn đầu nối (Connector).", variant: "destructive" });
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
      const { data } = await api.get<MeResponse>("/auth/me");
      const id = typeof data?.id === "number" ? data.id : data?.user_id;
      if (typeof id !== "number") throw new Error("No userId");
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
    if (!selectedPillarId || !selectedConnectorIdNum) {
      goSummary();
      return;
    }
    if (!stationDetail || loadingDetail) {
      toast({
        title: "Thiếu dữ liệu trạm",
        description: "Chưa tải xong chi tiết trạm (pillar/connector IDs). Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setInsufficient(null);
    setServerHoldFee(null);

    try {
      const userId = await fetchCurrentUserId();

      const payload = {
        userId,
        stationId: station.id,
        pillarId: Number(selectedPillarId),
        connectorId: Number(selectedConnectorIdNum),
        arrivalEtaMinutes: etaMinutes,
      };

      const { data } = await api.post<BookingResponse>("/book/booking", payload);

      setServerHoldFee(Number(data.holdFee) || null);
      setReservationId(data.reservationId);
      setTransactionId(data.depositTransactionId ?? null);
      toast({
        title: "Đặt chỗ thành công",
        description: `Reservation #${data.reservationId} tại ${data.stationName ?? station.name}`,
      });
      setCurrentStep("confirmed");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 402 && err?.response?.data?.error === "insufficient_balance") {
        const d = err.response.data as Insufficient;
        setServerHoldFee(Number(d.holdFee) || null);
        setInsufficient(d);
        setCurrentStep("summary");
        toast({
          title: "Số dư ví không đủ",
          description: `Cần nạp thêm ${formatVND(d.recommended_topup)} để giữ chỗ.`,
          variant: "destructive",
        });
      } else {
        const msg =
          err?.code === "ERR_NETWORK"
            ? "Không kết nối được server. Kiểm tra backend (vd: http://localhost:8080)."
            : err?.response?.data?.message || "Không thể tạo booking. Thử lại sau.";
        toast({ title: "Đặt chỗ thất bại", description: msg, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== UI helpers =====
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

  // ===== step: selection =====
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

      {/* ETA + hold estimate */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">I will come within</h3>
          {renderPaymentSwitch()}
        </div>
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-info" />
                <span className="text-sm text-muted-foreground">Estimated timeframe</span>
              </div>
              <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">
                {etaMinutes} minutes
              </Badge>
            </div>

            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />

            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5’</span>
              <span>15’</span>
              <span>30’</span>
              <span>45’</span>
              <span>60’</span>
            </div>

            <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-xl flex items-center justify-between">
              <div className="text-sm">
                Cọc tạm tính: <span className="font-semibold">{formatVND(HOLD_RATE_PER_MIN)}</span>/minute ×{" "}
                <span className="font-semibold">{etaMinutes} minutes</span>
              </div>
              <div className="text-lg font-bold text-primary">{formatVND(estimatedHold)}</div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              *Số tiền chính xác sẽ do máy chủ xác nhận ở bước tiếp theo.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PILLARS (from backend) */}
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
                  setSelectedPillarId(p.pillarId); // LƯU ID THẬT

                  // reset connector khi đổi pillar
                  setSelectedConnectorId("");
                  setSelectedConnectorIdNum(null);
                  setSelectedConnectorLabel("");

                  // auto-chọn nếu pillar chỉ có 1 connector
                  if (p.defaultConnector && p.connectorLabels.length === 1) {
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

                  {/* Hiển thị TẤT CẢ connector types của pillar */}
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

      {/* CONNECTOR TYPE (only from the selected pillar) */}
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
                    setSelectedConnectorId(String(c.id));   // highlight
                    setSelectedConnectorIdNum(c.id);         // LƯU ID THẬT
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

  // ===== banners / summary / confirmed =====
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
            <div>
              Phí giữ chỗ: <b>{formatVND(insufficient.holdFee)}</b>
            </div>
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
              onClick={() =>
                toast({ title: "Chưa nối top-up API", description: "Gọi /wallet/topup ở đây." })
              }
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
          <p className="text-muted-foreground">Kiểm tra lựa chọn và thanh toán giữ chỗ</p>
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
                    <div className="text-sm text-muted-foreground">Arrival ETA</div>
                    <div className="font-bold text-lg">Trong {etaMinutes} phút</div>
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
                  <span className="text-3xl font-bold text-primary">
                    {formatVND(holdToShow)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Phương thức: <b>{paymentMethod === "wallet" ? "Ví" : "Thẻ"}</b>. Hệ thống sẽ khóa số tiền
                  tạm giữ tương ứng với ETA. Phần dư sẽ hoàn lại sau khi kết thúc phiên sạc.
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
                  <div className="text-sm text-muted-foreground mb-1">Arrival ETA</div>
                  <div className="font-bold text-lg">Trong {etaMinutes} phút</div>
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
              {currentStep === "selection" ? "Back to ETA" : "Back"}
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
                  disabled={!selectedPillarId || !selectedConnectorIdNum}
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
    </div>
  );
}
