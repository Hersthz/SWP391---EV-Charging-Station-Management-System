import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from  "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  MapPin,
  Zap,
  Activity,
  AlertTriangle,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Wifi,
  Power,
  Thermometer,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react";
import StaffLayout from  "./StaffLayout";
import { useToast } from "../../components/ui/use-toast";
const StaffStationDetails = () => {
  const { toast } = useToast();

  const stationDetails = {
    id: "dt-001",
    name: "Downtown Station #1",
    location: "123 Main St, Downtown, City",
    coordinates: "40.7128° N, 74.0060° W",
    status: "online",
    installedDate: "2023-06-15",
    lastMaintenance: "2024-09-20",
    nextMaintenance: "2024-12-20",
    operatingHours: "24/7",
    
    specs: {
      totalConnectors: 6,
      totalPower: "294 kW",
      voltage: "400-800V",
      currentCapacity: "200A",
      networkProvider: "ChargeNet Pro"
    },

    performance: {
      uptime: 99.8,
      avgChargingTime: "45 min",
      totalSessions: 1247,
      totalEnergyDelivered: "12,340 kWh",
      satisfactionScore: 4.8,
      utilizationRate: 87
    },

    financials: {
      todayRevenue: 542.30,
      monthlyRevenue: 12840.50,
      yearlyRevenue: 145230.00,
      avgRevenuePerSession: 10.30
    },

    issues: [
      {
        id: 1,
        connector: "B2",
        issue: "Temperature elevated",
        severity: "Medium",
        reported: "2 hours ago",
        status: "investigating"
      },
      {
        id: 2,
        connector: "A3",
        issue: "Cable wear detected",
        severity: "Low",
        reported: "1 day ago",
        status: "scheduled"
      }
    ],

    maintenanceHistory: [
      {
        date: "2024-09-20",
        type: "Scheduled Maintenance",
        description: "Full system inspection and connector cleaning",
        technician: "Mike Rodriguez",
        duration: "3 hours",
        status: "completed"
      },
      {
        date: "2024-07-15",
        type: "Repair",
        description: "Replaced connector B2 cable",
        technician: "Sarah Chen",
        duration: "1.5 hours",
        status: "completed"
      },
      {
        date: "2024-06-01",
        type: "Scheduled Maintenance",
        description: "Quarterly inspection and software update",
        technician: "Mike Rodriguez",
        duration: "2 hours",
        status: "completed"
      }
    ]
  };

  const handleReportIssue = () => {
    toast({
      title: "Issue Reported",
      description: "Your report has been submitted to the maintenance team",
    });
  };

  const handleRequestMaintenance = () => {
    toast({
      title: "Maintenance Requested",
      description: "Maintenance request has been scheduled",
    });
  };

  return (
    <StaffLayout title="Station Details">
      {/* Station Header */}
      <Card className="mb-6 border-0 shadow-electric bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-electric">
                  <MapPin className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{stationDetails.name}</h2>
                  <p className="text-sm text-muted-foreground">{stationDetails.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stationDetails.coordinates}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <Badge className="bg-success/10 text-success border-success/20 animate-pulse">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
                <span className="text-muted-foreground">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Installed: {stationDetails.installedDate}
                </span>
                <span className="text-muted-foreground">{stationDetails.operatingHours}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReportIssue}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
              <Button onClick={handleRequestMaintenance} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                <Settings className="w-4 h-4 mr-2" />
                Request Maintenance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-success" />
              <Badge className="bg-success/10 text-success border-success/20">Excellent</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Uptime</p>
            <p className="text-3xl font-bold text-success">{stationDetails.performance.uptime}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <Badge className="bg-primary/10 text-primary border-primary/20">Total</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Sessions</p>
            <p className="text-3xl font-bold text-primary">{stationDetails.performance.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-warning" />
              <Badge className="bg-warning/10 text-warning border-warning/20">High</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Utilization</p>
            <p className="text-3xl font-bold text-warning">{stationDetails.performance.utilizationRate}%</p>
            <Progress value={stationDetails.performance.utilizationRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-secondary" />
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                Monthly
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Revenue</p>
            <p className="text-3xl font-bold text-secondary">${stationDetails.financials.monthlyRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="specifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Power className="w-5 h-5 mr-3 text-primary" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Total Connectors</span>
                  <span className="font-semibold text-primary">{stationDetails.specs.totalConnectors}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Total Power Capacity</span>
                  <span className="font-semibold text-primary">{stationDetails.specs.totalPower}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Voltage Range</span>
                  <span className="font-semibold text-foreground">{stationDetails.specs.voltage}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Current Capacity</span>
                  <span className="font-semibold text-foreground">{stationDetails.specs.currentCapacity}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Network Provider</span>
                  <span className="font-semibold text-foreground">{stationDetails.specs.networkProvider}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  Maintenance Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-semibold text-success">Last Maintenance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stationDetails.lastMaintenance}</p>
                </div>
                
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">Next Scheduled</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stationDetails.nextMaintenance}</p>
                  <p className="text-xs text-muted-foreground mt-1">In 45 days</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Maintenance Frequency</p>
                  <p className="font-semibold text-foreground">Quarterly (Every 3 months)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-card border-0 bg-gradient-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-3 text-primary" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Charging Time</p>
                    <p className="text-2xl font-bold text-primary">{stationDetails.performance.avgChargingTime}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Energy</p>
                    <p className="text-2xl font-bold text-primary">{stationDetails.performance.totalEnergyDelivered}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Satisfaction Score</p>
                    <p className="text-2xl font-bold text-warning">⭐ {stationDetails.performance.satisfactionScore}/5.0</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold text-primary">{stationDetails.performance.totalSessions}</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">Station Utilization Rate</span>
                    <span className="text-2xl font-bold text-primary">{stationDetails.performance.utilizationRate}%</span>
                  </div>
                  <Progress value={stationDetails.performance.utilizationRate} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">Above industry average (75%)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="w-5 h-5 mr-3 text-primary" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Today</p>
                  <p className="text-2xl font-bold text-success">${stationDetails.financials.todayRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold text-primary">${stationDetails.financials.monthlyRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">This Year</p>
                  <p className="text-2xl font-bold text-secondary">${stationDetails.financials.yearlyRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Avg. per Session</p>
                  <p className="text-xl font-bold text-foreground">${stationDetails.financials.avgRevenuePerSession.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-3 text-primary" />
                Active Issues ({stationDetails.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stationDetails.issues.length > 0 ? (
                <div className="space-y-3">
                  {stationDetails.issues.map((issue) => (
                    <div key={issue.id} className="p-4 bg-muted/30 border border-border/50 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-semibold">
                              Connector {issue.connector}
                            </Badge>
                            <Badge className={
                              issue.severity === "High" ? "bg-destructive/10 text-destructive border-destructive/20" :
                              issue.severity === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
                              "bg-primary/10 text-primary border-primary/20"
                            }>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="font-semibold text-foreground mb-1">{issue.issue}</p>
                          <p className="text-sm text-muted-foreground">Reported {issue.reported}</p>
                        </div>
                        <Badge className={
                          issue.status === "investigating" ? "bg-warning/10 text-warning border-warning/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        }>
                          {issue.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <p className="text-lg font-semibold text-success">No Active Issues</p>
                  <p className="text-sm text-muted-foreground">All systems operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="w-5 h-5 mr-3 text-primary" />
                Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stationDetails.maintenanceHistory.map((record, index) => (
                  <div key={index} className="p-4 bg-muted/30 border border-border/50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {record.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{record.date}</span>
                        </div>
                        <p className="font-semibold text-foreground mb-1">{record.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>👨‍🔧 {record.technician}</span>
                          <span>⏱️ {record.duration}</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StaffLayout>
  );
};

export default StaffStationDetails;
