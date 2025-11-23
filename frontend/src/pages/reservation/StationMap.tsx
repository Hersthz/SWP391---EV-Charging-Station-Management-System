import { useState, useEffect, useRef } from "react";
import {
  Star,
  ArrowLeft,
  Search,
  Navigation,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Dialog, DialogContent, DialogClose } from "../../components/ui/dialog";
import { useDebounce } from "use-debounce";

// Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { ChatBot } from "./../ChatBot";

/* =========================
   Types - UPDATED to match BE DTOs
========================= */

interface Connector {
  type: string;
}

interface Pillar {
  code: string;
  status: string;
  power: number;
  pricePerKwh: number;
  connectors: Connector[];
}

interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  pillars: Pillar[];
  distance?: number;
  availablePorts?: number;
  totalPorts?: number;
  minPrice?: number;
  maxPrice?: number;
  maxPower?: number;
  connectorTypes?: string[];
  url?: string;
}

type SortOption = "distance" | "price" | "power" | "availability";
interface Filters {
  radius: number;
  connectors: string[];
  availableOnly: boolean;
  minPower?: number;
  maxPower?: number;
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  page: number;
  size: number;
}

type Review = {
  id: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

interface StationReviewDto {
  id: number;
  stationId: number;
  userId: number;
  userName: string;     
  rating: number;
  comment: string;
  createdAt: string;
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}


type StationReviewApiResponse = {
  code: string;
  message: string;
  data: StationReviewDto[];
};

/* ===== Backend response types ===== */
interface ChargingStationSummaryResponse {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  status: string;
  availableConnectors?: number;
  totalConnectors?: number;
  minPrice?: number;
  maxPrice?: number;
  minPower?: number;
  maxPower?: number;
  connectorTypes?: string[];
  url?: string;
}

interface ChargingStationDetailResponse {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  status: string;
  availableConnectors?: number;
  totalConnectors?: number;
  minPrice?: number;
  maxPrice?: number;
  minPower?: number;
  maxPower?: number;
  pillars: {
    id?: number;
    code: string;
    status: string;
    power: number;
    pricePerKwh: number;
    connectors: { id?: number; status?: string; type: string }[];
  }[];
  reviews?: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  url?: string;
}

/* =========================
   Constants & helpers 
========================= */
const formatVND = (n?: number) =>
  n == null
    ? "—"
    : n.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });

const defaultFilters: Filters = {
  radius: 100,
  connectors: [],
  availableOnly: false,
  minPower: 0,
  maxPower: 350,
  minPrice: 0,
  maxPrice: 50000,
  sort: "distance",
  page: 0,
  size: 50,
};

const MOCK_STATIONS: Station[] = [
  {
    id: 1,
    name: "Station #1",
    address: "Mock Address 1",
    latitude: 10.8618942110713,
    longitude: 106.79798794919327,
    status: "Occupied",
    pillars: [
      {
        code: "P1-1",
        status: "Occupied",
        power: 150.0,
        pricePerKwh: 0.5,
        connectors: [{ type: "CCS" }, { type: "CHAdeMO" }],
      },
    ],
    distance: 0.8,
    availablePorts: 0,
    totalPorts: 1,
    minPrice: 0.5,
    maxPrice: 0.5,
    maxPower: 150,
    connectorTypes: ["CCS", "CHAdeMO"],
  },
];

/* leaflet user icon */
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

const computeBearing = (
  from: [number, number],
  to: [number, number]
): number => {
  const [lat1, lon1] = from.map(toRad) as [number, number];
  const [lat2, lon2] = to.map(toRad) as [number, number];
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

const createDirectionIcon = (angle: number) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 16px solid #ef4444;
      transform: rotate(${angle}deg);
      transform-origin: 50% 50%;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        viewBox="0 0 20 20"
        className={`h-4 w-4 ${
          i < value ? "fill-yellow-400" : "fill-zinc-200"
        }`}
      >
        <path d="M10 15.27L15.18 18 13.64 11.97 18 8.24 11.81 7.63 10 2 8.19 7.63 2 8.24 6.36 11.97 4.82 18z" />
      </svg>
    ))}
  </div>
);

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Occupied: "bg-amber-50 text-amber-700 border-amber-200",
  Offline: "bg-zinc-100 text-zinc-600 border-zinc-200",
  Maintenance: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PillarStatusBadge = ({ status }: { status: string }) => (
  <Badge
    className={`border text-xs ${
      statusStyles[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200"
    }`}
  >
    {status}
  </Badge>
);

