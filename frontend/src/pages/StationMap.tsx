import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Search, Navigation, Bookmark,
  ChevronLeft, ChevronRight, ChevronDown, X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import { Star } from "lucide-react";
// Leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// ==== MOCK STATIONS (dùng khi CORS lỗi / backend chưa chạy) ====
/*const MOCK_STATIONS: Station[] = [
  {
    id: 1,
    name: "Downtown Fast Charge Hub",
    address: "123 Main Street, District 1",
    latitude: 10.7769,
    longitude: 106.7009,
    distance: 0.5,
    status: "Available",
    power: "150 kW • Fast",
    available: "4/8 available",
    connectors: ["CCS", "CHAdeMO", "Type2"],
    price: "$0.45/kWh",
  },
  {
    id: 2,
    name: "Shopping Mall Charging Station",
    address: "456 Commerce Avenue, District 3",
    latitude: 10.7859,
    longitude: 106.7009,
    distance: 1.2,
    status: "Available",
    power: "250 kW • Ultra Fast",
    available: "6/10 available",
    connectors: ["CCS", "Type2"],
    price: "$0.52/kWh",
  },
  {
    id: 3,
    name: "Airport Express Charge Point",
    address: "789 Airport Road, Tan Binh",
    latitude: 10.8069,
    longitude: 106.7009,
    distance: 2.5,
    status: "Occupied",
    power: "350 kW • Super Fast",
    available: "0/6 available",
    connectors: ["CCS", "CHAdeMO"],
    price: "$0.58/kWh",
  },
];
*/
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface Station {
  id: number; name: string; address: string;
  latitude: number; longitude: number;
  distance?: number; status?: string; power?: string;
  available?: string; connectors?: string[]; price?: string;
}
type SortOption = "distance" | "price" | "power" | "availability";
interface Filters {
  radius: number; connectors: string[]; availableOnly: boolean;
  minPower?: number; maxPower?: number; minPrice?: number; maxPrice?: number;
  sort: SortOption; page: number; size: number;
}
const defaultFilters: Filters = {
  radius: 5, connectors: [], availableOnly: false,
  minPower: 0, maxPower: 350, minPrice: 0, maxPrice: 10,
  sort: "distance", page: 0, size: 50,
};

