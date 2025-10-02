import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Filter, Navigation, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ===== Leaflet imports =====
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from "leaflet";
// fix default icon paths for Vite/webpack so markers appear
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
// ===========================

const userIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png", // icon user
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

interface Station {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distance?: number;
    status?: string;
    power?: string;
    available?: string;
    connectors?: string[];
    price?: string;
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

const defaultFilters: Filters = {
    radius: 5,
    connectors: [],
    availableOnly: false,
    minPower: 0,
    maxPower: 350,
    minPrice: 0,
    maxPrice: 10,
    sort: "distance",
    page: 0,
    size: 50
};
const StationMap = () => {
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);
    const navigate = useNavigate();
    const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
    const mapRef = useRef<L.Map | null>(null);

    // filters: appliedFilters used for fetching; filtersDraft used in panel
    const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
    const [filtersDraft, setFiltersDraft] = useState<Filters>(defaultFilters);

    // panel visibility
    const [showFilters, setShowFilters] = useState(false);

    // get count of active filters for badge on button (simple heuristic)
    const activeFiltersCount = (() => {
        let c = 0;
        if (filtersDraft.radius !== defaultFilters.radius) c++;
        if ((filtersDraft.connectors ?? []).length > 0) c += filtersDraft.connectors.length;
        if (filtersDraft.availableOnly) c++;
        if ((filtersDraft.minPower ?? 0) !== defaultFilters.minPower) c++;
        if ((filtersDraft.maxPower ?? 350) !== defaultFilters.maxPower) c++;
        if ((filtersDraft.minPrice ?? 0) !== defaultFilters.minPrice) c++;
        if ((filtersDraft.maxPrice ?? 10) !== defaultFilters.maxPrice) c++;
        if (filtersDraft.sort !== defaultFilters.sort) c++;
        return c;
    })();

