import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Filter, Navigation, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import mockStations from "../../stations.json";


// ===== Leaflet imports =====
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from "leaflet";
// fix default icon paths for Vite/webpack so markers appear
// import images so bundler can resolve paths
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// ===========================

interface Station {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distance?: number;
    updated?: string;
    status?: string;
    offline?: boolean;
    live?: boolean;
    power?: string;
    available?: string;
    connectors?: string[];
    price?: string;
}
const StationMap = () => {
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);
    const navigate = useNavigate();

    // map ref so we can control map (pan/zoom) from list buttons
    const mapRef = useRef<L.Map | null>(null);
    const USE_MOCK = true; // neu sai mock
    useEffect(() => {
        if (USE_MOCK) {
            setStations(mockStations);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                setLoading(true);
                try {
                    const { latitude, longitude } = pos.coords;
                    const { data } = await api.post<Station[]>("/charging-stations/nearby", {
                        latitude,
                        longitude,
                        radius: 10,
                    });
                    setStations(data);
                    // center map to user location if map ready
                    if (mapRef.current) {
                        mapRef.current.setView([latitude, longitude], 13);
                    }
                } catch (error) {
                    console.error("Fetch stations error:", error);
                    alert("Không thể tải danh sách trạm sạc, vui lòng thử lại!");
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Không lấy được vị trí hiện tại, hãy bật GPS.");
            }
        );
    }, []);

    // helper: navigate map to station
    const navigateToStation = (station: Station) => {
        if (mapRef.current) {
            mapRef.current.setView([station.latitude, station.longitude], 17, { animate: true });
            // open popup programmatically: find marker and open? simplest: use flyTo & rely on clicking list -> user can click marker
            // For auto-open, you'd need to keep refs for each marker.
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
                    <Button variant="outline">

                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    {/* Map Section */}
                    <Card className="h-[500px]">
                        <CardContent className="h-full p-0 relative">
                            <MapContainer
                                center={[10.8618942110713, 106.79798794919327]} // mặc định lấy từ 1 trạm hoặc location user
                                zoom={13}
                                scrollWheelZoom={true}
                                className="w-full h-full rounded-lg z-0"
                                ref={mapRef}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

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
                            {/* Header nhỏ + trạng thái */}
                            <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Nearby Charging Stations</h2>
                            <Badge variant="secondary">Stations within 10km</Badge>
                            </div>

                            <div className="text-sm text-muted-foreground flex items-center space-x-2 mb-3">
                            <span>Last updated: 2 minutes ago</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Real-time data</span>
                            </div>

                            {/* Danh sách: chiếm phần còn lại, có scroll */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {stations.map((station) => (
                                <Card key={station.id} className="hover:shadow-md transition-shadow h-[200px] flex">
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{station.name}</h3>
                                        <p className="text-sm text-muted-foreground">{station.address}</p>
                                        <p className="text-xs text-muted-foreground">Updated: {station.updated}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                        variant={station.status === "Available" ? "default" : "secondary"}
                                        className={
                                            station.status === "Available"
                                            ? "bg-green-100 text-green-800"
                                            : station.offline
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }
                                        >
                                        {station.offline ? "Offline" : station.status}
                                        </Badge>
                                        {station.live && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                                    </div>
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
                                        disabled={station.offline}
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