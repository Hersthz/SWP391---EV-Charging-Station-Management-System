import { ArrowLeft, Calendar, Download, TrendingUp, Zap, Battery, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock data for charts
const usageData = [
  { date: "Mon", sessions: 24, energy: 156 },
  { date: "Tue", sessions: 28, energy: 189 },
  { date: "Wed", sessions: 32, energy: 203 },
  { date: "Thu", sessions: 29, energy: 178 },
  { date: "Fri", sessions: 35, energy: 221 },
  { date: "Sat", sessions: 42, energy: 267 },
  { date: "Sun", sessions: 38, energy: 241 },
];

const stationPerformance = [
  { name: "Station A1", uptime: 98, sessions: 45 },
  { name: "Station A2", uptime: 100, sessions: 52 },
  { name: "Station V1", uptime: 65, sessions: 18 },
  { name: "Station E1", uptime: 85, sessions: 32 },
  { name: "Station E2", uptime: 96, sessions: 41 },
  { name: "Station F1", uptime: 99, sessions: 48 },
];

const statusDistribution = [
  { name: "Available", value: 2, color: "hsl(var(--status-available))" },
  { name: "Charging", value: 2, color: "hsl(var(--status-charging))" },
  { name: "Offline", value: 1, color: "hsl(var(--status-offline))" },
  { name: "Maintenance", value: 1, color: "hsl(var(--status-maintenance))" },
];

const Report = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Báo Cáo Hệ Thống</h1>
                <p className="text-sm text-muted-foreground">Thống kê và phân tích chi tiết</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                7 ngày qua
              </Button>
              <Button variant="default" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tổng phiên sạc</p>
                  <p className="text-2xl font-bold text-foreground">228</p>
                  <p className="text-xs text-primary font-medium">+12% so với tuần trước</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Năng lượng sử dụng</p>
                  <p className="text-2xl font-bold text-foreground">1,455 kWh</p>
                  <p className="text-xs text-primary font-medium">+8% so với tuần trước</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-electric/10 flex items-center justify-center">
                  <Battery className="h-6 w-6 text-electric" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Thời gian hoạt động TB</p>
                  <p className="text-2xl font-bold text-foreground">92.8%</p>
                  <p className="text-xs text-primary font-medium">Xuất sắc</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-status-available/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-status-available" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Thời gian sạc TB</p>
                  <p className="text-2xl font-bold text-foreground">42 phút</p>
                  <p className="text-xs text-muted-foreground">Mỗi phiên</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-status-charging/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-status-charging" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usage Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng sử dụng theo ngày</CardTitle>
              <CardDescription>Số phiên sạc và năng lượng tiêu thụ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Phiên sạc"
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="hsl(var(--electric))"
                    strokeWidth={2}
                    name="Năng lượng (kWh)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Station Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất các trạm sạc</CardTitle>
              <CardDescription>Thời gian hoạt động và số phiên</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stationPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="uptime" fill="hsl(var(--status-available))" name="Uptime (%)" />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Phiên sạc" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ trạng thái</CardTitle>
              <CardDescription>Tình trạng hiện tại các trạm</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Giờ cao điểm</CardTitle>
              <CardDescription>Thống kê sử dụng theo khung giờ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "08:00 - 10:00", usage: 85, label: "Cao điểm buổi sáng" },
                  { time: "12:00 - 14:00", usage: 72, label: "Giờ nghỉ trưa" },
                  { time: "17:00 - 19:00", usage: 95, label: "Cao điểm buổi chiều" },
                  { time: "20:00 - 22:00", usage: 45, label: "Buổi tối" },
                ].map((slot, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{slot.time}</span>
                      <span className="text-muted-foreground">{slot.label}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-electric rounded-full transition-all"
                        style={{ width: `${slot.usage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{slot.usage}% công suất</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Report;