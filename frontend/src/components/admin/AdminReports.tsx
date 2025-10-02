import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import { 
  Zap, 
  Users, 
  MapPin, 
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Database,
  CreditCard,
  Brain,
  Download,
  Filter,
  DollarSign,
  Battery,
  TrendingUp,
  Clock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";

const AdminReports = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3);

  const handleLogout = () => {
    navigate("/");
  };

  const revenueData = [
    { name: 'Jan', revenue: 47000, sessions: 1200 },
    { name: 'Feb', revenue: 53000, sessions: 1350 },
    { name: 'Mar', revenue: 48000, sessions: 1180 },
    { name: 'Apr', revenue: 61000, sessions: 1520 },
    { name: 'May', revenue: 58000, sessions: 1450 },
    { name: 'Jun', revenue: 76000, sessions: 2000 }
  ];

  const hourlyUsage = [
    { hour: '00', usage: 12 },
    { hour: '02', usage: 8 },
    { hour: '04', usage: 6 },
    { hour: '06', usage: 45 },
    { hour: '08', usage: 89 },
    { hour: '10', usage: 78 },
    { hour: '12', usage: 92 },
    { hour: '14', usage: 95 },
    { hour: '16', usage: 134 },
    { hour: '18', usage: 156 },
    { hour: '20', usage: 98 },
    { hour: '22', usage: 67 }
  ];

  const topStations = [
    { name: "Downtown #3", sessions: 456, revenue: "$18,240", utilization: 85 },
    { name: "Mall #2", sessions: 389, revenue: "$15,560", utilization: 67 },
    { name: "Highway #7", sessions: 623, revenue: "$24,920", utilization: 92 },
    { name: "Airport #1", sessions: 512, revenue: "$20,480", utilization: 78 },
    { name: "Shopping Center #5", sessions: 298, revenue: "$11,920", utilization: 55 }
  ];

  const subscriptionData = [
    { name: 'Basic Monthly', value: 29, color: 'hsl(var(--primary))' },
    { name: 'Premium Monthly', value: 20, color: 'hsl(var(--success))' },
    { name: 'Pay-per-use', value: 49, color: 'hsl(var(--destructive))' },
    { name: 'Enterprise Annual', value: 2, color: 'hsl(var(--warning))' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-foreground">ChargeHub</span>
                </div>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">Admin Portal</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-primary-foreground text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2 text-sm">
                <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 ml-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white h-screen sticky top-16 overflow-y-auto border-r border-gray-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
          <nav className="p-4 space-y-2">
            <Link 
              to="/admin" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/admin/stations" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Stations</span>
            </Link>
            
            <Link 
              to="/admin/users" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Link>
            
            <Link 
              to="/admin/subscriptions" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Subscriptions</span>
            </Link>
            
            <Link 
              to="/admin/reports" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
            >
              <Database className="w-4 h-4" />
              <span className="font-medium">Reports</span>
            </Link>
            
            <Link 
              to="/admin/insights" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>AI Insights</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="last-6-months">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Last 6 Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="revenue">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Revenue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>

              <Button className="bg-primary text-white hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">$340K</p>
                    <p className="text-sm text-success">+18.2% vs last period</p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold text-foreground">8,590</p>
                    <p className="text-sm text-primary">+12.5% vs last period</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Battery className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-foreground">4,324</p>
                    <p className="text-sm text-warning">+8.7% vs last period</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Session Value</p>
                    <p className="text-2xl font-bold text-foreground">$39.6</p>
                    <p className="text-sm text-success">+5.1% vs last period</p>
                  </div>
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue & Sessions Trends */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Revenue & Session Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours Analysis */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary" />
                  Peak Hours Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">18:00</div>
                    <div className="text-sm text-muted-foreground">#1 peak</div>
                    <div className="text-xs">156 sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">16:00</div>
                    <div className="text-sm text-muted-foreground">#2 peak</div>
                    <div className="text-xs">134 sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">14:00</div>
                    <div className="text-sm text-muted-foreground">#3 peak</div>
                    <div className="text-xs">112 sessions</div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Insights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Highest usage between 4-8 PM (evening commute)</li>
                    <li>• Secondary peak at 8-10 AM (morning commute)</li>
                    <li>• Lowest usage between 2-6 AM</li>
                    <li>• Weekend patterns show more distributed usage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performing Stations */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary" />
                  Top Performing Stations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topStations.map((station, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{station.name}</div>
                        <div className="text-sm text-muted-foreground">{station.sessions} sessions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-success">{station.revenue}</div>
                      <div className="flex items-center space-x-2">
                        <Progress value={station.utilization} className="w-12 h-2" />
                        <span className="text-xs text-muted-foreground">{station.utilization}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subscription Distribution */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary" />
                  Subscription Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {subscriptionData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-success/10 p-6 rounded-lg">
                  <div className="text-4xl font-bold text-success">92%</div>
                  <div className="text-muted-foreground">Average Station Uptime</div>
                </div>
                
                <div className="text-center bg-primary/10 p-6 rounded-lg">
                  <div className="text-4xl font-bold text-primary">76%</div>
                  <div className="text-muted-foreground">Network Utilization</div>
                </div>
                
                <div className="text-center bg-warning/10 p-6 rounded-lg">
                  <div className="text-4xl font-bold text-warning">4.8</div>
                  <div className="text-muted-foreground">Customer Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;