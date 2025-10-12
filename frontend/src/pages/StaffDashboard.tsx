// StaffDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import StaffLayout from "./../components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MapPin, Wifi, WifiOff, Signal, TrendingUp, Power, Zap, Thermometer, Battery, Eye, AlertTriangle, Clock } from "lucide-react";

type PillarDto = {
  code?: string;
  status?: string;
  power?: number;
  pricePerKwh?: number;
  connectors?: { id?: number; type?: string }[];
};

type ReviewDto = {
  id?: string;
  userName?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
};

type ChargingStationDetailResponse = {
  id?: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  availablePillars?: number;
  totalPillars?: number;
  minPrice?: number;
  maxPrice?: number;
  minPower?: number;
  maxPower?: number;
  pillars?: PillarDto[];
  reviews?: ReviewDto[];
};

const StaffDashboard = () => {
  const navigate = useNavigate();

  const [station, setStation] = useState<null | ChargingStationDetailResponse>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const meRes = await api.get("/auth/me", { signal: controller.signal });
        const me = meRes.data;
        const userId = me?.user_id ?? me?.id ?? me?.userId ?? Number(localStorage.getItem("userId"));
        if (!userId) throw new Error("Không tìm thấy userId từ /auth/me");

        const res = await api.get<any>(`/station-managers/${userId}`, { signal: controller.signal });
        const data = res.data;

        // backend có thể trả 1 object (trạm) hoặc mảng [{station: {...}}] hoặc [{...}]
        let s: any = null;
        if (Array.isArray(data)) {
          if (data.length === 0) {
            setStation(null);
            return;
          }
          const first = data[0];
          s = first.station ?? first.stationDto ?? first;
        } else {
          s = data.station ?? data.stationDto ?? data;
        }

        if (!s) {
          setStation(null);
          return;
        }

        // map dữ liệu sang kiểu response
        const mapped: ChargingStationDetailResponse = {
          id: s.id ?? s.stationId ?? undefined,
          name: s.name ?? s.stationName,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          status: s.status,
          availablePillars: s.availablePillars ?? s.availablePillars,
          totalPillars: s.totalPillars ?? s.totalPillars ?? (Array.isArray(s.pillars) ? s.pillars.length : undefined),
          minPrice: s.minPrice ?? s.min_price ?? s.minPrice,
          maxPrice: s.maxPrice ?? s.max_price ?? s.maxPrice,
          minPower: s.minPower ?? s.min_power ?? s.minPower,
          maxPower: s.maxPower ?? s.max_power ?? s.maxPower,
          pillars: Array.isArray(s.pillars) ? s.pillars : undefined,
          reviews: Array.isArray(s.reviews) ? s.reviews : undefined,
        };

        setStation(mapped);
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("StaffDashboard err:", err);
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else {
          setError(err?.response?.status ? `HTTP ${err.response.status}` : err.message ?? "Request failed");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [navigate]);

  if (loading) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-muted-foreground">Loading station…</div>
      </StaffLayout>
    );
  }

  if (error) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-destructive">Failed to load station ({error}).</div>
      </StaffLayout>
    );
  }

  if (!station) {
    return (
      <StaffLayout title="Staff Dashboard">
        <div className="p-6 text-sm text-muted-foreground">No assigned station.</div>
      </StaffLayout>
    );
  }

  // số liệu tổng quan từ DTO
  const total = station.totalPillars ?? station.pillars?.length ?? 0;
  const available = station.availablePillars ?? 0;

  return (
    <StaffLayout title="Staff Dashboard">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{station.name ?? "Unknown Station"}</h2>
                  <p className="text-sm text-muted-foreground">{station.address ?? "Address not provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {String(station.status ?? "").toLowerCase() === "available" ? (
                  <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    {station.status ?? "Unknown"}
                  </Badge>
                )}

                <span className="text-muted-foreground flex items-center gap-1">
                  <Signal className="w-4 h-4" />
                  Pillars: {available}/{total}
                </span>

                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Power: {station.minPower ?? "—"} - {station.maxPower ?? "—"} kW
                </span>

                <span className="text-muted-foreground flex items-center gap-1">
                  <Battery className="w-4 h-4" />
                  Price: {station.minPrice ?? "—"} - {station.maxPrice ?? "—"} $/kWh
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate("/staff/stations")} className="bg-primary text-primary-foreground">
                <Eye className="w-4 h-4 mr-2" />
                View Station Details
              </Button>
              <Button variant="outline" onClick={() => navigate("/staff/incidents")}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillars list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connector / Pillars</CardTitle>
            <p className="text-sm text-muted-foreground">Danh sách pillar và connector</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {station.pillars && station.pillars.length > 0 ? (
                station.pillars.map((p, idx) => (
                  <div key={p.code ?? idx} className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.code ?? `P-${idx + 1}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {p.status ?? "Unknown"} • {p.power ?? "—"} kW • {p.pricePerKwh ?? "—"} $/kWh
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Connectors: {Array.isArray(p.connectors) ? p.connectors.length : 0}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No pillars data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <p className="text-sm text-muted-foreground">User feedback</p>
          </CardHeader>
          <CardContent>
            {station.reviews && station.reviews.length > 0 ? (
              <div className="space-y-3">
                {station.reviews.map((r) => (
                  <div key={r.id} className="p-3 border rounded-md">
                    <div className="font-medium">{r.userName ?? "Anonymous"} <span className="text-xs text-muted-foreground">• {r.rating ?? "—"}/5</span></div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{r.comment}</div>
                    <div className="text-xs text-muted-foreground mt-1">{r.createdAt}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No reviews yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