const StatTile = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-900/5">
    <div className="text-[11px] uppercase tracking-wide text-zinc-500">
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold text-zinc-900">{value}</div>
    {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
  </div>
);

const avgRating = (reviews: Review[]) =>
  reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

const initials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// map helpers: convert BE summary -> Station
const mapSummaryToStation = (s: ChargingStationSummaryResponse): Station => ({
  id: s.id,
  name: s.name,
  address: s.address,
  latitude: s.latitude,
  longitude: s.longitude,
  status: s.status,
  pillars: [],
  distance: s.distance,
  availablePorts: s.availableConnectors ?? 0,
  totalPorts: s.totalConnectors ?? 0,
  minPrice: s.minPrice ?? undefined,
  maxPrice: s.maxPrice ?? undefined,
  maxPower: s.maxPower ?? undefined,
  connectorTypes: s.connectorTypes ?? [],
  url: s.url,
});

const mapDetailToStation = (d: ChargingStationDetailResponse): Station => {
  const pillars: Pillar[] = (d.pillars ?? []).map((p) => ({
    code: p.code,
    status: p.status,
    power: p.power,
    pricePerKwh: p.pricePerKwh,
    connectors: (p.connectors ?? []).map((c) => ({ type: c.type })),
  }));
  const connectorTypes = [
    ...new Set(pillars.flatMap((p) => p.connectors.map((c) => c.type))),
  ];
  const availableFromPillars = pillars.filter(
    (p) => String(p.status).toLowerCase() === "available"
  ).length;

  return {
    id: d.id,
    name: d.name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
    status: d.status,
    pillars,
    distance: d.distance,
    availablePorts: d.availableConnectors ?? availableFromPillars,
    totalPorts: d.totalConnectors ?? pillars.length,
    minPrice:
      d.minPrice ??
      (pillars.length
        ? Math.min(...pillars.map((p) => p.pricePerKwh))
        : undefined),
    maxPrice:
      d.maxPrice ??
      (pillars.length
        ? Math.max(...pillars.map((p) => p.pricePerKwh))
        : undefined),
    maxPower:
      d.maxPower ??
      (pillars.length
        ? Math.max(...pillars.map((p) => p.power))
        : undefined),
    connectorTypes,
    url: d.url,
  };
};

/* ===== Animations ===== */

const pageFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  // dùng `any` để hợp với kiểu `custom` của framer-motion
  visible: (i: any) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: "easeOut",
      delay: 0.02 * (typeof i === "number" ? i : 0),
    },
  }),
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: { duration: 0.18 },
  },
};

const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.18 } },
};

