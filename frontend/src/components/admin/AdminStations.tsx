import { useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import AdminLayout from "./AdminLayout";

const AdminStations = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const stations = [
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
  ];

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

  const handleRemoteControl = (stationId: string, action: string) => {
    toast({
      title: "Remote Command Sent",
      description: `${action} command sent to station ${stationId}`,
      variant: "default"
    });
  };

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

  const filteredStations = statusFilter === "all" 
    ? stations 
    : stations.filter(station => station.status === statusFilter);

  const stationActions = (
    <>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Power className="w-4 h-4 mr-2" />
        Remote Control
      </Button>
    </>
  );

  return (
    <AdminLayout title="Station Management" actions={stationActions}>
      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Stations</p>
                <p className="text-2xl font-bold text-success">
                  {stations.filter(s => s.status === 'online').length}
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
                  {stations.filter(s => s.status === 'offline').length}
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
                  {stations.filter(s => s.status === 'maintenance').length}
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
                  {stations.reduce((sum, s) => sum + s.powerUsage, 0)} kW
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Management Table */}
      <Card className="hadow-card border-0 bg-gradient-to-br from-primary/5 to-secondary/5 mb-8 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Power className="w-5 h-5 mr-3 text-primary" />
            Live Station Network ({filteredStations.length} stations)
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
                {filteredStations.map((station) => (
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
                    <TableCell>
                      {getStatusBadge(station.status)}
                    </TableCell>
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
                            station.utilization > 80 ? '[&>div]:bg-destructive' : 
                            station.utilization > 60 ? '[&>div]:bg-warning' : 
                            '[&>div]:bg-primary'
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Remote Command Audit Log */}
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