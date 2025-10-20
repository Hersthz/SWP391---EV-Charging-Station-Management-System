import { useEffect, useMemo, useState } from "react";
import {
  Battery,
  Calendar,
  MapPin,
  Zap,
  Clock,
  CreditCard,
  Shield,
  CheckCircle2,
  Loader2,
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
type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

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

/** ===== Backend DTO ===== */
interface ReservationResponseBE {
  reservationId: number;
  stationId: number;
  stationName: string;
  pillarId: number;
  pillarCode?: string;
  connectorId: number;
  connectorType?: string;
  status: string; // PENDING | PAID | CANCELLED | EXPIRED | ...
  holdFee?: number;
  startTime: string;
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
  const s = (dbStatus || "").toUpperCase().trim();

  if (s === "CANCELLED") return "CANCELLED";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "SCHEDULED" || s === "RESERVED" || s === "BOOKED") return "SCHEDULED";
  if (s === "PENDING" || s === "PENDING_PAYMENT") return "PENDING_PAYMENT";

  if (s === "PAID" || s === "CONFIRMED") {
    const future = startTime ? new Date(startTime).getTime() > Date.now() : false;
    return future ? "SCHEDULED" : "CONFIRMED";
  }

  console.warn("Unknown backend status:", dbStatus);
  return "PENDING_PAYMENT";
}

/** Map BE -> FE item */
function mapBEToFE(rows: ReservationResponseBE[]): ReservationItem[] {
  return rows.map((d) => {
    const normalized = (d.status || "").toUpperCase().trim();
    const bePayment = (d as any).payment;

    return {
      reservationId: d.reservationId,
      stationId: d.stationId,
      stationName: d.stationName,
      pillarCode: d.pillarCode ?? `P${d.pillarId}`,
      connectorType: d.connectorType ?? `Connector ${d.connectorId}`,
      startTime: d.startTime,
      status: mapStatus(d.status, d.startTime),
      holdFee: d.holdFee ?? 0,
      payment: {
        paid:
          (typeof bePayment?.paid === "boolean" && bePayment.paid) ||
          normalized === "PAID" ||
          normalized === "PAID_CONFIRMED",
        depositTransactionId: bePayment?.depositTransactionId || undefined,
      },
    };
  });
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

/** ===== Local UI component: KYC button ===== */
function KycActionButton({
  status,
  onClick,
}: {
  status: KycStatus | undefined;
  onClick: () => void;
}) {
  if (status === "APPROVED") {
    return (
      <button
        className="
          inline-flex items-center gap-2 rounded-full
          bg-emerald-50 text-emerald-700 border border-emerald-200
          px-4 py-2 text-sm font-medium
          shadow-sm hover:bg-emerald-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
          transition-all
        "
        disabled
        title="KYC verified"
        aria-label="KYC verified"
      >
        <CheckCircle2 className="h-4 w-4" />
        Verified
      </button>
    );
  }

  if (status === "PENDING") {
    return (
      <button
        className="
          inline-flex items-center gap-2 rounded-full
          bg-amber-50 text-amber-700 border border-amber-200
          px-4 py-2 text-sm font-medium
          shadow-sm
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
          transition-all cursor-wait
        "
        disabled
        title="KYC is being reviewed"
        aria-label="KYC pending"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Reviewing…
      </button>
    );
  }

  // NONE / REJECTED / undefined
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-2 rounded-full
        bg-gradient-to-r from-blue-600 to-indigo-600
        text-white px-4 py-2 text-sm font-semibold
        shadow-md shadow-blue-200
        hover:shadow-lg hover:shadow-blue-300 hover:translate-y-[-1px]
        active:translate-y-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400
        transition-all
      "
      title="Verify your identity for this reservation"
      aria-label="Verify identity"
    >
      <Shield className="h-4 w-4" />
      Verify
    </button>
  );
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

  // Load reservations
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

        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          typeof me.data?.user_id === "number"
            ? me.data.user_id
            : typeof me.data?.id === "number"
              ? me.data.id
              : undefined;

        if (!userId) throw new Error("Cannot determine current user id.");

        const { data } = await api.get<ReservationResponseBE[]>(
          `/user/${userId}/reservations`,
          { withCredentials: true }
        );

        if (!mounted) return;

        const feItems = mapBEToFE(Array.isArray(data) ? data : []);
        setItems(feItems);
        setNext(pickNext(feItems));
      } catch (e: any) {
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

  const openKycFor = (reservationId: number) => {
    // điều hướng sang trang xác thực KYC của từng booking
    navigate(`/kyc?reservationId=${reservationId}`);
  };

  /** Row renderer */
  const renderReservation = (r: ReservationItem) => {
    const ready = r.status === "CONFIRMED";
    const scheduled = r.status === "SCHEDULED";
    const pending = r.status === "PENDING_PAYMENT";

    // vì chưa có endpoint KYC per-reservation => luôn coi như cần KYC
    const kyc: KycStatus | undefined = undefined;

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

              {/* KYC badge (mặc định Required khi chưa có endpoint) */}
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                KYC Required
              </Badge>
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
          {/* KYC action always on top */}
          <KycActionButton status={kyc} onClick={() => openKycFor(r.reservationId)} />

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
