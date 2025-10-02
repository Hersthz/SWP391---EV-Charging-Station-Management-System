
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Battery,
  Users,
  MapPin
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import AdminLayout from "../components/admin/AdminLayout";

const AdminDashboard = () => {

  const revenueData = [
    { name: 'Jan', revenue: 47000, sessions: 1200 },
    { name: 'Feb', revenue: 53000, sessions: 1350 },
    { name: 'Mar', revenue: 48000, sessions: 1180 },
    { name: 'Apr', revenue: 61000, sessions: 1520 },
    { name: 'May', revenue: 58000, sessions: 1450 },
    { name: 'Jun', revenue: 76000, sessions: 2000 }
  ];

  const alerts = [
    {
      id: 1,
      type: "error",
      message: "Station DT-003 offline for 2 hours",
      time: "15 min ago",
      priority: "high"
    },
    {
      id: 2,
      type: "warning", 
      message: "Low utilization at Airport Station #1",
      time: "1 hour ago",
      priority: "medium"
    },
    {
      id: 3,
      type: "success",
      message: "Scheduled maintenance completed at Mall Station #2",
      time: "3 hours ago",
      priority: "low"
    }
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">$76,234</p>
                <p className="text-sm text-success font-medium">+12.5% from last month</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">12,543</p>
                <p className="text-sm text-primary font-medium">+8.2% from last month</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Stations</p>
                <p className="text-2xl font-bold text-foreground">47/52</p>
                <p className="text-sm text-destructive font-medium">5 stations offline</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center shadow-sm">
                <MapPin className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Energy Delivered</p>
                <p className="text-2xl font-bold text-foreground">1.8 MWh</p>
                <p className="text-sm text-secondary font-medium">+15.3% from last month</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shadow-sm">
                <Battery className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-3 text-primary" />
            Revenue & Sessions
            </CardTitle>
        </CardHeader>

        <CardContent>
            <div className="h-80 rounded-xl bg-gradient-section p-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={revenueData}
                barSize={42}
                margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
                >
                {/* Gradient for bars */}
                <defs>
                    <linearGradient id="bar-primary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`hsl(var(--primary))`} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={`hsl(var(--primary))`} stopOpacity={0.75} />
                    </linearGradient>
                </defs>

                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                    dataKey="name"
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground) / 0.6)"
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground) / 0.6)"
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                />

                <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                    contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: number, name) => {
                    if (name === "revenue") return [`$${value.toLocaleString()}`, "Revenue"];
                    if (name === "sessions") return [value.toLocaleString(), "Sessions"];
                    return [value, name];
                    }}
                />

                {/* main series */}
                <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="url(#bar-primary)"
                    radius={[10, 10, 0, 0]}
                    animationDuration={700}
                />
                {/* uncomment nếu muốn hiển thị sessions chồng cạnh nhau
                <Bar
                    dataKey="sessions"
                    name="Sessions"
                    fill="hsl(var(--secondary))"
                    radius={[10, 10, 0, 0]}
                    animationDuration={700}
                />
                */}
                </BarChart>
            </ResponsiveContainer>
            </div>
        </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-card border-0 bg-gradient-to-br from-accent/5 to-success/5">
        <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
            <AlertTriangle className="w-5 h-5 mr-3 text-warning" />
            Recent Alerts
            </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
            {alerts.map((a) => {
            const palette =
                a.type === "error"
                ? { dot: "bg-destructive", side: "bg-destructive/60" }
                : a.type === "warning"
                ? { dot: "bg-warning", side: "bg-warning/60" }
                : { dot: "bg-success", side: "bg-success/60" };

            return (
                <div
                key={a.id}
                className={`
                    relative overflow-hidden rounded-2xl border border-border/60 
                    bg-card/70 
                    shadow-sm
                    hover:shadow-lg hover:scale-[1.02] 
                    transition-all duration-200 ease-out
                    p-4 pl-5
                `}
                >
                {/* side status bar */}
                <div className={`absolute left-0 top-0 h-full w-1.5 ${palette.side}`} />

                <div className="flex items-start gap-4">
                    <span className={`mt-1 h-3 w-3 rounded-full ${palette.dot}`} />
                    <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.message}</p>

                    <div className="mt-2 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {a.time}
                        </span>

                        <Badge
                        variant={
                            a.priority === "high" ? "destructive" :
                            a.priority === "medium" ? "secondary" : "outline"
                        }
                        className="text-xs px-2 py-0.5 rounded-full"
                        >
                        {a.priority}
                        </Badge>
                    </div>
                    </div>
                </div>
                </div>
            );
            })}
        </CardContent>
        </Card>
      </div>    

      {/* Station Status Overview */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            Station Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-success/5 to-success/10 border border-success/20">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div className="text-3xl font-bold text-success mb-2">47</div>
              <div className="text-muted-foreground font-medium">Online Stations</div>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Clock className="w-8 h-8 text-warning" />
              </div>
              <div className="text-3xl font-bold text-warning mb-2">3</div>
              <div className="text-muted-foreground font-medium">Maintenance</div>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-3xl font-bold text-destructive mb-2">2</div>
              <div className="text-muted-foreground font-medium">Offline</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