/* =========================
   Component
========================= */
const StationMap = () => {
  const navigate = useNavigate();

  // data
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const mapRef = useRef<L.Map | null>(null);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const directionAngle =
    userPosition && selectedStation
      ? computeBearing(userPosition, [
          selectedStation.latitude,
          selectedStation.longitude,
        ])
      : null;

  // applied filters
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(defaultFilters);

  // UI state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  // filter popovers
  const [showRadius, setShowRadius] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showPower, setShowPower] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // draft values for popovers
  const [draftRadius, setDraftRadius] = useState(appliedFilters.radius);
  const [priceMax, setPriceMax] = useState(appliedFilters.maxPrice ?? 50000);
  const [minPower, setMinPower] = useState(appliedFilters.minPower ?? 0);
  const [draftConnectors, setDraftConnectors] = useState<string[]>(
    appliedFilters.connectors ?? []
  );
  const [availableOnly, setAvailableOnly] = useState(
    appliedFilters.availableOnly ?? false
  );

  // detail popup state
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // geolocation & first fetch
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude,
          lon = pos.coords.longitude;
        setUserPosition([lat, lon]);
        fetchStations(appliedFilters, lat, lon);
        if (mapRef.current) mapRef.current.setView([lat, lon], 13);
      },
      () => {
        // Fallback: center HCMC + mock
        const fallback: [number, number] = [10.7769, 106.7009];
        setUserPosition(fallback);
        const computedStations = MOCK_STATIONS.map((s) => s); // mocks already computed
        setStations(computedStations);
        if (mapRef.current) mapRef.current.setView(fallback, 13);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when filters applied
  useEffect(() => {
    if (!userPosition) return;
    fetchStations(appliedFilters, userPosition[0], userPosition[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, debouncedSearch]);

  const fetchStations = async (
    filters: Filters,
    lat?: number,
    lon?: number
  ) => {
    if (lat == null || lon == null) return;
    setLoading(true);
    try {
      const { data } = await api.get<{
        content: ChargingStationSummaryResponse[];
      }>("/charging-stations/nearby", {
        params: {
          latitude: lat,
          longitude: lon,
          radius: filters.radius,
          connectors: filters.connectors,
          availableOnly: filters.availableOnly,
          minPower: filters.minPower,
          maxPower: filters.maxPower,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          sort: filters.sort,
          page: filters.page,
          size: filters.size,
          search: searchQuery,
        },
      });
      const mapped: Station[] = data.content.map(mapSummaryToStation);
      setStations(mapped);
    } catch (e) {
      console.error("Fetch stations error:", e);
      const computedStations = MOCK_STATIONS.map((s) => s);
      setStations(computedStations);
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = (c: string) => {
    setDraftConnectors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const applyAllFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      radius: draftRadius,
      maxPrice: Number(priceMax),
      minPower,
      connectors: draftConnectors,
      availableOnly,
      page: 0,
    }));
    setShowRadius(false);
    setShowPrice(false);
    setShowPower(false);
    setShowConnector(false);
    setShowMore(false);
  };

  const clearAll = () => {
    setDraftRadius(defaultFilters.radius);
    setPriceMax(defaultFilters.maxPrice ?? 50000);
    setMinPower(defaultFilters.minPower ?? 0);
    setDraftConnectors([]);
    setAvailableOnly(false);
    setAppliedFilters(defaultFilters);
  };

  const navigateToStation = (station: Station) => {
    if (mapRef.current)
      mapRef.current.setView(
        [station.latitude, station.longitude],
        17,
        { animate: true } as any
      );
  };

  // open detail dialog: call detail endpoint and map to Station
  const openStationDialog = async (station: Station) => {
    setSelectedStation(station);
    setDetailOpen(true);
    setReviewsLoading(true);

    try {
      // detail trạm 
      const detailRes = await api.get<ChargingStationDetailResponse>(
        `/charging-stations/${station.id}`,
        {
          params: {
            latitude: userPosition?.[0],
            longitude: userPosition?.[1],
          },
        }
      );
      const mapped = mapDetailToStation(detailRes.data);
      setSelectedStation(mapped);

      // lấy review theo stationId
      const reviewsRes = await api.get<ApiResponse<StationReviewDto[]>>(
        `/reviews/station/${station.id}`
      );

      const list = (reviewsRes.data.data ?? []).map((r) => ({
        id: String(r.id),
        userId: r.userId,
        userName: r.userName ?? `User #${r.userId}`,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }));

      setReviews(list);
    } catch (e) {
      console.error("Fetch detail/reviews error:", e);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // heights: header(60) + filters(56) = 116
  const viewportMinusBars = "calc(100vh - 116px)";

  return (
    <motion.div
      className="min-h-screen bg-zinc-50"
      variants={pageFade}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="flex h-20 items-center gap-4 px-6">
          {/* Back + title */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {/* Search bám sát tiêu đề, full chiều ngang còn lại */}
          <div className="relative ml-6 flex-1 max-w-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search charging stations..."
              className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm shadow-inner focus-visible:border-sky-400 focus-visible:ring-0"
            />
          </div>
        </div>
      </header>


      {/* FILTERS BAR */}
      <div className="sticky top-[60px] z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-lg">
        <div className="flex h-16 items-center gap-3 px-6">
          {/* RADIUS */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-slate-50/90 px-4 text-xs sm:text-sm font-medium
                          text-slate-700 shadow-sm shadow-slate-900/5
                          hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => {
                setShowRadius((v) => !v);
                setShowPrice(false);
                setShowPower(false);
                setShowConnector(false);
                setShowMore(false);
              }}
            >
              <MapPin className="mr-1 h-3 w-3 text-sky-500" />
              {appliedFilters.radius} km radius
              {appliedFilters.radius !== defaultFilters.radius && (
                <Badge className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                  1
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showRadius && (
              <div className="absolute top-full z-[1000] mt-2 w-80 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-900/10">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">
                    Search Radius
                  </p>
                  <button onClick={() => setShowRadius(false)}>
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
                <p className="mb-2 text-xs text-zinc-500">
                  Distance from your location
                </p>
                <input
                  type="range"
                  min={1}
                  max={200}
                  step={1}
                  value={draftRadius}
                  onChange={(e) => setDraftRadius(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-1 flex justify-between text-xs text-zinc-500">
                  <span>1 km</span>
                  <span className="font-semibold text-zinc-800">
                    {draftRadius} km
                  </span>
                  <span>200 km</span>
                </div>
                <div className="mt-4 text-right">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    onClick={applyAllFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-slate-50/90 px-4 text-xs sm:text-sm font-medium
                          text-slate-700 shadow-sm shadow-slate-900/5
                          hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => {
                setShowPrice((v) => !v);
                setShowRadius(false);
                setShowPower(false);
                setShowConnector(false);
                setShowMore(false);
              }}
            >
              Up to {formatVND(appliedFilters.maxPrice ?? 50000)}/kWh
              {Number(appliedFilters.maxPrice) !== defaultFilters.maxPrice && (
                <Badge className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                  1
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showPrice && (
              <div className="absolute top-full z-[1000] mt-2 w-80 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-900/10">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">
                    Price Range
                  </p>
                  <button onClick={() => setShowPrice(false)}>
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
                <p className="mb-2 text-xs text-zinc-500">
                  Max price per kWh
                </p>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={priceMax}
                  onChange={(e) => setPriceMax(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-1 text-sm font-semibold text-zinc-800">
                  {formatVND(priceMax)}
                </div>
                <div className="mt-4 text-right">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    onClick={applyAllFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* POWER */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-slate-50/90 px-4 text-xs sm:text-sm font-medium
                          text-slate-700 shadow-sm shadow-slate-900/5
                          hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => {
                setShowPower((v) => !v);
                setShowRadius(false);
                setShowPrice(false);
                setShowConnector(false);
                setShowMore(false);
              }}
            >
              Power type
              {Number(appliedFilters.minPower) > 0 && (
                <Badge className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                  1
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showPower && (
              <div className="absolute top_full z-[1000] mt-2 w-64 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl shadow-zinc-900/10">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">
                    Minimum Power
                  </p>
                  <button onClick={() => setShowPower(false)}>
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
                <div className="space-y-1">
                  {[0, 50, 150, 250, 350].map((p) => (
                    <button
                      key={p}
                      onClick={() => setMinPower(p)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        minPower === p
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "hover:bg-zinc-100"
                      }`}
                    >
                      {p === 0 ? "Any" : `${p}kW+`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    onClick={applyAllFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* CONNECTORS */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-slate-50/90 px-4 text-xs sm:text-sm font-medium
                          text-slate-700 shadow-sm shadow-slate-900/5
                          hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => {
                setShowConnector((v) => !v);
                setShowRadius(false);
                setShowPrice(false);
                setShowPower(false);
                setShowMore(false);
              }}
            >
              Connectors
              {draftConnectors.length > 0 && (
                <Badge className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                  {draftConnectors.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showConnector && (
              <div className="absolute top-full z-[1000] mt-2 w-72 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-900/10">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">
                    Connector Types
                  </p>
                  <button onClick={() => setShowConnector(false)}>
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  {["CCS", "CHAdeMO", "Type2", "AC"].map((c) => {
                    const checked = draftConnectors.includes(c);
                    return (
                      <label
                        key={c}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-100"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleConnector(c)}
                        />
                        <span>{c}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 text-right">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    onClick={applyAllFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* MORE */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-slate-50/90 px-4 text-xs sm:text-sm font-medium
                          text-slate-700 shadow-sm shadow-slate-900/5
                          hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => {
                setShowMore((v) => !v);
                setShowRadius(false);
                setShowPrice(false);
                setShowPower(false);
                setShowConnector(false);
              }}
            >
              More filters
              {availableOnly && (
                <Badge className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                  1
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showMore && (
              <div className="absolute top-full z-[1000] mt-2 w-80 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-900/10">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">
                    Additional Filters
                  </p>
                  <button onClick={() => setShowMore(false)}>
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm hover:bg-zinc-100">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                  />
                  <span>Show available only</span>
                </label>
                <div className="mt-3 text-right">
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    onClick={applyAllFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {(appliedFilters.radius !== defaultFilters.radius ||
            appliedFilters.maxPrice !== defaultFilters.maxPrice ||
            (appliedFilters.minPower ?? 0) > 0 ||
            (appliedFilters.connectors?.length ?? 0) > 0 ||
            appliedFilters.availableOnly) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-xs text-zinc-500 hover:bg-zinc-100"
              onClick={clearAll}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* MAIN SPLIT */}
      <div className="relative flex flex-1 select-none overflow-hidden">
        {/* LEFT LIST */}
        <div
          className={`border-r border-zinc-200 bg-white/90 transition-[width] duration-200 ease-out ${
            isCollapsed ? "w-0" : "w-[42vw]"
          }`}
          style={{ height: viewportMinusBars }}
        >
          <div
            className={`h-full flex-col ${
              isCollapsed ? "hidden" : "flex"
            }`}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-sm text-zinc-500">
                Over {stations.length} charging stations
              </h2>
              <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                Stations within {appliedFilters.radius}km
              </Badge>
            </div>

            <div className="flex items-center gap-2 px-4 pb-3 text-sm text-zinc-500">
              <span>
                Last updated:{" "}
                {loading ? "updating…" : "a few seconds ago"}
              </span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>Real-time data</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AnimatePresence initial={false}>
                {stations.map((station, idx) => (
                  <motion.div
                    key={station.id}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={idx}
                    layout
                  >
                    <Card
                      onClick={() => openStationDialog(station)}
                      className="mb-4 cursor-pointer rounded-2xl border border-slate-200/80 bg-white/95
                                  shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-transparent
                                  transition-all duration-200
                                  hover:-translate-y-1 hover:border-emerald-400 hover:ring-emerald-400/40
                                  hover:shadow-[0_20px_45px_rgba(16,185,129,0.35)]"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="relative h-40 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-emerald-50">
                          {station.url ? (
                            <img
                              src={station.url}
                              alt={station.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <span className="text-xs text-zinc-500">
                                Station preview
                              </span>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10" />
                          {typeof station.distance === "number" && (
                            <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-zinc-700 shadow-sm">
                              {station.distance.toFixed(1)} km
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="mb-0.5 text-[11px] text-zinc-500">
                                {station.distance?.toFixed(1) ?? "—"} km away
                              </p>
                              <h3 className="truncate text-base font-semibold text-zinc-900">
                                {station.name}
                              </h3>
                              <p className="truncate text-sm text-zinc-500">
                                {station.address}
                              </p>
                            </div>
                            <Badge
                              variant={
                                station.status === "Available"
                                  ? "default"
                                  : "secondary"
                              }
                              className={`rounded-full px-2 py-0.5 text-[11px] ${
                                station.status === "Available"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/70"
                              }`}
                            >
                              {station.status}
                            </Badge>
                          </div>

                          <div className="my-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-emerald-700">
                                {station.maxPower} kW •{" "}
                                {station.maxPower &&
                                station.maxPower >= 150
                                  ? "Fast"
                                  : "Standard"}
                              </span>
                              <span className="text-zinc-500">
                                {(station.totalPorts ?? 0) > 0
                                  ? `${station.availablePorts}/${station.totalPorts} available`
                                  : "—/— available"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {station.connectorTypes?.map((c) => (
                                <Badge
                                  key={c}
                                  variant="outline"
                                  className="rounded-full border-zinc-200 bg-zinc-50 text-[11px]"
                                >
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                            <span className="text-sm text-zinc-500">
                              Price
                            </span>
                            <span className="text-sm font-semibold text-zinc-900">
                              {formatVND(station.minPrice)}
                              {station.maxPrice &&
                              station.maxPrice !== station.minPrice
                                ? ` - ${formatVND(station.maxPrice)}`
                                : ""}
                              /kWh
                            </span>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-full border-emerald-500/60 bg-white text-sm text-emerald-700
                                        hover:bg-gradient-to-r hover:from-emerald-500 hover:to-cyan-600
                                        hover:text-white hover:shadow-lg hover:shadow-cyan-500/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/booking/${station.id}`, { state: { station } });
                              }}
                            >
                              <Bookmark className="mr-1 h-4 w-4" />
                              Book Station
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-sm text-white hover:shadow-lg hover:shadow-cyan-500/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToStation(station);
                              }}
                            >
                              <Navigation className="mr-1 h-4 w-4" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT – MAP */}
        <div
          className="relative z-0 flex-1 bg-muted/30"
          style={{ height: viewportMinusBars }}
        >
          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="absolute left-4 top-4 z-[500] rounded-full bg-white/95 px-2 py-2 shadow-md ring-1 ring-zinc-200 hover:bg-white"
            aria-label={isCollapsed ? "Open list" : "Close list"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          {userPosition && (
            <button
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.setView(userPosition, 15, {
                    animate: true,
                  } as any);
                }
              }}
              className="absolute left-4 top-16 z-[500] rounded-full bg-white/95 p-2 shadow-md ring-1 ring-zinc-200 hover:bg-white"
              aria-label="Center on my location"
            >
              <MapPin className="h-5 w-5 text-emerald-600" />
            </button>
          )}

          {/* Map */}
          <MapContainer
            center={[10.8618942110713, 106.79798794919327]}
            zoom={13}
            scrollWheelZoom
            zoomControl={false}
            ref={mapRef}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPosition && (
              <Marker
                position={userPosition}
                icon={
                  directionAngle != null
                    ? createDirectionIcon(directionAngle)
                    : userIcon
                }
              >
                <Popup>📍 You are here</Popup>
              </Marker>
            )}

            {userPosition && selectedStation && directionAngle != null && (
              <Polyline
                positions={[
                  userPosition,
                  [selectedStation.latitude, selectedStation.longitude],
                ]}
                pathOptions={{
                  color: "#ef4444",
                  weight: 2,
                  dashArray: "4 4",
                }}
              />
            )}
            
            {stations.map((s) => (
              <Marker
                key={s.id}
                position={[s.latitude, s.longitude]}
                eventHandlers={{
                  click: () => {
                    openStationDialog(s);
                  },
                }}
              >
                <Popup>
                  <div style={{ maxWidth: 220 }}>
                    {s.url && (
                      <img
                        src={s.url}
                        alt={s.name}
                        className="mb-2 block h-[70px] w-[120px] rounded object-cover"
                        loading="lazy"
                      />
                    )}
                    <strong>{s.name}</strong>
                    <br />
                    {s.address}
                    <br />
                    <span>
                      {s.availablePorts}/{s.totalPorts} available
                    </span>
                    <br />
                    <span>Up to {s.maxPower} kW</span>
                    <br />
                    <span>
                      {formatVND(s.minPrice)}/kWh
                      {s.maxPrice && s.maxPrice !== s.minPrice
                        ? ` - ${formatVND(s.maxPrice)}`
                        : ""}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-[92vw] max-w-3xl overflow-hidden border-none bg-transparent p-0 sm:max-h-[90vh] [&>button]:hidden">
          <AnimatePresence mode="wait">
            {detailOpen && (
              <motion.div
                key={selectedStation?.id ?? "dialog-shell"}
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex max-h-[82vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl shadow-zinc-900/20 ring-1 ring-zinc-200"
              >
                {/* Header */}
                <div className="relative h-24 md:h-28">
                  {selectedStation?.url ? (
                    <img
                      src={selectedStation.url}
                      alt={selectedStation?.name || "Station photo"}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600" />
                  )}

                  <div className="absolute inset-0 bg-black/35" />

                  <DialogClose asChild>
                    <button
                      type="button"
                      onClick={() => setDetailOpen(false)}
                      className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 shadow hover:bg-white"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </DialogClose>

                  {/* Title & status */}
                  <div className="relative z-10 flex h-full items-end gap-3 px-5 pb-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-zinc-700 shadow">
                      <span className="text-sm font-bold">
                        {initials(selectedStation?.name)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-white">
                          {selectedStation?.name ?? "Loading…"}
                        </h2>
                        {selectedStation && (
                          <Badge 
                            className={`border bg-white/90 ${
                              statusStyles[selectedStation.status] ??
                              "bg-zinc-100 text-zinc-700 border-zinc-200"
                            }`}
                          >
                            {selectedStation.status}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-white/90">
                        {selectedStation?.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                {selectedStation ? (
                  <div className="flex-1 overflow-y-auto space-y-4 bg-zinc-50/80 p-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <StatTile
                        label="Availability"
                        value={
                          <div className="flex items-center gap-2">
                            <span>
                              {selectedStation.availablePorts}/
                              {selectedStation.totalPorts}
                            </span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                        }
                        sub="Free / Total ports"
                      />
                      <StatTile
                        label="Price Range"
                        value={
                          <>
                            {formatVND(selectedStation.minPrice)}
                            {selectedStation.maxPrice &&
                            selectedStation.maxPrice !==
                              selectedStation.minPrice
                              ? `–${formatVND(selectedStation.maxPrice)}`
                              : ""}
                            /kWh
                          </>
                        }
                      />
                      <StatTile
                        label="Max Power"
                        value={`${selectedStation.maxPower ?? "—"} kW`}
                        sub={
                          (selectedStation.maxPower ?? 0) >= 150
                            ? "Fast"
                            : "Standard"
                        }
                      />
                      <StatTile
                        label="Distance"
                        value={`${
                          selectedStation.distance?.toFixed(1) ?? "—"
                        } km`}
                      />
                    </div>

                    {/* Connector chips */}
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Available connectors
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStation.connectorTypes?.length ? (
                          selectedStation.connectorTypes.map((c) => (
                            <Badge
                              key={c}
                              variant="outline"
                              className="rounded-full border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs"
                            >
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-500">
                            No connector info.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pillars */}
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Charging pillars
                      </div>
                      <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                        {selectedStation.pillars.map((p) => (
                          <div
                            key={p.code}
                            className="relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-900/5 transition hover:-translate-y-[1px] hover:border-emerald-400/70 hover:shadow-md hover:shadow-emerald-500/20"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-zinc-900">
                                    {p.code}
                                  </div>
                                  <PillarStatusBadge status={p.status} />
                                </div>
                                <div className="mt-1 text-sm text-zinc-600">
                                  {p.power} kW • {formatVND(p.pricePerKwh)}
                                  /kWh
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                                Connectors
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {p.connectors.map((c, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="rounded-full bg-zinc-100 text-xs text-zinc-700"
                                  >
                                    {c.type}
                                  </Badge>
                                ))}
                                {p.connectors.length === 0 && (
                                  <span className="text-xs text-zinc-400">
                                    No connectors
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedStation.pillars.length === 0 && (
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                            No detailed port information from server.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reviews */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-zinc-900">
                            User Reviews
                          </h3>
                          {reviews.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-zinc-600">
                              <Stars
                                value={Math.round(avgRating(reviews))}
                              />
                              <span className="ml-1 text-xs">
                                ({reviews.length})
                              </span>
                            </div>
                          )}
                        </div>
                        {!reviewsLoading && (
                          <div className="text-sm text-zinc-500">
                            {reviews.length} review
                            {reviews.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>

                      {reviewsLoading ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
                          Loading reviews…
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                          No reviews yet.
                        </div>
                      ) : (
                        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                          {reviews.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-900/5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-zinc-900">
                                  {r.userName}
                                </div>
                                <Stars value={r.rating} />
                              </div>
                              <p className="mt-1 text-sm text-zinc-700">
                                {r.comment}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sticky action bar */}
                    <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/40"
                          onClick={() => {
                            setDetailOpen(false);
                            if (selectedStation)
                              navigate(`/booking/${selectedStation.id}`, {
                                state: { station: selectedStation },
                              });
                          }}
                        >
                          <Bookmark className="mr-1 h-4 w-4" />
                          Book this Station
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full border-zinc-300 hover:bg-zinc-50"
                          onClick={() => {
                            setDetailOpen(false);
                            if (selectedStation)
                              navigateToStation(selectedStation);
                          }}
                        >
                          <Navigation className="mr-1 h-4 w-4" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Skeleton while waiting for detail fetch
                  <div className="space-y-4 bg-zinc-50/90 p-5">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 animate-pulse rounded-xl bg-zinc-200/70"
                        />
                      ))}
                    </div>
                    <div className="h-28 animate-pulse rounded-xl bg-zinc-200/70" />
                    <div className="h-36 animate-pulse rounded-xl bg-zinc-200/70" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      <ChatBot />
    </motion.div>
  );
};

export default StationMap;