    // initial geolocation and first fetch
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setUserPosition([lat, lon]);
                // fetch using appliedFilters (default radius=5)
                fetchStations(appliedFilters, lat, lon);
                // center map if ready
                if (mapRef.current) {
                    mapRef.current.setView([lat, lon], 13);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Không lấy được vị trí hiện tại, hãy bật GPS.");
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // whenever appliedFilters changes and we have userPosition -> fetch
    useEffect(() => {
        if (!userPosition) return;
        fetchStations(appliedFilters, userPosition[0], userPosition[1]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    // core fetch function
    const fetchStations = async (filters: Filters, lat?: number, lon?: number) => {
        if (lat == null || lon == null) return;
        setLoading(true);

        try {
            const payload = {
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
                size: filters.size
            };

            const { data } = await api.post<Station[]>("/charging-stations/nearby", payload);
            setStations(data);
        } catch (error) {
            console.error("Fetch stations error:", error);
            alert("Không thể tải danh sách trạm sạc, vui lòng thử lại!");
            setStations([]);
        } finally {
            setLoading(false);
        }
    };

    // apply & reset handlers
    const handleApplyFilters = () => {
        // set applied filters -> useEffect will trigger fetch
        setAppliedFilters(prev => ({ ...prev, ...filtersDraft, page: 0 }));
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setFiltersDraft(defaultFilters);
    };

    // toggle connector helper
    const toggleConnector = (c: string) => {
        setFiltersDraft(prev => {
            const next = prev.connectors.includes(c) ? prev.connectors.filter(x => x !== c) : [...prev.connectors, c];
            return { ...prev, connectors: next };
        });
    };

    // helper: navigate map to station
    const navigateToStation = (station: Station) => {
        if (mapRef.current) {
            mapRef.current.setView([station.latitude, station.longitude], 17, { animate: true });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
            {/* Header */}
            <header className="bg-background/95 backdrop-blur border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">ChargeStation Map</h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Real-time
                        </Badge>
                        <Button variant="ghost" size="icon">
                            <Search className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Navigation className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                {/* Search Bar */}
                <div className="flex space-x-2 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by location, station name, or features..."
                            className="pl-10"
                        />
                    </div>

                    {/* Filters Button (with badge count) */}
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(true)}
                            aria-expanded={showFilters}
                            aria-controls="filter-panel"
                            className="relative"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium leading-none text-white bg-blue-600 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* FILTER PANEL (slide-over) */}
                {showFilters && (
                    <div
                        id="filter-panel"
                        role="dialog"
                        aria-modal="true"
                        className="fixed inset-0 z-50 flex"
                        onClick={() => setShowFilters(false)} // click backdrop thì tắt
                    >
                        {/* backdrop */}
                        <div className="absolute inset-0 bg-black/30" />

                        {/* panel */}
                        <div
                            className="ml-auto w-full max-w-md bg-white h-full shadow-xl p-4 overflow-auto relative z-50"
                            onClick={(e) => e.stopPropagation()} // chặn click trong panel
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Filters</h3>
                                <button
                                    aria-label="Close filters"
                                    onClick={() => setShowFilters(false)}
                                    className="text-muted-foreground"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Radius */}
                            <div className="mb-4">
                                <label className="block text-sm mb-1">
                                    Radius: <span className="font-medium">{filtersDraft.radius} km</span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={20}
                                    value={filtersDraft.radius}
                                    onChange={(e) =>
                                        setFiltersDraft((prev) => ({
                                            ...prev,
                                            radius: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>1km</span>
                                    <span>20km</span>
                                </div>
                            </div>

                            {/* Connectors */}
                            <div className="mb-4">
                                <label className="block text-sm mb-1">Connectors</label>
                                <div className="flex flex-wrap gap-2">
                                    {["CCS", "CHAdeMO", "Type2", "AC"].map((c) => {
                                        const active = filtersDraft.connectors.includes(c);
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => toggleConnector(c)}
                                                className={`px-2 py-1 rounded text-sm border ${active
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-muted-foreground"
                                                    }`}
                                            >
                                                {c}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="mb-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filtersDraft.availableOnly}
                                        onChange={(e) =>
                                            setFiltersDraft((prev) => ({
                                                ...prev,
                                                availableOnly: e.target.checked,
                                            }))
                                        }
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Available only</span>
                                </label>
                            </div>

                            {/* Sort */}
                            <div className="mb-6">
                                <label className="block text-sm mb-1">Sort by</label>
                                <select
                                    value={filtersDraft.sort}
                                    onChange={(e) =>
                                        setFiltersDraft((prev) => ({
                                            ...prev,
                                            sort: e.target.value as SortOption,
                                        }))
                                    }
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="distance">Distance</option>
                                    <option value="price">Price</option>
                                    <option value="power">Max Power</option>
                                    <option value="availability">Availability</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 rounded border"
                                >
                                    Reset
                                </button>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="px-4 py-2 rounded border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="px-4 py-2 rounded bg-blue-600 text-white"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    <Card className="h-[500px]">
                        <CardContent className="h-full p-0 relative">
                            <MapContainer
                                center={[10.8618942110713, 106.79798794919327]}
                                zoom={13}
                                scrollWheelZoom={true}
                                className="w-full h-full rounded-lg z-0"
                                ref={mapRef}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {userPosition && (
                                    <Marker position={userPosition} icon={userIcon}>
                                        <Popup>📍 Bạn đang ở đây</Popup>
                                    </Marker>
                                )}
                                {stations.map((station) => (
                                    <Marker
                                        key={station.id}
                                        position={[station.latitude, station.longitude]}
                                    >
                                        <Popup>
                                            <div>
                                                <strong>{station.name}</strong> <br />
                                                {station.address} <br />
                                                <span>{station.available}</span> <br />
                                                <span>{station.power}</span> <br />
                                                <span>{station.price}</span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </CardContent>
                    </Card>

                    {/* Stations List */}
                    <Card className="h-[500px]">
                        <CardContent className="p-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold">Nearby Charging Stations</h2>
                                <Badge variant="secondary">Stations within {appliedFilters.radius}km</Badge>
                            </div>

                            <div className="text-sm text-muted-foreground flex items-center space-x-2 mb-3">
                                <span>Last updated: {loading ? "loading..." : "a few seconds ago"}</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Real-time data</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {stations.map((station) => (
                                    <Card key={station.id} className="hover:shadow-md transition-shadow h-[200px] flex">
                                        <CardContent className="p-4 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{station.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{station.address}</p>
                                                </div>
                                                <Badge
                                                    variant={station.status === "Available" ? "default" : "secondary"}
                                                    className={
                                                        station.status === "Available"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }
                                                >
                                                    {station.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-green-600 font-medium">{station.available}</span>
                                                    <span className="text-blue-600 font-medium">{station.power}</span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex space-x-1">
                                                        <span className="text-muted-foreground">Connectors:</span>
                                                        {(station.connectors ?? []).map((connector) => (
                                                            <Badge key={connector} variant="outline" className="text-xs">
                                                                {connector}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <span className="font-medium">{station.price}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => navigate("/booking", { state: { station } })}
                                                >
                                                    <Bookmark className="w-4 h-4 mr-1" />
                                                    Book Station
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => navigateToStation(station)}
                                                >
                                                    <Navigation className="w-4 h-4 mr-1" />
                                                    Navigate
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StationMap;
