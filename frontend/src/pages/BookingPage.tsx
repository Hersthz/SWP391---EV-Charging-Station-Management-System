// src/pages/BookingPage.tsx
import { useState } from "react";
import {
  ArrowLeft, Zap, Clock, Car, CheckCircle,
  MapPin, Battery, QrCode, Receipt
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import mockStations from "../../stations.json";

type BookingStep = 'selection' | 'summary';

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
  connectors?: string[];
  price?: string;
};

const BookingPage = () => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('selection');
  const [selectedChargingType, setSelectedChargingType] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("16:00");
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation() as { state?: { station?: Station } };
  const params = useParams();

  // ==== Lấy dữ liệu trạm từ state hoặc params ====
  let station: Station | undefined = location.state?.station;
  if (!station && params.id) {
    const idNum = Number(params.id);
    station = (mockStations as Station[]).find(s => s.id === idNum);
  }
  if (!station) {
    navigate("/map");
    return null;
  }

  const chargingTypes = [
    { id: "ac_standard", name: "AC Standard", power: "7-11 kW", duration: "6-8 hours", price: "$0.35/kWh", description: "Best for overnight charging", icon: <Car className="w-5 h-5" />, compatible: true },
    { id: "ac_fast", name: "AC Fast", power: "22 kW", duration: "2-3 hours", price: "$0.42/kWh", description: "Good for shopping & dining", icon: <Zap className="w-5 h-5" />, compatible: true },
    { id: "dc_fast", name: "DC Fast", power: "100-150 kW", duration: "30-45 min", price: "$0.55/kWh", description: "Quick top-up for trips", icon: <Battery className="w-5 h-5" />, compatible: true },
    { id: "dc_ultra_fast", name: "DC Ultra Fast", power: "250-350 kW", duration: "15-25 min", price: "$0.75/kWh", description: "Fastest charging available", icon: <Zap className="w-5 h-5" />, compatible: true }
  ];

  const timeSlots = [
    { time: "14:00", price: "$0.45/kWh", available: true },
    { time: "14:30", price: "$0.45/kWh", available: true },
    { time: "15:00", price: "$0.45/kWh", booked: true },
    { time: "15:30", price: "$0.48/kWh", available: true },
    { time: "16:00", price: "$0.48/kWh", available: true },
    { time: "16:30", price: "$0.52/kWh", available: true },
  ];

  const availablePorts = (station.connectors ?? ["Type2", "CCS"]).map((conn, idx) => ({
    id: `P${idx + 1}`,
    name: `Port ${idx + 1}`,
    status: idx === 0 ? "available" : "occupied",
    type: conn,
    power: station.power ?? ""
  }));

  const selectedType = chargingTypes.find(t => t.id === selectedChargingType);

  // ==== Step navigation (chỉ 2 bước) ====
  const goSummary = () => {
    if (!selectedChargingType || !selectedPort) {
      toast({
        title: "Vui lòng hoàn tất lựa chọn",
        description: !selectedChargingType ? "Bạn cần chọn loại sạc." : "Vui lòng chọn cổng sạc.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('summary');
  };

  const handleBack = () => {
    if (currentStep === 'summary') {
      setCurrentStep('selection');
    } else {
      navigate("/map");
    }
  };

  const confirmBooking = () => {
    // Tại đây bạn có thể gọi API tạo booking.
    toast({
      title: "Đặt chỗ thành công",
      description: `${station?.name} • ${selectedTimeSlot} • ${selectedPort}`,
    });
    navigate("/dashboard");
  };

  // ==== Render Steps ====
  const renderSelectionStep = () => (
    <div className="space-y-8">
      {/* Station summary (dùng dữ liệu thật) */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            <span className="font-semibold">{station!.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
              {station!.available ?? "Available"}
            </Badge>
            {station!.live && (
              <div className="flex items-center text-xs text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                Live
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-border bg-white p-3">
            <div className="text-muted-foreground">Distance</div>
            <div className="font-semibold">{station!.distance ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-3">
            <div className="text-muted-foreground">Type</div>
            <div className="font-semibold">{station!.power ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-3">
            <div className="text-muted-foreground">Rate</div>
            <div className="font-semibold">{station!.price ?? "$0.45/kWh"}</div>
          </div>
        </div>
      </div>

      {/* Select Charging Type */}
      <div>
        <h3 className="mb-3 font-semibold">Select Charging Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chargingTypes.map((type) => {
            const active = selectedChargingType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => type.compatible && setSelectedChargingType(type.id)}
                className={[
                  "text-left rounded-xl border bg-white p-4 transition-all",
                  "hover:shadow-sm focus:outline-none",
                  active ? "border-sky-400 ring-2 ring-sky-200" : "border-border"
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "mt-0.5 grid size-9 place-content-center rounded-lg",
                      active ? "bg-sky-100 text-sky-700" : "bg-sky-50 text-sky-600",
                    ].join(" ")}
                  >
                    {type.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{type.name}</div>
                      {active && <CheckCircle className="w-5 h-5 text-sky-500" />}
                    </div>

                    <div className="mt-1 text-emerald-600 font-semibold">
                      {type.price}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Power</div>
                        <div className="font-medium">{type.power}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">{type.duration}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground italic">
                      {type.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Time Slot */}
      <div>
        <h3 className="mb-3 font-semibold">Select Time Slot</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {timeSlots.map((slot) => {
            const active = selectedTimeSlot === slot.time;
            const disabled = Boolean(slot.booked);
            return (
              <button
                key={slot.time}
                disabled={disabled}
                onClick={() => !disabled && setSelectedTimeSlot(slot.time)}
                className={[
                  "w-full rounded-xl border p-4 text-center transition-all",
                  disabled
                    ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                    : "bg-white hover:shadow-sm",
                  active ? "border-sky-400 ring-2 ring-sky-200" : "border-border",
                ].join(" ")}
              >
                <div className="font-semibold">{slot.time}</div>
                <div className="text-xs text-muted-foreground">{slot.price}</div>
                {slot.booked && (
                  <div className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600 border border-rose-200">
                    Booked
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Charging Port */}
      <div>
        <h3 className="mb-3 font-semibold">Select Charging Port</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {availablePorts.map((port) => {
            const active = selectedPort === port.id;
            const isAvailable = port.status === "available";
            return (
              <button
                key={port.id}
                onClick={() => isAvailable && setSelectedPort(port.id)}
                disabled={!isAvailable}
                className={[
                  "text-left rounded-xl border p-4 transition-all bg-white",
                  active
                    ? "border-sky-400 ring-2 ring-sky-200"
                    : "border-border hover:shadow-sm",
                  !isAvailable && "opacity-60 cursor-not-allowed"
                ].join(" ")}
              >
                <div className="font-semibold">{port.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{port.type}</div>
                <div className="mt-1 text-[12px] font-medium underline underline-offset-2 text-sky-600">
                  {port.power || station!.power}
                </div>

                <div className="mt-2">
                  <span
                    className={[
                      "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : port.status === "occupied"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200",
                    ].join(" ")}
                  >
                    {isAvailable ? "Available" : port.status === "occupied" ? "Occupied" : "Maintenance"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional note */}
      <div>
        <h3 className="mb-3 font-semibold">Note (optional)</h3>
        <Textarea
          placeholder="E.g. Please hold the spot for 10 minutes after the time slot…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Peak hour note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Peak Hour Pricing</span>
        </div>
        <p className="mt-1 text-xs text-amber-700/80">
          4:00 PM - 6:00 PM rates are 15% higher due to high demand
        </p>
      </div>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Summary</h2>
        <p className="text-muted-foreground">Review your selection before confirming</p>
      </div>

      <Card className="shadow-sm border-2 border-primary/20">
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

              <div className="flex items-center p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-xl">
                <Zap className="w-5 h-5 text-emerald-600 mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Charging Type</div>
                  <div className="font-bold text-lg">{selectedType?.name}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-sky-500/10 to-sky-500/5 rounded-xl">
                <Clock className="w-5 h-5 text-sky-600 mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Time Slot</div>
                  <div className="font-bold text-lg">Today, {selectedTimeSlot}</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-xl">
                <Battery className="w-5 h-5 text-amber-600 mr-3" />
                <div>
                  <div className="text-sm text-muted-foreground">Port & Rate</div>
                  <div className="font-bold text-lg">
                    {selectedPort} • {station!.price ?? "$0.45/kWh"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {note && (
            <div className="mt-2 p-4 rounded-xl bg-muted/30 border">
              <div className="text-sm text-muted-foreground mb-1">Note</div>
              <div className="text-sm">{note}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ==== MAIN RENDER ====
  const renderStepContent = () => {
    return currentStep === "selection" ? renderSelectionStep() : renderSummaryStep();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">
              {currentStep === "summary" ? "Confirm Booking" : "Book Station"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {currentStep === 'summary' ? (
              <Button variant="outline" onClick={handleBack} className="h-11 px-6">
                Back
              </Button>
            ) : (
              <span />
            )}

            {currentStep === 'selection' && (
              <Button
                onClick={goSummary}
                disabled={!selectedChargingType || !selectedPort}
                className="h-11 px-6"
                variant="default"
              >
                Review & Confirm
              </Button>
            )}

            {currentStep === 'summary' && (
              <Button onClick={confirmBooking} className="h-11 px-6" variant="default">
                <QrCode className="w-5 h-5 mr-2" />
                Confirm Booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
