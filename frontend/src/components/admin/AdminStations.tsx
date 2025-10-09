import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Progress } from "../../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { 
  Power,
  Eye,
  Activity,
  Wifi,
  WifiOff,
  Wrench,
  AlertCircle,
  RefreshCw,
  Search,
  Navigation,
  Bookmark,
  Filter,
  Plus
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";

// ===== Leaflet / react-leaflet (giống user) =====
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// ================================================

// DÙNG CÙNG DATA VỚI BÊN USER 
import mockStations from "../../../stations.json";

// ===== Kiểu dữ liệu giống bên User =====
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

// ===== Kiểu cho phần bảng quản trị =====
type StationStatus = "online" | "offline" | "maintenance";

const AdminStations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ---------------------- PHẦN DỮ LIỆU CHUNG ----------------------
  // Map/List (Admin) dùng chung dataset với User để đảm bảo "trùng"
  const [userLikeStations, setUserLikeStations] = useState<Station[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | StationStatus>("all");

  // Dữ liệu bảng quản trị gốc 
  const adminTableStations = [
    {
      id: "DT-003",
      name: "Downtown Station #3",
      location: "City Center Plaza",
      status: "online",
      connectors: { active: 4, total: 6 },
      powerUsage: 156,
      utilization: 85
    },
    {
      id: "ML-002", 
      name: "Mall Station #2",
      location: "Westfield Shopping Center",
      status: "online",
      connectors: { active: 2, total: 4 },
      powerUsage: 89,
      utilization: 67
    },
    {
      id: "HW-003",
      name: "Highway Station #7", 
      location: "I-95 Rest Stop",
      status: "offline",
      connectors: { active: 0, total: 8 },
      powerUsage: 0,
      utilization: 0
    },
    {
      id: "AP-001",
      name: "Airport Station #1",
      location: "Terminal B Parking", 
      status: "maintenance",
      connectors: { active: 7, total: 10 },
      powerUsage: 203,
      utilization: 78
    }
  ] as const;

  // Load mock (giống user)
  useEffect(() => {
    setUserLikeStations(mockStations as Station[]);
  }, []);
  // ----------------------------------------------------------------

  // ====== Map logic (giống user, +fitBounds) ======
  const mapRef = useRef<L.Map | null>(null);

  const FitBoundsOnData = ({ points }: { points: Station[] }) => {
    const map = useMap();
    useEffect(() => {
      const pts = points.filter(p => !!p.latitude && !!p.longitude);
      if (!pts.length) return;
      const bounds = L.latLngBounds(pts.map(p => [p.latitude, p.longitude] as [number, number]));
      if (pts.length === 1) {
        map.setView(bounds.getCenter(), 15, { animate: true });
      } else {
        map.fitBounds(bounds.pad(0.2), { animate: true });
      }
    }, [points, map]);
    return null;
  };

  const navigateToStation = (station: Station) => {
    mapRef.current?.setView([station.latitude, station.longitude], 17, { animate: true });
  };

  // ====== Badge trạng thái cho bảng quản trị ======
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { 
        className: "bg-success/10 text-success border-success/20", 
        icon: Wifi, 
        text: "Online" 
      },
      offline: { 
        className: "bg-destructive/10 text-destructive border-destructive/20", 
        icon: WifiOff, 
        text: "Offline" 
      },
      maintenance: { 
        className: "bg-warning/10 text-warning border-warning/20", 
        icon: Wrench, 
        text: "Maintenance" 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const filteredAdminStations = useMemo(() => {
    if (statusFilter === "all") return adminTableStations;
    return adminTableStations.filter(s => s.status === statusFilter);
  }, [statusFilter, adminTableStations]);

  // ====== Hành động bảng quản trị ======
  const handleRemoteControl = (stationId: string, action: string) => {
    toast({
      title: "Remote Command Sent",
      description: `${action} command sent to station ${stationId}`,
      variant: "default"
    });
  };

  const stationActions = (
    <>
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>
      
      <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh Status
      </Button>

      <Button 
      onClick={() => navigate("/admin/add-station")}
      className="bg-green-600 text-white hover:bg-green-700"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Station
    </Button>

      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Power className="w-4 h-4 mr-2" />
        Remote Control
      </Button>
    </>
  );

  // ====== Audit log ======
  const auditLogs = [
    {
      timestamp: "2024-09-11 14:30:25",
      user: "admin@chargestation.com",
      action: "Emergency Stop",
      target: "DT-001 Connector 3", 
      result: "Success",
      reason: "Safety concern reported"
    },
    {
      timestamp: "2024-09-11 13:15:18",
      user: "tech@chargestation.com", 
      action: "Restart Station",
      target: "HW-003",
      result: "Failed",
      reason: "Hardware malfunction"
    },
    {
      timestamp: "2024-09-11 12:45:33",
      user: "admin@chargestation.com",
      action: "Enable Connector", 
      target: "ML-002 Connector 4",
      result: "Success",
      reason: "Maintenance completed"
    }
  ];

  return (
    <AdminLayout title="Station Management" actions={stationActions}>

      {/* ======= PHẦN MỚI: Map + List ======= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Map Section */}
        <Card className="h-[500px]">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Network Map
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[440px] p-0 relative">
            <MapContainer
              center={[10.8618942110713, 106.79798794919327]}
              zoom={13}
              scrollWheelZoom
              className="w-full h-full rounded-b-lg z-0"
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Fit theo toàn bộ stations */}
              <FitBoundsOnData points={userLikeStations} />

              {userLikeStations.map((station) => (
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

        {/* List Section */}
        <Card className="h-[500px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Nearby Charging Stations</CardTitle>
              <Badge variant="secondary">Stations within 10km</Badge>
            </div>
            {/* Search + Filter */}
            <div className="flex space-x-2 mt-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search by location, station name, or features..."
                  className="pl-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center space-x-2 mt-3">
              <span>Last updated: 2 minutes ago</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Real-time data</span>
            </div>
          </CardHeader>

          {/* Phần danh sách: chiếm phần còn lại, có scroll */}
          <CardContent className="pt-0 h-[calc(500px-140px)] overflow-y-auto space-y-3 pr-2">
            {userLikeStations.map((station) => (
              <Card
                key={station.id}
                className="hover:shadow-md transition-shadow h-[200px] flex"  /* cố định chiều cao mỗi item để đúng 2 item/khung */
              >
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
                      {station.live && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
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
          </CardContent>
        </Card>
      </div>
      {/* ======= HẾT PHẦN MỚI ======= */}

      {/* ===== Status Summary Cards (GIỮ NGUYÊN) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Stations</p>
                <p className="text-2xl font-bold text-success">
                  {adminTableStations.filter(s => s.status === 'online').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline Stations</p>
                <p className="text-2xl font-bold text-destructive">
                  {adminTableStations.filter(s => s.status === 'offline').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-warning">
                  {adminTableStations.filter(s => s.status === 'maintenance').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Power</p>
                <p className="text-2xl font-bold text-primary">
                  {adminTableStations.reduce((sum, s) => sum + s.powerUsage, 0)} kW
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Station Management Table (GIỮ, thêm Focus on Map) ===== */}
      <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-secondary/5 mb-8 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Power className="w-5 h-5 mr-3 text-primary" />
            Live Station Network ({filteredAdminStations.length} stations)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Station Details</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Connectors</TableHead>
                  <TableHead className="font-semibold">Power Usage</TableHead>
                  <TableHead className="font-semibold">Utilization</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdminStations.map((station) => (
                  <TableRow key={station.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{station.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {station.location}
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {station.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(station.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {station.connectors.active}/{station.connectors.total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {station.connectors.active} active
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-primary">
                          {station.powerUsage} kW
                        </div>
                        <div className="text-xs text-muted-foreground">Current load</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-24">
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="font-medium">{station.utilization}%</span>
                        </div>
                        <Progress 
                          value={station.utilization} 
                          className={`h-2 ${
                            station.utilization > 80 ? "[&>div]:bg-destructive" : 
                            station.utilization > 60 ? "[&>div]:bg-warning" : 
                            "[&>div]:bg-primary"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoteControl(station.id, "View Details")}
                          className="border-primary/20 text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {/* Nút focus map: tìm station tương ứng bên userLikeStations theo name (hoặc mapping id nếu có) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Tìm trạm theo tên (demo). Tốt nhất là đồng bộ ID giữa 2 nguồn.
                            const s = userLikeStations.find(u => u.name === station.name);
                            if (s) navigateToStation(s);
                          }}
                        >
                          Focus on Map
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Remote Command Audit Log (GIỮ) ===== */}
      <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Activity className="w-5 h-5 mr-3 text-primary" />
            Remote Command Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Target</TableHead>
                  <TableHead className="font-semibold">Result</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log, index) => (
                  <TableRow key={index} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-primary font-medium">{log.user}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.action === 'Emergency Stop' ? 'destructive' : 'outline'}
                        className="text-xs font-medium"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {log.target}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`text-xs font-medium ${
                          log.result === 'Success' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                      >
                        {log.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {log.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminStations;
