import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { 
  Activity,
  DollarSign,
  Wifi,
  AlertTriangle,
  Eye,
  Clock,
  Zap,
  MapPin,
  WifiOff,
  TrendingUp,
  Users,
  Power,
  Battery,
  Thermometer,
  Signal
} from "lucide-react";
import StaffLayout from "../components/staff/StaffLayout";
import { useNavigate } from "react-router-dom";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Assigned Station Info
  const assignedStation = {
    id: "dt-001",
    name: "Downtown Station #1",
    location: "123 Main St, Downtown",
    status: "online",
    lastPing: "2 seconds ago",
    uptime: 99.8,
    temperature: 24,
    powerUsage: 87,
    totalConnectors: 6,
    activeConnectors: 3,
    availableConnectors: 2,
    maintenanceConnectors: 1
  };

  const recentSessions = [
    {
      id: "CS-001",
      station: "Downtown Station #1",
      connector: "A1",
      vehicle: "Tesla Model 3",
      status: "Active",
      cost: "$18.5",
      customer: "Tesla Model 3"
    },
    {
      id: "CS-003",
      station: "Mall Station #2", 
      connector: "B2",
      vehicle: "BMW iX",
      status: "Completed",
      cost: "$34.2",
      customer: "BMW iX"
    },
    {
      id: "CS-007",
      station: "Airport Station #3",
      connector: "C1", 
      vehicle: "Audi e-tron",
      status: "Payment Pending",
      cost: "$25.8",
      customer: "Audi e-tron"
    }
  ];

  const recentAlerts = [
    {
      title: "Downtown Station #1",
      message: "Connector A2 requires maintenance check",
      time: "30 minutes ago",
      priority: "High"
    },
    {
      title: "Highway Station #4", 
      message: "Station offline for 2 hours",
      time: "2 hours ago",
      priority: "Critical"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Active": { className: "bg-success/10 text-success border-success/20", text: "Active" },
      "Completed": { className: "bg-primary/10 text-primary border-primary/20", text: "Completed" },
      "Payment Pending": { className: "bg-warning/10 text-warning border-warning/20", text: "Payment Pending" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      "High": { className: "bg-warning/10 text-warning border-warning/20" },
      "Critical": { className: "bg-destructive/10 text-destructive border-destructive/20" }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge className={config.className}>
        {priority}
      </Badge>
    );
  };

  return (
    <StaffLayout title="Staff Dashboard">
      {/* Assigned Station Banner */}
      <Card className="mb-8 border-0 shadow-electric bg-gradient-to-br from-primary/10 via-background to-accent/5 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-electric">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Assigned Station</h2>
                  <p className="text-sm text-muted-foreground">Real-time monitoring & control</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-primary">{assignedStation.name}</h3>
                  <Badge className="bg-success/10 text-success border-success/20 animate-pulse">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {assignedStation.location}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Signal className="w-4 h-4 text-success" />
                    Last ping: {assignedStation.lastPing}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Uptime: {assignedStation.uptime}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:min-w-[400px]">
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Power className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="text-2xl font-bold text-success">{assignedStation.activeConnectors}</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <div className="text-2xl font-bold text-primary">{assignedStation.availableConnectors}</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Temp</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{assignedStation.temperature}°C</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-4 h-4 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">Power</span>
                </div>
                <div className="text-2xl font-bold text-accent-foreground">{assignedStation.powerUsage}%</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => navigate('/staff/stations')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Station Details
            </Button>
            <Button 
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-electric border-0 bg-gradient-to-br from-success/10 via-success/5 to-background hover-scale transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
              <Badge className="bg-success/10 text-success border-success/20">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Active Sessions</p>
            <p className="text-3xl font-bold text-success mb-2">3</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-success" />
              <span>2 charging now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-electric border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background hover-scale transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">Today</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Revenue</p>
            <p className="text-3xl font-bold text-primary mb-2">$342.50</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-success" />
              <span>+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-electric border-0 bg-gradient-to-br from-accent/10 via-accent/5 to-background hover-scale transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Total</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Customers Today</p>
            <p className="text-3xl font-bold text-accent-foreground mb-2">18</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Average wait: 5 min</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-electric border-0 bg-gradient-to-br from-warning/10 via-warning/5 to-background hover-scale transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-warning/10 text-warning border-warning/20">Alert</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Issues</p>
            <p className="text-3xl font-bold text-warning mb-2">1</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>1 requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-3 text-primary" />
                Recent Sessions
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                View All Sessions
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Latest charging sessions at your stations</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{session.station}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {session.connector} • {session.customer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0">
                    {getStatusBadge(session.status)}
                    <div className="text-sm font-medium text-primary">{session.cost}</div>
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-3 text-primary" />
                Recent Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                View All Alerts
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Maintenance and status notifications</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground mb-1 truncate">{alert.title}</div>
                      <div className="text-sm text-muted-foreground mb-2 line-clamp-2">{alert.message}</div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end flex-shrink-0">
                    {getPriorityBadge(alert.priority)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;