const StationMap = () => {
  const navigate = useNavigate();

  // data
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // applied filters
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);

  // UI state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // filter popovers
  const [showPrice, setShowPrice] = useState(false);
  const [showPower, setShowPower] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // draft values for popovers
  const [priceMax, setPriceMax] = useState(appliedFilters.maxPrice ?? 1);
  const [minPower, setMinPower] = useState(appliedFilters.minPower ?? 0);
  const [draftConnectors, setDraftConnectors] = useState<string[]>(appliedFilters.connectors ?? []);
  const [availableOnly, setAvailableOnly] = useState(appliedFilters.availableOnly ?? false);

  // geolocation & first fetch
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        setUserPosition([lat, lon]);
        fetchStations(appliedFilters, lat, lon);
        if (mapRef.current) mapRef.current.setView([lat, lon], 13);
      },
      (err) => {
        console.error("Geolocation error:", err);
        // Fallback dùng mock + center HCMC
        const fallback: [number, number] = [10.7769, 106.7009];
        setUserPosition(fallback);
        setStations([]);
        if (mapRef.current) mapRef.current.setView(fallback, 13);
        alert("Không lấy được vị trí hiện tại, hãy bật GPS.");
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when filters applied
  useEffect(() => {
    if (!userPosition) return;
    fetchStations(appliedFilters, userPosition[0], userPosition[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const fetchStations = async (filters: Filters, lat?: number, lon?: number) => {
    if (lat == null || lon == null) return;
    setLoading(true);
    try {
      const payload = {
        latitude: lat, longitude: lon,
        radius: filters.radius, connectors: filters.connectors,
        availableOnly: filters.availableOnly, minPower: filters.minPower, maxPower: filters.maxPower,
        minPrice: filters.minPrice, maxPrice: filters.maxPrice,
        sort: filters.sort, page: filters.page, size: filters.size,
      };
      const { data } = await api.post<Station[]>("/charging-stations/nearby", payload);
      setStations(data);
    } catch (e) {
      console.error("Fetch stations error:", e);
      setStations([]);
      alert("Không thể tải danh sách trạm sạc, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = (c: string) => {
    setDraftConnectors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const applyAllFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      maxPrice: Number(priceMax),
      minPower,
      connectors: draftConnectors,
      availableOnly,
      page: 0,
    }));
    setShowPrice(false); setShowPower(false); setShowConnector(false); setShowMore(false);
  };

  const clearAll = () => {
    setPriceMax(1); setMinPower(0); setDraftConnectors([]); setAvailableOnly(false);
    setAppliedFilters(defaultFilters);
  };

  const navigateToStation = (station: Station) => {
    if (mapRef.current) mapRef.current.setView([station.latitude, station.longitude], 17, { animate: true });
  };

  // heights: header(60) + filters(56) = 116
  const viewportMinusBars = "calc(100vh - 116px)";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm h-[60px]">
        <div className="px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative w-[28rem] max-w-[70vw]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search charging stations..."
                className="pl-10 pr-4 h-11 rounded-full border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center">
                <span className="text-xs font-semibold">ME</span>
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* FILTERS BAR */}
      <div className="bg-white border-b h-14 flex items-center gap-3 px-6 sticky top-[60px] z-50">
        {/* PRICE */}
        <div className="relative">
          <Button
            variant="outline" size="sm" className="rounded-full border-slate-200"
            onClick={() => { setShowPrice(v => !v); setShowPower(false); setShowConnector(false); setShowMore(false); }}
          >
            Up to ${Number(appliedFilters.maxPrice ?? 1).toFixed(2)}/kWh
            {Number(appliedFilters.maxPrice) !== defaultFilters.maxPrice && (
              <Badge className="ml-2 rounded-full w-5 h-5 p-0 grid place-items-center">1</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          {showPrice && (
            <div className="absolute top-full mt-2 bg-white border rounded-xl shadow-lg p-4 w-80 z-[1000]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Price Range</p>
                <button onClick={() => setShowPrice(false)}><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Max price per kWh</p>
              <input type="range" min={0} max={1} step={0.05} value={priceMax}
                onChange={(e) => setPriceMax(parseFloat(e.target.value))} className="w-full" />
              <div className="mt-1 text-sm">${Number(priceMax).toFixed(2)}</div>
              <div className="mt-4 text-right"><Button size="sm" onClick={applyAllFilters}>Apply</Button></div>
            </div>
          )}
        </div>

        {/* POWER */}
        <div className="relative">
          <Button
            variant="outline" size="sm" className="rounded-full border-slate-200"
            onClick={() => { setShowPower(v => !v); setShowPrice(false); setShowConnector(false); setShowMore(false); }}
          >
            Power type
            {Number(appliedFilters.minPower) > 0 && (
              <Badge className="ml-2 rounded-full w-5 h-5 p-0 grid place-items-center">1</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          {showPower && (
            <div className="absolute top-full mt-2 bg-white border rounded-xl shadow-lg p-3 w-64 z-[1000]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Minimum Power</p>
                <button onClick={() => setShowPower(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1">
                {[0, 50, 150, 250, 350].map((p) => (
                  <button key={p} onClick={() => setMinPower(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 ${minPower === p ? "bg-teal-500 text-white" : ""}`}>
                    {p === 0 ? "Any" : `${p}kW+`}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-right"><Button size="sm" onClick={applyAllFilters}>Apply</Button></div>
            </div>
          )}
        </div>

        {/* CONNECTORS */}
        <div className="relative">
          <Button
            variant="outline" size="sm" className="rounded-full border-slate-200"
            onClick={() => { setShowConnector(v => !v); setShowPrice(false); setShowPower(false); setShowMore(false); }}
          >
            Connectors
            {draftConnectors.length > 0 && (
              <Badge className="ml-2 rounded-full w-5 h-5 p-0 grid place-items-center">{draftConnectors.length}</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          {showConnector && (
            <div className="absolute top-full mt-2 bg-white border rounded-xl shadow-lg p-4 w-72 z-[1000]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Connector Types</p>
                <button onClick={() => setShowConnector(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {["CCS", "CHAdeMO", "Type2", "AC"].map((c) => {
                  const checked = draftConnectors.includes(c);
                  return (
                    <label key={c} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100">
                      <input type="checkbox" checked={checked} onChange={() => toggleConnector(c)} />
                      <span className="text-sm">{c}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 text-right"><Button size="sm" onClick={applyAllFilters}>Apply</Button></div>
            </div>
          )}
        </div>

        {/* MORE */}
        <div className="relative">
          <Button
            variant="outline" size="sm" className="rounded-full border-slate-200"
            onClick={() => { setShowMore(v => !v); setShowPrice(false); setShowPower(false); setShowConnector(false); }}
          >
            More filters
            {availableOnly && (<Badge className="ml-2 rounded-full w-5 h-5 p-0 grid place-items-center">1</Badge>)}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          {showMore && (
            <div className="absolute top-full mt-2 bg-white border rounded-xl shadow-lg p-4 w-80 z-[1000]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Additional Filters</p>
                <button onClick={() => setShowMore(false)}><X className="w-4 h-4" /></button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                <span className="text-sm">Show available only</span>
              </label>
              <div className="mt-3 text-right"><Button size="sm" onClick={applyAllFilters}>Apply</Button></div>
            </div>
          )}
        </div>

        {(appliedFilters.maxPrice !== defaultFilters.maxPrice ||
          (appliedFilters.minPower ?? 0) > 0 ||
          (appliedFilters.connectors?.length ?? 0) > 0 ||
          appliedFilters.availableOnly) && (
            <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full px-3" onClick={clearAll}>
              Clear all
            </Button>
          )}
      </div>

      {/* MAIN SPLIT (fixed width sidebar, no resize) */}
      <div className="relative flex-1 flex overflow-hidden select-none">
        {/* LEFT LIST  */}
        <div
          className={`bg-white border-r transition-[width] duration-200 ease-out ${isCollapsed ? "w-0" : "w-[45vw]"
            }`}
          style={{ height: viewportMinusBars }}
        >
          {/* Header inside list */}
          <div className={`${isCollapsed ? "hidden" : "block"} h-full flex flex-col`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground">Over {stations.length} charging stations</h2>
              <Badge variant="secondary">Stations within {appliedFilters.radius}km</Badge>
            </div>

            <div className="px-4 pb-3 text-sm text-muted-foreground flex items-center gap-2">
              <span>Last updated: {loading ? "loading..." : "a few seconds ago"}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Real-time data</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
              {stations.map((station) => (
                <Card
                  key={station.id}
                  className="cursor-pointer rounded-2xl border-slate-200 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,.08)]"
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-48 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-green-100 grid place-items-center">
                      <span className="text-xs text-muted-foreground">Station preview</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground mb-0.5">
                            {(station.distance as any)?.toFixed?.(1) ?? station.distance ?? "—"} km away
                          </p>
                          <h3 className="font-semibold text-base truncate">{station.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{station.address}</p>
                        </div>
                        <Badge
                          variant={station.status === "Available" ? "default" : "secondary"}
                          className={station.status === "Available" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}
                        >
                          {station.status ?? "—"}
                        </Badge>
                      </div>

                      <div className="space-y-2 my-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-blue-600">{station.power ?? ""}</span>
                          <span className="text-muted-foreground">• {station.available ?? ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(station.connectors ?? []).map((c) => (
                            <Badge key={c} variant="outline" className="text-[11px] rounded-full">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="font-semibold">{station.price ?? ""}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Bookmark className="w-4 h-4 mr-1" />
                          Book Station
                        </Button>
                        <Button variant="default" size="sm" className="flex-1" onClick={() => navigateToStation(station)}>
                          <Navigation className="w-4 h-4 mr-1" />
                          Navigate
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedStation(station)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT – MAP */}
        <div className="flex-1 relative bg-muted/30 z-0" style={{ height: viewportMinusBars }}>
          {/* Nút split ở GÓC TRÊN-TRÁI */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="absolute top-4 left-4 z-[500] rounded-xl shadow-md bg-white/95 hover:bg-white px-2 py-2"
            aria-label={isCollapsed ? "Open list" : "Close list"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Map – không có zoom control */}
          <MapContainer
            center={[10.8618942110713, 106.79798794919327]}
            zoom={13}
            scrollWheelZoom
            zoomControl={false}
            ref={mapRef}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPosition && (
              <Marker position={userPosition} icon={userIcon}>
                <Popup>📍 You are here</Popup>
              </Marker>
            )}
            {stations.map((s) => (
              <Marker
                key={s.id}
                position={[s.latitude, s.longitude]}
                eventHandlers={{
                  click: () => setSelectedStation(s),
                }}
              >
                <Popup>
                  <div>
                    <strong>{s.name}</strong><br />
                    {s.address}<br />
                    <span>{s.available}</span><br />
                    <span>{s.power}</span><br />
                    <span>{s.price}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );

};
<Dialog open={!!selectedStation} onOpenChange={() => setSelectedStation(null)}>
  <DialogContent className="max-w-lg">
    {selectedStation && (
      <>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{selectedStation.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{selectedStation.address}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>⚡ Power:</span>
            <span>{selectedStation.power}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>💰 Price:</span>
            <span>{selectedStation.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Availability:</span>
            <span>{selectedStation.available}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-500 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? "fill-yellow-500" : "fill-gray-300"}`}
              />
            ))}
            <span className="ml-2 text-xs text-gray-500">(4.0 / 5)</span>
          </div>

          <textarea
            placeholder="Viết đánh giá của bạn..."
            className="w-full border rounded-md p-2 text-sm mt-2"
          ></textarea>

          <Button className="w-full mt-2">Gửi đánh giá</Button>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
export default StationMap;
