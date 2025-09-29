import { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Navigation, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Station {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distance: number;
}
const StationMap = () => {
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
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
                    console.log("Stations from BE:", data);
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

    // const stations = [
    //     {
    //         id: 1,
    //         name: "Downtown Station #3",
    //         distance: "0.2 km away",
    //         available: "4/6 Available",
    //         status: "Available",
    //         power: "150kW • Fast Charging",
    //         connectors: ["CCS", "CHAdeMO"],
    //         price: "$0.45/kWh",
    //         updated: "1 min ago",
    //         live: true
    //     },
    //     {
    //         id: 2,
    //         name: "Mall Station #2",
    //         distance: "0.8 km away",
    //         available: "2/4 Available",
    //         status: "Available",
    //         power: "250kW • Super Fast",
    //         connectors: ["CCS", "AC"],
    //         price: "$0.52/kWh",
    //         updated: "3 min ago",
    //         live: true
    //     },
    //     {
    //         id: 3,
    //         name: "Highway Station #7",
    //         distance: "1.2 km away",
    //         available: "0/8 Available",
    //         status: "Occupied",
    //         power: "350kW • Ultra Fast",
    //         connectors: ["CCS", "CHAdeMO"],
    //         price: "$0.58/kWh",
    //         updated: "5 min ago",
    //         live: false,
    //         offline: true

    //     }
    // ];


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
                    <Card className="h-[500px] bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="h-full p-6 flex flex-col items-center justify-center relative">
                            {/* Mock Map Background */}
                            <div className="absolute inset-4 bg-white rounded-lg shadow-inner overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-50 relative">
                                    {/* Mock location pins */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse">
                                            <div className="w-full h-full rounded-full bg-blue-400"></div>
                                        </div>
                                    </div>

                                    {/* Station markers */}
                                    <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
                                </div>
                            </div>

                            <div className="relative z-10 text-center">
                                <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
                                <p className="text-muted-foreground mb-4">Real-time charging station locations and availability</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stations List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Nearby Charging Stations</h2>
                            <Badge variant="secondary">
                                Stations within 10km
                            </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span>Last updated: 2 minutes ago</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Real-time data</span>
                        </div>

                        {/* <div className="space-y-3">
                                {stations.map((station) => (
                                    <Card key={station.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{station.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{station.}</p>
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

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-green-600 font-medium">{station.available}</span>
                                                    <span className="text-blue-600 font-medium">{station.power}</span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex space-x-1">
                                                        <span className="text-muted-foreground">Connectors:</span>
                                                        {station.connectors.map((connector) => (
                                                            <Badge key={connector} variant="outline" className="text-xs">
                                                                {connector}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <span className="font-medium">{station.price}</span>
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
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
                                                <Button variant="default" size="sm" className="flex-1">
                                                    <Navigation className="w-4 h-4 mr-1" />
                                                    Navigate
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div> */}
                        <div className="space-y-3">
                            {stations.map((station) => (
                                <Card key={station.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{station.name}</h3>
                                                <p className="text-sm text-muted-foreground">{station.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => navigate("/booking", { state: { station } })}
                                            >
                                                <Bookmark className="w-4 h-4 mr-1" />
                                                Book Station
                                            </Button>
                                            <Button variant="default" size="sm" className="flex-1">
                                                <Navigation className="w-4 h-4 mr-1" />
                                                Navigate
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationMap;