// src/pages/admin/AdminStations.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
// ⬇️ BỎ Progress vì không còn dùng
// import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import {
  Activity,
  AlertCircle,
  Eye,
  MapPin,
  Navigation,
  Plus,
  Power,
  RefreshCw,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { motion, type Variants } from "framer-motion";

/* ====================== BE DTOs ====================== */
type ApiResponse<T> = { code?: string; message?: string; data: T };

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index
};

type ChargingStationDetailResponse = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number | null;
  status?: string | null;
  availablePillars?: number | null;
  totalPillars?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minPower?: number | null;
  maxPower?: number | null;
  pillars?: {
    id?: number;
    code?: string;
    status?: string | null;
    power?: number | null;
    pricePerKwh?: number | null;
    connectors?: { id?: number; type?: string }[];
  }[];
};

type IncidentResponse = {
  id: number;
  title: string;
  stationId: number;
  stationName: string;
  pillarId?: number;
  priority: string; // "High" | "Medium" | "Low"
  status: string; // "Open" | "Resolved"
  description?: string;
  reportedBy: string;
  reportedById: number;
  reportedTime: string; // ISO
};

/* ====================== Local view models ====================== */
type StationVM = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  // ⬇️ THÊM: chỉ cần tổng số pillars để hiển thị
  pillars: number;
  // các field còn lại giữ để dùng ở chỗ khác
  available: number;
  total: number;
  minPrice?: number;
  maxPrice?: number;
  maxPower?: number;
};

type StationStatus = "all" | "available" | "offline" | "maintenance";

/* ====================== Helpers ====================== */
const formatVND = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n);

const U = (s?: string | null) => (s ?? "").trim().toUpperCase();

/** Map BE -> VM */
const toVM = (s: ChargingStationDetailResponse): StationVM => {
  const pillars = s.pillars ?? [];

  const POSITIVE = new Set(["AVAILABLE", "FREE,IDLE", "IDLE", "ONLINE", "FREE"]);
  const NEGATIVE = new Set(["OCCUPIED", "BUSY"]);
  const isAvail = (st?: string | null) => {
    const x = U(st);
    if (POSITIVE.has(x)) return true;
    if (NEGATIVE.has(x)) return false;
    return x.includes("AVAIL");
  };

  const availableDerived = pillars.filter((p) => isAvail(p.status)).length;
  const totalDerived = pillars.length;

  const hasPillars = totalDerived > 0;
  const available = hasPillars
    ? availableDerived
    : s.availablePillars != null
    ? Number(s.availablePillars)
    : 0;
  const total = hasPillars
    ? totalDerived
    : s.totalPillars != null
    ? Number(s.totalPillars)
    : 0;

  const priceList = pillars
    .map((p) => (p.pricePerKwh == null ? undefined : Number(p.pricePerKwh)))
    .filter((v): v is number => Number.isFinite(v));
  const minPrice = hasPillars
    ? priceList.length
      ? Math.min(...priceList)
      : undefined
    : s.minPrice != null
    ? Number(s.minPrice)
    : undefined;
  const maxPrice = hasPillars
    ? priceList.length
      ? Math.max(...priceList)
      : undefined
    : s.maxPrice != null
    ? Number(s.maxPrice)
    : undefined;

  const powerList = pillars
    .map((p) => (p.power == null ? undefined : Number(p.power)))
    .filter((v): v is number => Number.isFinite(v));
  const derivedMaxPower = hasPillars && powerList.length ? Math.max(...powerList) : undefined;
  const maxPower = hasPillars ? derivedMaxPower : s.maxPower != null ? Number(s.maxPower) : undefined;

  let status = U(s.status ?? "");
  if (!status) status = available > 0 ? "AVAILABLE" : "OFFLINE";

  return {
    id: s.id,
    name: s.name,
    address: s.address,
    lat: s.latitude,
    lng: s.longitude,
    status,
    // ⬇️ CHỈ SỐ LƯỢNG PILLARS (ưu tiên count từ mảng pillars, fallback totalPillars)
    pillars: totalDerived || Number(s.totalPillars ?? 0),
    available,
    total,
    minPrice,
    maxPrice,
    maxPower,
  };
};

/* user icon (optional) */
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* Status badge */
const StatusBadge = ({ status }: { status: string }) => {
  const S = U(status);
  if (S.includes("OFFLINE")) {
    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1.5 px-2.5 py-1">
        <WifiOff className="w-3.5 h-3.5" />
        Offline
      </Badge>
    );
  }
  if (S.includes("MAINT")) {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1.5 px-2.5 py-1">
        <Wrench className="w-3.5 h-3.5" />
        Maintenance
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1.5 px-2.5 py-1">
      <Wifi className="w-3.5 h-3.5" />
      Available
    </Badge>
  );
};

