// src/pages/BookingPage.tsx
import { useMemo, useState } from "react";
import {
  ArrowLeft, Zap, Clock, MapPin, Battery,
  QrCode, Receipt, CheckCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import mockStations from "../../stations.json";
import api from "../api/axios";

// ==== Types (GIỮ NGUYÊN LOGIC) ====
type BookingStep = 'selection' | 'summary' | 'confirmed';

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

// Map tên → id (fallback khi nhận mảng string)
const CONNECTOR_ID_MAP: Record<string, string> = {
  CCS: "ccs",
  CCS2: "ccs2",
  Type2: "type2",
  CHAdeMO: "chademo",
  AC: "ac",
};

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('selection');

  // selections (GIỮ NGUYÊN)
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>("");
  const [selectedConnectorLabel, setSelectedConnectorLabel] = useState<string>("");

  // NEW: ETA minutes (0..60) thay cho time slot
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const deposit = useMemo(() => etaMinutes * 1500, [etaMinutes]); // 1.500đ / phút

  // API state (GIỮ NGUYÊN)
  const [submitting, setSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation() as { state?: { station?: Station } };
  const params = useParams();

  // Lấy station từ state / params (GIỮ NGUYÊN)
  let station: Station | undefined = location.state?.station;
  if (!station && params.id) {
    const idNum = Number(params.id);
    station = (mockStations as Station[]).find(s => s.id === idNum);
  }
  if (!station) {
    navigate("/map");
    return null;
  }

  // Chuẩn hóa connectors → [{id,name}] (GIỮ NGUYÊN)
  const normalizedConnectors = useMemo(() => {
    const raw = station!.connectors ?? ["CCS2", "Type2", "CHAdeMO"];
    if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
      // @ts-ignore
      return (raw as Array<{ id: string | number; name: string }>).map(c => ({
        id: String(c.id),
        name: c.name,
      }));
    }
    return (raw as string[]).map((name) => ({
      id: CONNECTOR_ID_MAP[name] ?? name.toLowerCase(),
      name,
    }));
  }, [station]);

  // Ports demo: kèm connectorId để auto-sync (GIỮ NGUYÊN)
  const availablePorts = useMemo(() => {
    const c = normalizedConnectors;
    return [
      { id: "P1", name: "Port 1", status: "available", connectorId: c[0]?.id ?? "ccs2", nameOfConnector: c[0]?.name ?? "CCS2", power: "350 kW" },
      { id: "P2", name: "Port 2", status: "occupied", connectorId: c[0]?.id ?? "ccs2", nameOfConnector: c[0]?.name ?? "CCS2", power: "150 kW" },
      { id: "P3", name: "Port 3", status: "available", connectorId: c[1]?.id ?? "type2", nameOfConnector: c[1]?.name ?? "Type2", power: "22 kW" },
      { id: "P4", name: "Port 4", status: "available", connectorId: c[0]?.id ?? "ccs2", nameOfConnector: c[0]?.name ?? "CCS2", power: "350 kW" },
      { id: "P5", name: "Port 5", status: "maintenance", connectorId: c[1]?.id ?? "type2", nameOfConnector: c[1]?.name ?? "Type2", power: "11 kW" },
      { id: "P6", name: "Port 6", status: "available", connectorId: c[2]?.id ?? "chademo", nameOfConnector: c[2]?.name ?? "CHAdeMO", power: "100 kW" },
    ];
  }, [normalizedConnectors]);

  // ==== Điều hướng & validate (GIỮ NGUYÊN) ====
  const goSummary = () => {
    if (!selectedConnectorId || !selectedPort) {
      toast({
        title: "Vui lòng hoàn tất lựa chọn",
        description: !selectedConnectorId ? "Chọn loại đầu nối (Connector type)." : "Vui lòng chọn cổng sạc.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('summary');
  };

  const handleBack = () => {
    if (currentStep === 'summary') setCurrentStep('selection');
    else if (currentStep === 'confirmed') navigate("/map");
    else navigate("/map");
  };
  interface BookingResponse {
    id: number | string;
    bookingId?: number | string; // alternative key
    depositTransactionId?: string;
  }
  // ==== Gọi API tạo booking (LOGIC GIỮ, chỉ đổi trường thời gian & cọc) ====
  const confirmAndCreateBooking = async () => {
    if (!station) return;
    if (!selectedConnectorId || !selectedPort) {
      goSummary();
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        stationId: station.id,
        portId: selectedPort,
        connectorId: selectedConnectorId,
        arrivalEtaMinutes: etaMinutes,
        depositAmount: deposit,
      };
      const { data } = await api.post<BookingResponse>("/bookings", payload);
      setReservationId(data?.id ?? data?.bookingId ?? null);
      setTransactionId(data?.depositTransactionId ?? null);
      toast({ title: "Đặt cọc thành công", description: `Booking #${data?.id ?? "—"} tại ${station.name}` });
      setCurrentStep('confirmed');
    } catch (err: any) {
      const msg =
        err?.code === "ERR_NETWORK"
          ? "Không kết nối được server. Kiểm tra backend (vd: http://localhost:8080)."
          : err?.response?.data?.message || "Không thể tạo booking. Thử lại sau.";
      toast({ title: "Thanh toán đặt cọc thất bại", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // UI THEO MẪU (STYLE ONLY)
  // =========================
  const renderSelectionStep = () => (
    <div className="space-y-6">
      {/* Station Info */}
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

      {/* ETA Slider (thay Time Slots) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">I will come within</h3>
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
              min={0}
              max={60}
              step={5}
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />

            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0’</span><span>15’</span><span>30’</span><span>45’</span><span>60’</span>
            </div>

            <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-xl flex items-center justify-between">
              <div className="text-sm">
                Cọc: <span className="font-semibold">1.500₫/minute</span> × <span className="font-semibold">{etaMinutes} minutes</span>
              </div>
              <div className="text-lg font-bold text-primary">{formatVND(deposit)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Port Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Charging Port</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availablePorts.map((port) => {
            const active = selectedPort === port.id;
            const isAvailable = port.status === "available";
            return (
              <Card
                key={port.id}
                onClick={() => {
                  if (!isAvailable) return;
                  setSelectedPort(port.id);
                  if (!selectedConnectorId) {
                    setSelectedConnectorId(port.connectorId);
                    setSelectedConnectorLabel(port.nameOfConnector);
                  }
                }}
                className={[
                  "cursor-pointer transition-colors rounded-xl",
                  active
                    ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md"
                    : !isAvailable
                      ? "bg-muted/50 opacity-60 cursor-not-allowed"
                      : "hover:border-primary/40"
                ].join(" ")}
              >
                <CardContent className="p-3 text-center">
                  <div className="font-semibold">{port.name}</div>
                  <div className="text-xs text-muted-foreground">{port.nameOfConnector}</div>
                  <div className="text-xs font-medium text-primary">{port.power}</div>
                  <Badge
                    className={[
                      "mt-1 text-xs rounded-full",
                      isAvailable
                        ? "bg-success/10 text-success border-success/20"
                        : port.status === "occupied"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-warning/10 text-warning border-warning/20"
                    ].join(" ")}
                  >
                    {isAvailable ? "Available" : port.status === "occupied" ? "Occupied" : "Maintenance"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connector type bubbles */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Connector</h3>
        <div className="flex flex-wrap gap-3">
          {normalizedConnectors.map((c) => {
            const active = selectedConnectorId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedConnectorId(c.id); setSelectedConnectorLabel(c.name); }}
                className={[
                  "px-4 py-2 rounded-full text-sm transition-colors",
                  active
                    ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20"
                    : "border border-border bg-white"
                ].join(" ")}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Peak Hour box */}
      <Card className="border-info bg-info/5 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-info" />
            <span className="font-medium text-info">Peak Hour Pricing</span>
          </div>
          <p className="text-sm text-muted-foreground">
            4:00 PM - 6:00 PM rates are 15% higher due to high demand
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Summary</h2>
        <p className="text-muted-foreground">Review your selection and pay deposit to secure your slot</p>
      </div>

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
                  <div className="font-bold text-lg">In {etaMinutes} minutes</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl">
                <Zap className="w-5 h-5 text-warning mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Port & Rate</div>
                  <div className="font-bold text-lg">{selectedPort} • {station!.price ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-primary/20 pt-6">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Deposit Required</span>
                <span className="text-3xl font-bold text-primary">{formatVND(deposit)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 inline text-success" />
                Deposit is deducted from final charging cost
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfirmedStep = () => (
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
            Deposit Payment Successful
          </Badge>
        </div>
        <p className="text-success font-bold text-lg mb-6">
          💳 {formatVND(deposit)} đã thanh toán
          {transactionId ? <> • Mã GD: <span className="font-mono">{transactionId}</span></> : null}
        </p>
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
                <div className="text-sm text-muted-foreground mb-1">Port</div>
                <div className="font-bold text-lg text-warning">{selectedPort}</div>
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

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Rate</div>
                <div className="font-bold text-lg">{station!.price ?? "—"}</div>
              </div>

              <div className="bg-gradient-to-r from-muted/30 to-muted/20 p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Booking ID</div>
                <div className="font-bold text-lg">{reservationId ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-info/30 bg-gradient-to-br from-info/10 to-info/5 rounded-2xl">
              <CardContent className="p-6 text-left text-sm space-y-3">
                <div className="font-semibold text-info mb-2 flex items-center">
                  <QrCode className="w-4 h-4 mr-2" />
                  How to Start Charging
                </div>
                <div>1 Arrive within your ETA window</div>
                <div>2 Find your reserved port: <strong className="text-warning">{selectedPort}</strong></div>
                <div>3 Scan the QR code on the charging station</div>
                <div>4 Your session will start automatically</div>
              </CardContent>
            </Card>

            <Card className="border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl">
              <CardContent className="p-6 text-left text-sm space-y-3">
                <div className="font-semibold text-warning mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Important Notice
                </div>
                <div className="font-medium">10-minute grace period included</div>
                <div className="text-muted-foreground">
                  Your port will be held for 10 minutes past your ETA. After that, it may be released to other users.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 justify-center mt-6">
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

  // ==== MAIN RENDER (không đổi logic) ====
  const renderStepContent = () => {
    switch (currentStep) {
      case 'selection': return renderSelectionStep();
      case 'summary': return renderSummaryStep();
      case 'confirmed': return renderConfirmedStep();
      default: return renderSelectionStep();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header theo mẫu */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 'selection' ? 'Back to ETA' : 'Back'}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-primary">
                {currentStep === 'confirmed' ? 'Booking Confirmed' :
                  currentStep === 'summary' ? 'Book Station' : 'Book Station'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Action bar theo mẫu */}
      {currentStep !== 'confirmed' && (
        <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {currentStep === 'summary' ? (
                <Button variant="outline" onClick={() => setCurrentStep('selection')} className="h-11 px-6">
                  Back
                </Button>
              ) : <span />}

              {currentStep === 'selection' && (
                <Button
                  onClick={goSummary}
                  disabled={!selectedConnectorId || !selectedPort}
                  className="h-11 px-8"
                >
                  Continue to Deposit Payment
                </Button>
              )}

              {currentStep === 'summary' && (
                <Button
                  onClick={confirmAndCreateBooking}
                  className="h-11 px-8"
                  disabled={submitting}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  {submitting ? "Processing..." : "Pay Deposit & Get QR Code"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
