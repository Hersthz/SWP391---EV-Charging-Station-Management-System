import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Power,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  Thermometer,
  Signal,
  Battery,
  MapPin
} from "lucide-react";
import StaffLayout from "./StaffLayout";
import { useToast } from "../../components/ui/use-toast";
import StationMap from "../../pages/StationMap";

const StaffStationMonitor = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stationStatus, setStationStatus] = useState("online");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stationData = {
    id: "dt-001",
    name: "Downtown Station #1",
    location: "123 Main St, Downtown",
    status: stationStatus,
    lastPing: "2 seconds ago",
    uptime: 99.8,
    temperature: 24,
    powerUsage: 87,
    voltage: 400,
    current: 125,
    totalEnergy: 1234.5,
    totalRevenue: 4521.30,
    connectors: [
      {
        id: "A1",
        type: "Type 2",
        power: "22 kW",
        status: "charging",
        customer: "John Doe - Tesla Model 3",
        phone: "+84 123 456 789",
        startTime: new Date(Date.now() - 3600000),
        energy: 23.4,
        cost: 15.2,
        progress: 75,
        estimatedTime: 25,
        voltage: 400,
        current: 32,
        temperature: 28
      },
      {
        id: "A2",
        type: "CCS",
        power: "50 kW",
        status: "available",
        customer: null,
        phone: null,
        startTime: null,
        energy: 0,
        cost: 0,
        progress: 0,
        estimatedTime: null,
        voltage: 400,
        current: 0,
        temperature: 22
      },
      {
        id: "A3",
        type: "Type 2",
        power: "22 kW",
        status: "charging",
        customer: "Sarah Chen - BMW iX",
        phone: "+84 987 654 321",
        startTime: new Date(Date.now() - 1800000),
        energy: 38.2,
        cost: 24.8,
        progress: 60,
        estimatedTime: 40,
        voltage: 400,
        current: 32,
        temperature: 26
      },
      {
        id: "B1",
        type: "CCS",
        power: "150 kW",
        status: "available",
        customer: null,
        phone: null,
        startTime: null,
        energy: 0,
        cost: 0,
        progress: 0,
        estimatedTime: null,
        voltage: 800,
        current: 0,
        temperature: 23
      },
      {
        id: "B2",
        type: "CHAdeMO",
        power: "50 kW",
        status: "maintenance",
        customer: null,
        phone: null,
        startTime: null,
        energy: 0,
        cost: 0,
        progress: 0,
        estimatedTime: null,
        voltage: 0,
        current: 0,
        temperature: 21
      },
      {
        id: "B3",
        type: "Type 2",
        power: "22 kW",
        status: "available",
        customer: null,
        phone: null,
        startTime: null,
        energy: 0,
        cost: 0,
        progress: 0,
        estimatedTime: null,
        voltage: 400,
        current: 0,
        temperature: 22
      }
    ],
    recentAlerts: [
      {
        time: "5 min ago",
        type: "warning",
        message: "Connector B2 temperature elevated (35°C)",
        priority: "Medium"
      },
      {
        time: "30 min ago",
        type: "info",
        message: "Charging session completed - Connector A1",
        priority: "Low"
      },
      {
        time: "1 hour ago",
        type: "warning",
        message: "Power usage exceeded 90%",
        priority: "Medium"
      }
    ],
    activityLog: [
      { time: "15:45", event: "Session started", connector: "A3", user: "Sarah Chen" },
      { time: "15:30", event: "Session completed", connector: "A1", user: "Mike Rodriguez" },
      { time: "15:15", event: "Session started", connector: "A1", user: "John Doe" },
      { time: "14:50", event: "Issue reported", connector: "B2", user: "Staff" },
      { time: "14:30", event: "Session completed", connector: "B1", user: "Anna Smith" }
    ]
  };

  const getConnectorStatusBadge = (status: string) => {
    const configs = {
      charging: {
        className: "bg-success/10 text-success border-success/20",
        icon: Activity,
        text: "Charging"
      },
      available: {
        className: "bg-primary/10 text-primary border-primary/20",
        icon: CheckCircle,
        text: "Available"
      },
      maintenance: {
        className: "bg-warning/10 text-warning border-warning/20",
        icon: AlertTriangle,
        text: "Maintenance"
      },
      offline: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: WifiOff,
        text: "Offline"
      }
    };

    const config = configs[status as keyof typeof configs];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDuration = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <StaffLayout title="Station Monitoring">
      {/* MAP – tái sử dụng component StationMap */}
      <Card className="mb-6 border-0 shadow-electric">
        <CardHeader>
          <CardTitle className="p-0 overflow-hidden">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            Stations Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Chiều cao cố định để Leaflet hiển thị */}
                <div className="h-[520px] w-full">
                  <StationMap />
                </div>
        </CardContent>
      </Card>
      {/* Station Header */}
      <Card className="mb-6 border-0 shadow-electric bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-electric">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{stationData.name}</h2>
                  <p className="text-sm text-muted-foreground">{stationData.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge className="bg-success/10 text-success border-success/20 animate-pulse">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
                <span className="text-muted-foreground">Last ping: {stationData.lastPing}</span>
                <span className="text-muted-foreground">Uptime: {stationData.uptime}%</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Thermometer className="w-8 h-8 text-primary" />
              <Badge className="bg-primary/10 text-primary border-primary/20">Normal</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Temperature</p>
            <p className="text-3xl font-bold text-primary">{stationData.temperature}°C</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-accent/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Battery className="w-8 h-8 text-accent-foreground" />
              <Badge className="bg-warning/10 text-warning border-warning/20">High</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Power Usage</p>
            <p className="text-3xl font-bold text-accent-foreground">{stationData.powerUsage}%</p>
            <Progress value={stationData.powerUsage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-8 h-8 text-success" />
              <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Energy</p>
            <p className="text-3xl font-bold text-success">{stationData.totalEnergy.toFixed(1)} kWh</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                Today
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Revenue</p>
            <p className="text-3xl font-bold text-primary">${stationData.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connectors Grid */}
        <div className="lg:col-span-2">
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Power className="w-5 h-5 mr-3 text-primary" />
                Connectors Status ({stationData.connectors.length} units)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stationData.connectors.map((connector) => (
                  <Card key={connector.id} className="bg-muted/20 border border-border/50 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Power className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">Connector {connector.id}</div>
                            <div className="text-xs text-muted-foreground">{connector.type} • {connector.power}</div>
                          </div>
                        </div>
                        {getConnectorStatusBadge(connector.status)}
                      </div>

                      {connector.status === "charging" && connector.customer && (
                        <div className="space-y-3">
                          <div className="bg-background/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">{connector.customer}</span>
                            </div>
                            {connector.phone && (
                              <div className="text-xs text-muted-foreground pl-6">{connector.phone}</div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                              <Clock className="w-3 h-3" />
                              Started: {formatDuration(connector.startTime!)} ago
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold text-success">{connector.progress}%</span>
                            </div>
                            <Progress value={connector.progress} className="h-2" />
                            <div className="text-xs text-center text-muted-foreground">
                              Est. completion: {connector.estimatedTime} min
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-background/50 rounded p-2">
                              <div className="text-muted-foreground">Energy</div>
                              <div className="font-semibold text-primary">{connector.energy} kWh</div>
                            </div>
                            <div className="bg-background/50 rounded p-2">
                              <div className="text-muted-foreground">Cost</div>
                              <div className="font-semibold text-primary">${connector.cost}</div>
                            </div>
                            <div className="bg-background/50 rounded p-2">
                              <div className="text-muted-foreground">Temp</div>
                              <div className="font-semibold text-foreground">{connector.temperature}°C</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {connector.status === "available" && (
                        <div className="text-sm text-center py-4 text-muted-foreground">
                          Ready for charging
                        </div>
                      )}

                      {connector.status === "maintenance" && (
                        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 text-warning">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">Under Maintenance</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Connector unavailable for use
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Alerts & Activity */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-3 text-primary" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {stationData.recentAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.type === 'warning' ? 'text-warning' : 'text-primary'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground mb-1">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                            <Badge variant="outline" className="text-xs">{alert.priority}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Activity className="w-5 h-5 mr-3 text-primary" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {stationData.activityLog.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.event}</p>
                        <p className="text-xs text-muted-foreground">{log.connector} • {log.user}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffStationMonitor;
