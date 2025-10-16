import { useEffect, useMemo, useState } from "react";
import {
  Battery,
  Calendar,
  MapPin,
  Zap,
  Clock,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";

/** Toggle to always use mock data for quick UI preview */
const USE_MOCK = false; 

/** ===== Types ===== */
type ReservationStatus =
  | "CONFIRMED"
  | "SCHEDULED"
  | "PENDING_PAYMENT"
  | "CANCELLED"
  | "EXPIRED";

interface ReservationItem {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarCode: string;      // e.g. "P4"
  connectorType: string;   // e.g. "DC Ultra 350kW"
  startTime: string;       // ISO
  status: ReservationStatus;
  holdFee?: number;        // deposit/hold fee
  payment?: {
    depositTransactionId?: string;
    paid: boolean;
  };
}

interface MyReservationsResponse {
  items: ReservationItem[];
  nextBooking?: Partial<ReservationItem>;
}

/** ===== Backend DTO (đang có ở BE) ===== */
interface ReservationResponseBE {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode?: string;          // khuyến khích BE thêm; nếu chưa có sẽ fallback từ pillarId
  connectorId: number;
  connectorType?: string;       // khuyến khích BE thêm; nếu chưa có sẽ fallback
  status: string;               // PENDING | PAID | CANCELLED | EXPIRED | ...
  holdFee?: number;
  startTime: string;            // ISO
  endTime?: string;
  createdAt?: string;
  expiredAt?: string;
}

/** ===== Mock data ===== */
const MOCK_RESERVATIONS: MyReservationsResponse = {
  items: [
    {
      reservationId: 10101,
      stationId: 3,
      stationName: "Downtown Station #3",
      pillarCode: "P4",
      connectorType: "DC Ultra 350kW",
      startTime: new Date().toISOString(),
      status: "CONFIRMED",
      holdFee: 50000,
      payment: { depositTransactionId: "DP-2024091101", paid: true },
    },
    {
      reservationId: 10102,
      stationId: 2,
      stationName: "Mall Station #2",
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

/** ===== Helpers ===== */
const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "";

const fmtVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

/** Map status DB -> FE */
function mapStatus(dbStatus: string, startTime?: string): ReservationStatus {
  const s = (dbStatus || "").toUpperCase();
  if (s === "CANCELLED") return "CANCELLED";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "PENDING") return "PENDING_PAYMENT";
  if (s === "PAID" || s === "CONFIRMED") {
    const future = startTime ? new Date(startTime).getTime() > Date.now() : false;
    return future ? "SCHEDULED" : "CONFIRMED";
  }
  return "PENDING_PAYMENT";
}

/** Map BE -> FE item */
function mapBEToFE(rows: ReservationResponseBE[]): ReservationItem[] {
  return rows.map((d) => ({
    reservationId: d.reservationId,
    stationId: d.stationId,
    stationName: d.stationName,
    pillarCode: d.pillarCode ?? `P${d.pillarId}`,
    connectorType: d.connectorType ?? `Connector ${d.connectorId}`,
    startTime: d.startTime,
    status: mapStatus(d.status, d.startTime),
    holdFee: d.holdFee ?? 0,
    payment: { paid: (d.status || "").toUpperCase() === "PAID" },
  }));
}

/** Lấy next booking gần nhất trong tương lai */
function pickNext(items: ReservationItem[]): Partial<ReservationItem> | undefined {
  const future = items
    .filter((i) => new Date(i.startTime).getTime() > Date.now())
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const n = future[0];
  if (!n) return undefined;
  return {
    stationName: n.stationName,
    pillarCode: n.pillarCode,
    connectorType: n.connectorType,
    startTime: n.startTime,
  };
}

/** ===== Component ===== */
const StatusCards = () => {
  const batteryPct = 85;
  const batteryRangeKm = 425;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [next, setNext] = useState<MyReservationsResponse["nextBooking"]>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (USE_MOCK) {
          if (!mounted) return;
          setItems(MOCK_RESERVATIONS.items);
          setNext(MOCK_RESERVATIONS.nextBooking);
          return;
        }

        // Lấy userId hiện tại
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          typeof me.data?.user_id === "number"
            ? me.data.user_id
            : typeof me.data?.id === "number"
            ? me.data.id
            : undefined;

        if (!userId) throw new Error("Cannot determine current user id.");

        // Gọi API backend có sẵn: GET /user/{userId}/reservations
        const { data } = await api.get<ReservationResponseBE[]>(
          `/user/${userId}/reservations`,
          { withCredentials: true }
        );

        if (!mounted) return;

        const feItems = mapBEToFE(Array.isArray(data) ? data : []);
        setItems(feItems);
        setNext(pickNext(feItems));
      } catch (e: any) {
        // Fallback to mocks nếu có lỗi
        setItems(MOCK_RESERVATIONS.items);
        setNext(MOCK_RESERVATIONS.nextBooking);
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

  const activeCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === "CONFIRMED" ||
          i.status === "SCHEDULED" ||
          i.status === "PENDING_PAYMENT"
      ).length,
    [items]
  );

  const onStartCharging = async (r: ReservationItem) => {
    try {
      if (USE_MOCK) {
        toast({
          title: "Charging session started ",
          description: `${r.stationName} • ${r.pillarCode}`,
        });
        navigate(`/booking?start=true&reservationId=${r.reservationId}&sessionId=MOCK-SESS-1`);
        return;
      }

      const { data } = await api.post(
        "/charging-sessions/start",
        { reservationId: r.reservationId },
        { withCredentials: true }
      );
      toast({
        title: "Charging session started",
        description: `${r.stationName} • ${r.pillarCode}`,
      });
      navigate(
        `/booking?start=true&reservationId=${r.reservationId}&sessionId=${data.sessionId}`
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Cannot start the session.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    }
  };

  const onPayNow = (r: ReservationItem) => {
    if (USE_MOCK) {
      toast({ title: "Redirecting (mock)", description: "Opening Wallet…" });
    }
    navigate("/wallet", { state: { reservationId: r.reservationId } });
  };

  /** Row renderer */
  const renderReservation = (r: ReservationItem) => {
    const ready = r.status === "CONFIRMED";
    const scheduled = r.status === "SCHEDULED";
    const pending = r.status === "PENDING_PAYMENT";

    return (
      <div
        key={r.reservationId}
        className={[
          "group relative overflow-hidden flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all",
          ready
            ? "bg-gradient-to-r from-emerald-50 via-emerald-25 to-transparent border-emerald-200 hover:border-emerald-300"
            : scheduled
            ? "bg-gradient-to-r from-amber-50 via-amber-25 to-transparent border-amber-200 hover:border-amber-300"
            : "bg-gradient-to-r from-rose-50 via-rose-25 to-transparent border-rose-200 hover:border-rose-300",
        ].join(" ")}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
          <div
            className={[
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow",
              ready ? "bg-emerald-500" : scheduled ? "bg-amber-500" : "bg-rose-500",
            ].join(" ")}
          >
            {pending ? (
              <CreditCard className="w-6 h-6 text-white" />
            ) : (
              <Calendar className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold">{r.stationName}</h4>
            <div className="flex flex-wrap gap-2 mb-1">
              <Badge variant="outline" className="text-xs">{`Port ${r.pillarCode}`}</Badge>
              <Badge variant="outline" className="text-xs">{r.connectorType}</Badge>
            </div>
            <p
              className={[
                "text-xs sm:text-sm font-medium",
                ready
                  ? "text-emerald-700"
                  : scheduled
                  ? "text-amber-700"
                  : "text-rose-700",
              ].join(" ")}
            >
              {fmtDateTime(r.startTime)}
              {ready && r.holdFee ? ` • Deposit ${fmtVnd(r.holdFee)}` : null}
              {pending ? " • Waiting for payment" : null}
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col gap-2">
          {ready && (
            <>
              <Badge className="bg-emerald-500 text-white border-0">Ready</Badge>
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={() => onStartCharging(r)}
              >
                <Zap className="w-4 h-4 mr-1" /> Start Charging
              </Button>
            </>
          )}

          {scheduled && (
            <>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                Scheduled
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-200 text-amber-700"
                disabled
              >
                <Clock className="w-4 h-4 mr-1" /> Not yet
              </Button>
            </>
          )}

          {pending && (
            <>
              <Badge className="bg-rose-500 text-white border-0 animate-pulse">
                Payment required
              </Badge>
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-600"
                onClick={() => onPayNow(r)}
              >
                <CreditCard className="w-4 h-4 mr-1" /> Pay now
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Today’s Overview</h2>

      {/* 2 small cards on left + wide reservations on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT SIDE */}
        <div className="space-y-4 lg:col-span-1">
          {/* Battery Status */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-green-700 flex items-center gap-2">
                <Battery className="w-5 h-5" />
                Current Battery Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-800">{batteryPct}%</span>
                <span className="text-sm text-green-600 mb-1">{batteryRangeKm} km</span>
              </div>
              <Progress value={batteryPct} className="h-2 bg-green-100" />
              <p className="text-sm text-green-600">Enough for a long trip</p>
            </CardContent>
          </Card>

          {/* Next Booking */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-purple-700 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-purple-800">
                  {next?.startTime
                    ? new Date(next.startTime).toLocaleDateString()
                    : "No upcoming booking"}
                </span>
                <span className="text-sm text-purple-600 mb-1">
                  {next?.startTime
                    ? new Date(next.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
              {next?.stationName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600">{next.stationName}</span>
                </div>
              )}
              {next?.pillarCode && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 border-purple-300"
                >
                  {`Port ${next.pillarCode} • ${next.connectorType}`}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: My Reservations */}
        <div className="lg:col-span-2">
          <Card className="shadow-card hover:shadow-electric transition-all duration-300 border-2 border-transparent hover:border-primary/20">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <CardTitle className="flex items-center text-lg justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-primary/10 mr-2">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span>My Reservations</span>
                  <Badge variant="outline" className="ml-2 border-primary/30 text-primary">
                    Core
                  </Badge>
                </div>
                {!loading && <Badge variant="secondary">{activeCount} active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  You have no reservations yet.
                </div>
              ) : (
                <div className="space-y-3">{items.map(renderReservation)}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
