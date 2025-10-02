import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Activity,
  DollarSign,
  Wifi,
  AlertTriangle,
  Eye,
  Clock,
  Zap
} from "lucide-react";
import StaffLayout from "../components/staff/StaffLayout";

const StaffDashboard = () => {
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
    <StaffLayout title="Welcome back, John Anderson!">
      {/* Welcome Banner */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white mb-8 shadow-electric">
        <h2 className="text-xl font-bold mb-2">Welcome back, John Anderson!</h2>
        <p className="text-primary-foreground/80">You have 8 active charging sessions across 3 stations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-success">8</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-primary">$1240.50</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Stations</p>
                <p className="text-2xl font-bold text-accent-foreground">3/4</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-warning">3</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
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