/* Fit map bounds */
const FitBoundsOnData = ({
  points,
}: {
  points: { lat: number; lng: number }[];
}) => {
  const map = useMap();
  useEffect(() => {
    const pts = points.filter(
      (p: { lat: number; lng: number }) =>
        Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    if (!pts.length) return;
    const bounds = L.latLngBounds(
      pts.map((p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number])
    );
    if (pts.length === 1) map.setView(bounds.getCenter(), 15, { animate: true });
    else map.fitBounds(bounds.pad(0.2), { animate: true });
  }, [points, map]);
  return null;
};

const EASE_BEZIER: [number, number, number, number] = [0.42, 0, 0.58, 1];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_BEZIER },
  },
};

/* ====================== Page ====================== */
const AdminStations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Map
  const mapRef = useRef<L.Map | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  // Data
  const [page] = useState(0);
  const [loading, setLoading] = useState(false);

  const [stations, setStations] = useState<StationVM[]>([]);
  const [statusFilter, setStatusFilter] = useState<StationStatus>("all");

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // ====== refs for scroll container height ======
  const bodyRef = useRef<HTMLTableSectionElement | null>(null);
  const [scrollH, setScrollH] = useState<number>(460);

  // Geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos([10.7769, 106.7009]) // HCMC fallback
    );
  }, []);

  // Load stations
  const loadStations = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Page<ChargingStationDetailResponse>>>(
        "/charging-stations/getAll",
        { params: { page: 0, size: 100 } }
      );
      const content = res.data?.data?.content ?? [];
      setStations(content.map(toVM));
    } catch (e: any) {
      toast({
        title: "Load stations failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load incidents
  const loadIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await api.get<ApiResponse<IncidentResponse[]>>("/incidents/getAll");
      setIncidents(res.data?.data ?? []);
    } catch (e: any) {
      toast({
        title: "Load incidents failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    loadStations();
    loadIncidents();
  }, [page]);

  // Derived
  const filteredStations = useMemo(() => {
    if (statusFilter === "all") return stations;
    if (statusFilter === "available") return stations.filter((s) => U(s.status).includes("AVAILABLE"));
    if (statusFilter === "offline") return stations.filter((s) => U(s.status).includes("OFFLINE"));
    return stations.filter((s) => U(s.status).includes("MAINT"));
  }, [stations, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      const firstRow = bodyRef.current?.querySelector("tr") as HTMLTableRowElement | null;
      if (firstRow) {
        const rowH = firstRow.getBoundingClientRect().height || 90;
        setScrollH(Math.round(rowH * 5 + 16)); // 5 rows + little padding
      }
    }, 0);
    return () => clearTimeout(t);
  }, [filteredStations]);

  const navigateToStation = (s: StationVM) => {
    mapRef.current?.setView([s.lat, s.lng], 17, { animate: true });
  };

  // Header actions
  const actions = (
    <>
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StationStatus)}>
        <SelectTrigger className="w-40 bg-white/70 border-slate-300 text-slate-900 ring-offset-background">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="bg-white/90 backdrop-blur-md border-slate-200 text-slate-900">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        className="bg-white/70 border-slate-300 hover:bg-white text-slate-700"
        onClick={loadStations}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh Status
      </Button>

      <Button
        onClick={() => navigate("/admin/add-station")}
        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:brightness-110"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Station
      </Button>

      <Button className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 hover:brightness-110">
        <Power className="w-4 h-4 mr-2" />
        Remote Control
      </Button>
    </>
  );

  return (
    <AdminLayout title="Station Management" actions={actions}>
      <div className="w-full h-full bg-slate-50 text-slate-900">
        {/* ==================== MAP ==================== */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card className="mb-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/15">
            <CardHeader className="pb-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Activity className="w-5 h-5 text-cyan-600" />
                Network Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[500px] rounded-b-lg overflow-hidden">
              <MapContainer
                center={userPos ?? [10.8618942110713, 106.79798794919327]}
                zoom={13}
                scrollWheelZoom
                zoomControl={true}
                ref={mapRef}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userPos && (
                  <Marker position={userPos} icon={userIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                )}

                <FitBoundsOnData
                  points={filteredStations.map((s) => ({ lat: s.lat, lng: s.lng }))}
                />

                {filteredStations.map((s) => (
                  <Marker key={s.id} position={[s.lat, s.lng]}>
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-slate-600">{s.address}</div>
                        <Separator className="my-2" />
                        <div className="text-sm flex items-center gap-2">
                          <StatusBadge status={s.status} />
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {/* ⬇️ CHỈ HIỂN THỊ SỐ LƯỢNG PILLARS */}
                          Pillars: <span className="font-medium">{s.pillars}</span>
                          <br />
                          Power: <span className="font-medium">{s.maxPower ?? "—"} kW</span>
                          <br />
                          Price:{" "}
                          <span className="font-medium">
                            {formatVND(s.minPrice)}
                            {s.maxPrice != null && s.maxPrice !== s.minPrice
                              ? `–${formatVND(s.maxPrice)}`
                              : ""}
                            /kWh
                          </span>
                        </div>
                        <div className="mt-2">
                          <Button size="sm" className="w-full" onClick={() => navigateToStation(s)}>
                            <Navigation className="w-4 h-4 mr-1" />
                            Focus here
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ==================== STATION TABLE ==================== */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card className="mb-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/15">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                <Power className="w-5 h-5 mr-3 text-emerald-600" />
                Live Station Network ({filteredStations.length} stations)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div
                  className="overflow-y-auto rounded-b-lg border-t border-slate-200/60"
                  style={{ maxHeight: `${scrollH}px` }}
                >
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                      <TableRow className="border-b-slate-200/60">
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Station</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Status</TableHead>
                        {/* ⬇️ Vẫn là tiêu đề Pillars nhưng chỉ hiển thị con số */}
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Pillars</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Power</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Price</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody ref={bodyRef}>
                      {filteredStations.map((s) => (
                        <TableRow
                          key={s.id}
                          className="border-slate-200/50 hover:bg-slate-100/70 transition-colors"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{s.name}</div>
                              <div className="text-sm text-slate-600 flex items-center">
                                <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                {s.address}
                              </div>
                              <div className="text-xs text-slate-500 pt-1">ID: {s.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} />
                          </TableCell>
                          {/* ⬇️ CHỈ LÀ CON SỐ PILLARS, KHÔNG PROGRESS/AVAILABLE */}
                          <TableCell className="text-sm font-medium text-slate-900 min-w-24">
                            {s.pillars}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900">
                            {s.maxPower ?? "—"} kW
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900">
                            {formatVND(s.minPrice)}
                            {s.maxPrice != null && s.maxPrice !== s.minPrice
                              ? `–${formatVND(s.maxPrice)}`
                              : ""}
                            /kWh
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                                onClick={() => navigate(`/admin/stations/${s.id}`)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                                onClick={() => navigateToStation(s)}
                              >
                                Focus
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!filteredStations.length && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-sm text-slate-500 text-center py-8"
                          >
                            {loading ? "Loading stations…" : "No stations found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ==================== INCIDENTS ==================== */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="pb-8">
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/15">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                Incidents Reported by Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="max-h-[500px] overflow-y-auto rounded-b-lg border-t border-slate-200/60">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                      <TableRow className="border-b-slate-200/60">
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Timestamp</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Title</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Station / Pillar</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Priority</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Status</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Reported By</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* ...giữ nguyên phần incidents... */}
                      {incidents.map((it) => (
                        <TableRow
                          key={it.id}
                          className="border-slate-200/50 hover:bg-slate-100/70 transition-colors"
                        >
                          <TableCell className="text-sm font-mono text-slate-600">
                            {new Date(it.reportedTime).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900">
                            {it.title}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium text-slate-900">
                              {it.stationName}{" "}
                              <span className="text-xs text-slate-500">
                                #{it.stationId}
                              </span>
                            </div>
                            {it.pillarId && (
                              <div className="text-xs text-slate-500">
                                Pillar: {it.pillarId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${it.priority.toLowerCase() === "high"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : it.priority.toLowerCase() === "medium"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                }`}
                            >
                              {it.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${it.status.toLowerCase() === "open"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                }`}
                            >
                              {it.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-cyan-600 font-medium">
                            {it.reportedBy}
                          </TableCell>
                          <TableCell
                            className="text-sm text-slate-600 max-w-[420px] truncate"
                            title={it.description}
                          >
                            {it.description}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!incidents.length && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-sm text-slate-500 text-center py-8"
                          >
                            {loadingIncidents ? "Loading incidents…" : "No incidents."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminStations;
