import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, QrCode, CheckCircle2, XCircle, MapPin, PlugZap, Calendar, Car } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

type ViewState = "idle" | "loading" | "ok" | "fail";

type UserLite = { id?: number; name?: string; email?: string; phone?: string };
type VehicleLite = { id: number; name?: string; brand?: string; model?: string; currentSoc?: number };
type ResLite = {
  reservationId?: number;
  stationId?: number;
  stationName?: string;
  pillarId?: number;
  pillarCode?: string;
  connectorId?: number;
  connectorType?: string;
  startTime?: string;
  newStatus?: string;
};

export default function Checkin() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<ViewState>("idle");
  const [message, setMessage] = useState("Verifying…");

  const [user, setUser] = useState<UserLite | null>(null);
  const [vehicle, setVehicle] = useState<VehicleLite | null>(null);
  const [resv, setResv] = useState<ResLite | null>(null);

  useEffect(() => {
    const run = async () => {
      setState("loading");
      setMessage("Verifying…");

      try {
        if (!token) throw new Error("Missing token");

        // 1) Lấy user (nếu có)
        let userId: number | undefined;
        try {
          const me = await api.get("/auth/me", { withCredentials: true });
          userId =
            typeof me.data?.user_id === "number"
              ? me.data.user_id
              : typeof me.data?.id === "number"
              ? me.data.id
              : undefined;

          const u: UserLite = {
            id: userId,
            name: me.data?.name ?? me.data?.fullName ?? me.data?.username,
            email: me.data?.email,
            phone: me.data?.phone,
          };
          setUser(u);
        } catch {
          // Anonymous check-in vẫn cho verify
        }

        // 2) Verify token
        const body = userId ? { token, userId } : { token };
        const verify = await api.post("/api/token/verify", body, { withCredentials: true });
        const payload = verify?.data?.data ?? verify?.data ?? {};
        const reservationId = Number(payload?.reservationId ?? payload?.reservation_id);
        const stationId = Number(payload?.stationId ?? payload?.station_id);
        const pillarId = Number(payload?.pillarId ?? payload?.pillar_id);
        const connectorId = Number(payload?.connectorId ?? payload?.connector_id);
        const newStatus = String(payload?.newStatus ?? payload?.status ?? "VERIFIED");
        const startTime = payload?.startTime;

        // 3) Build base từ payload verify
        let enriched: ResLite = {
          reservationId,
          stationId,
          stationName: payload?.stationName ?? payload?.station_name,
          pillarId,
          pillarCode:
            payload?.pillarCode ??
            payload?.pillar_code ??
            (pillarId ? `P${pillarId}` : undefined),
          connectorId,
          connectorType:
            payload?.connectorType ??
            payload?.connector_type ??
            (connectorId ? `Connector ${connectorId}` : undefined),
          newStatus,
          startTime,
        };

        // Nếu có userId + reservationId → enrich thêm từ /user/{userId}/reservations
        if (userId && reservationId) {
          try {
            const res = await api.get(`/user/${userId}/reservations`, {
              withCredentials: true,
            });
            const arr =
              Array.isArray(res.data) ? res.data :
              Array.isArray(res.data?.data) ? res.data.data :
              [];

            const row = arr.find(
              (x: any) => Number(x?.reservationId) === reservationId
            );
            if (row) {
              enriched = {
                ...enriched,
                stationId: row.stationId ?? enriched.stationId,
                stationName: row.stationName ?? enriched.stationName,
                pillarId: row.pillarId ?? enriched.pillarId,
                pillarCode:
                  row.pillarCode ??
                  enriched.pillarCode ??
                  (row.pillarId ? `P${row.pillarId}` : undefined),
                connectorId: row.connectorId ?? enriched.connectorId,
                connectorType: row.connectorType ?? enriched.connectorType,
                startTime: row.startTime ?? enriched.startTime,
              };
            }
          } catch {
            // nếu fail vẫn dùng enriched hiện tại
          }
        }

        setResv(enriched);


        // 4) Lấy vehicle: chọn theo localStorage.vehicle_id nếu có, fallback [0]
        if (userId) {
          try {
            const vehRes = await api.get(`/vehicle/${userId}`, { withCredentials: true });
            const raw = vehRes?.data?.data ?? vehRes?.data ?? [];
            const list: VehicleLite[] = Array.isArray(raw)
              ? raw.map((v: any) => ({
                  id: Number(v.id ?? v.vehicleId),
                  name: v.name,
                  brand: v.brand,
                  model: v.model,
                  currentSoc:
                    typeof v.currentSoc === "number"
                      ? v.currentSoc
                      : typeof v.socNow === "number"
                      ? Math.round(v.socNow <= 1 ? v.socNow * 100 : v.socNow)
                      : undefined,
                }))
              : [];
            const preferredId = Number(localStorage.getItem("vehicle_id")) || undefined;
            const picked = list.find((x) => x.id === preferredId) ?? list[0] ?? null;
            setVehicle(picked ?? null);
          } catch {
            setVehicle(null);
          }
        }

        setState("ok");
        setMessage(verify?.data?.message || "Check-in successful");
        toast({
          title: "Check-in",
          description:
            verify?.data?.message ||
            (reservationId ? `Reservation #${reservationId} → ${newStatus}` : "Verified"),
        });

        // về dashboard sau 30s
        setTimeout(() => navigate("/dashboard"), 30000);
      } catch (e: any) {
        setState("fail");
        setMessage(e?.response?.data?.message || e?.message || "Verify failed");
      }
    };

    run();
  }, [token, navigate, toast]);

  const icon =
    state === "loading" || state === "idle" ? (
      <Loader2 className="w-5 h-5 animate-spin" />
    ) : state === "ok" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    ) : (
      <XCircle className="w-5 h-5 text-rose-600" />
    );

  const badgeVariant =
    state === "ok" ? "default" : state === "fail" ? "destructive" : "secondary";

  const prettyStart = useMemo(
    () => (resv?.startTime ? new Date(resv.startTime).toLocaleString() : "—"),
    [resv?.startTime]
  );

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-2xl shadow-card border-2 border-transparent hover:border-primary/20 transition">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10">
              <QrCode className="w-5 h-5 text-primary" />
            </span>
            Check-in
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Status row */}
          <div className="flex items-center justify-center">
            <Badge variant={badgeVariant as any} className="gap-2">
              {icon}
              {state === "ok" ? "Success" : state === "fail" ? "Failed" : "Verifying"}
            </Badge>
          </div>

          {/* Token */}
          <div className="text-center text-sm text-muted-foreground break-all">
            Token: <span className="font-mono">{token || "—"}</span>
          </div>

          {/* Message */}
          <div
            className={[
              "text-center text-sm",
              state === "ok"
                ? "text-emerald-700"
                : state === "fail"
                ? "text-rose-600"
                : "text-muted-foreground",
            ].join(" ")}
          >
            {message}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reservation */}
            <Card className="border rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <PlugZap className="w-4 h-4 text-emerald-600" />
                  Reservation
                </div>
                <div className="text-sm">
                  <div>ID: <b>{resv?.reservationId ?? "—"}</b></div>
                  <div>Status: <Badge variant="outline" className="rounded-full">{resv?.newStatus ?? "—"}</Badge></div>
                  <div className="mt-1 text-xs text-slate-600">Start: {prettyStart}</div>
                </div>
              </CardContent>
            </Card>

            {/* Station/Pillar */}
            <Card className="border rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Station
                </div>
                <div className="text-sm">
                  <div>Name: <b>{resv?.stationName ?? "—"}</b></div>
                  <div>Pillar: <b>{resv?.pillarCode ?? (resv?.pillarId ? `P${resv.pillarId}` : "—")}</b></div>
                  <div>Connector: <b>{resv?.connectorType ?? (resv?.connectorId ? `Connector ${resv.connectorId}` : "—")}</b></div>
                </div>
              </CardContent>
            </Card>

            {/* User */}
            <Card className="border rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  User
                </div>
                <div className="text-sm">
                  <div>ID: <b>{user?.id ?? "—"}</b></div>
                  <div>Name: <b>{user?.name ?? "—"}</b></div>
                  <div className="text-xs text-slate-600">{user?.email || user?.phone || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle */}
            <Card className="border rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-600" />
                  Vehicle
                </div>
                <div className="text-sm">
                  <div>ID: <b>{vehicle?.id ?? "—"}</b></div>
                  <div>Model: <b>{vehicle?.name || [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "—"}</b></div>
                  {typeof vehicle?.currentSoc === "number" && (
                    <div>SoC: <b>{vehicle.currentSoc}%</b></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
