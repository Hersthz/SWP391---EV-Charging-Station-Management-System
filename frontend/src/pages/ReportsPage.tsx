// src/pages/ReportsPage.tsx
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  MapPin,
  Download,
  Filter,
  Calendar,
  Battery,
} from "lucide-react";
import { Link } from "react-router-dom";

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const chargingSessions = [
    { id: "1", date: "2024-01-15", time: "14:30", station: "Mall Station #2", location: "Shopping Center", duration: "2h 15m", energy: "45 kWh", cost: "$18.50", status: "Completed", efficiency: "94%" },
    { id: "2", date: "2024-01-12", time: "09:15", station: "Highway Station #7", location: "Highway Rest Stop", duration: "1h 45m", energy: "52 kWh", cost: "$22.10", status: "Completed", efficiency: "96%" },
    { id: "3", date: "2024-01-08", time: "16:45", station: "Downtown Station #3", location: "City Center", duration: "3h 20m", energy: "38 kWh", cost: "$15.75", status: "Completed", efficiency: "91%" },
    { id: "4", date: "2024-01-05", time: "11:00", station: "Office Station #1", location: "Business District", duration: "4h 30m", energy: "42 kWh", cost: "$17.85", status: "Completed", efficiency: "93%" },
  ];

  const monthlyStats = {
    totalCost: 127.45,
    totalEnergy: 234.5,
    totalSessions: 18,
    avgCostPerSession: 7.08,
    avgEnergyPerSession: 13.03,
    mostUsedStation: "Mall Station #2",
    preferredTime: "14:00 - 18:00",
    efficiency: "94.2%",
  };

  const chargingHabits = {
    preferredStations: [
      { name: "Mall Station #2", visits: 12, percentage: 35, avgCost: 15.2, avgTime: "2h 15m" },
      { name: "Highway Station #7", visits: 8, percentage: 28, avgCost: 22.1, avgTime: "1h 45m" },
      { name: "Downtown Station #3", visits: 6, percentage: 22, avgCost: 18.75, avgTime: "2h 30m" },
      { name: "Office Station #1", visits: 4, percentage: 15, avgCost: 12.5, avgTime: "3h 20m" },
    ],
    timePatterns: [
      { period: "06:00 - 09:00", sessions: 2, percentage: 11, label: "Early morning" },
      { period: "09:00 - 12:00", sessions: 3, percentage: 17, label: "Morning" },
      { period: "12:00 - 15:00", sessions: 6, percentage: 33, label: "Noon" },
      { period: "15:00 - 18:00", sessions: 5, percentage: 28, label: "Afternoon" },
      { period: "18:00 - 21:00", sessions: 2, percentage: 11, label: "Evening" },
    ],
    powerPreferences: [
      { type: "DC Ultra Fast (250-350kW)", usage: 8, percentage: 44, avgCost: 25.3 },
      { type: "DC Fast (100-150kW)", usage: 6, percentage: 33, avgCost: 18.45 },
      { type: "AC Fast (22kW)", usage: 3, percentage: 17, avgCost: 12.2 },
      { type: "AC Standard (7-11kW)", usage: 1, percentage: 6, avgCost: 8.5 },
    ],
  };

  const monthlyReports = [
    { month: "January", cost: 127.45, energy: 234.5, sessions: 18, savings: 15.2 },
    { month: "December", cost: 142.3, energy: 218.3, sessions: 16, savings: 12.8 },
    { month: "November", cost: 156.75, energy: 245.8, sessions: 20, savings: 18.9 },
    { month: "October", cost: 134.2, energy: 201.2, sessions: 15, savings: 14.5 },
    { month: "September", cost: 168.9, energy: 267.4, sessions: 22, savings: 22.1 },
    { month: "August", cost: 145.6, energy: 229.1, sessions: 17, savings: 16.3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="hover:bg-sky-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Reports & Analytics
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button className="shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export report
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-muted-foreground">Insights, trends & cost analysis</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList
            className="
              grid w-full grid-cols-3 rounded-2xl bg-[#F7FAFD] p-1.5
              ring-1 ring-slate-200/70 h-auto gap-1
            "
          >
            {[
              { v: "overview", label: "Overview" },
              { v: "sessions", label: "Session history" },
              { v: "analytics", label: "Analytics" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="
                  group w-full rounded-xl px-6 py-3
                  text-slate-600 font-medium hover:text-slate-700
                  data-[state=active]:text-white
                  data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                  data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                  transition-all flex items-center justify-center
                "
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ===== Overview ===== */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This month’s cost</p>
                      <p className="text-2xl font-bold text-primary">${monthlyStats.totalCost}</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        12% lower than last month
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Energy used</p>
                      <p className="text-2xl font-bold text-secondary">{monthlyStats.totalEnergy} kWh</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        8% higher than last month
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total sessions</p>
                      <p className="text-2xl font-bold text-foreground">{monthlyStats.totalSessions}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg {Math.round((monthlyStats.totalSessions / 30) * 10) / 10} sessions/day
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Charging efficiency</p>
                      <p className="text-2xl font-bold text-success">{monthlyStats.efficiency}</p>
                      <p className="text-xs text-success flex items-center mt-1">
                        <Battery className="w-3 h-3 mr-1" />
                        Optimized
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly list */}
            <Card className="shadow-card border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Cost report (last 6 months)</CardTitle>
                <p className="text-sm text-muted-foreground">Track your spending and savings trend</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyReports.map((report) => (
                    <div
                      key={report.month}
                      className="flex items-center justify-between p-4 rounded-lg border bg-gradient-card"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.month}</h4>
                          <p className="text-sm text-muted-foreground">{report.sessions} sessions</p>
                        </div>
                      </div>
                      <div className="text-right grid grid-cols-3 gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground">Cost</div>
                          <div className="font-bold text-primary">${report.cost}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Energy</div>
                          <div className="font-medium">{report.energy} kWh</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Savings</div>
                          <div className="font-medium text-success">${report.savings}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card border-0 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Most used stations</CardTitle>
                  <p className="text-sm text-muted-foreground">Location-based charging habits</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chargingHabits.preferredStations.map((station, index) => (
                      <div key={station.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                index === 0
                                  ? "bg-primary"
                                  : index === 1
                                  ? "bg-secondary"
                                  : index === 2
                                  ? "bg-warning"
                                  : "bg-muted"
                              }`}
                            />
                            <span className="font-medium">{station.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{station.percentage}%</span>
                            <div className="text-xs text-muted-foreground">{station.visits} visits</div>
                          </div>
                        </div>
                        <div className="ml-6 text-xs text-muted-foreground">
                          Avg cost: ${station.avgCost} • Avg time: {station.avgTime}
                        </div>
                        <div className="ml-6 w-full bg-muted/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0
                                ? "bg-gradient-to-r from-sky-500 to-emerald-500"
                                : index === 1
                                ? "bg-secondary"
                                : index === 2
                                ? "bg-warning"
                                : "bg-muted"
                            }`}
                            style={{ width: `${station.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Charging time preferences</CardTitle>
                  <p className="text-sm text-muted-foreground">When you typically charge</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chargingHabits.timePatterns.map((pattern) => (
                      <div key={pattern.period} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{pattern.label}</span>
                            <div className="text-sm text-muted-foreground">{pattern.period}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{pattern.percentage}%</span>
                            <div className="text-xs text-muted-foreground">{pattern.sessions} sessions</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                            style={{ width: `${pattern.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg cost per session:</span>
                      <span className="font-medium">${monthlyStats.avgCostPerSession}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg energy per session:</span>
                      <span className="font-medium">{monthlyStats.avgEnergyPerSession} kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Most used station:</span>
                      <span className="font-medium">{monthlyStats.mostUsedStation}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Favorite time window:</span>
                      <span className="font-medium">{monthlyStats.preferredTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Average efficiency:</span>
                      <Badge className="bg-success/10 text-success border-success/20">{monthlyStats.efficiency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Usage trend:</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Increasing</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Sessions ===== */}
          <TabsContent value="sessions" className="space-y-6 animate-fade-in">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Session history</span>
                  <Button variant="outline" size="sm" className="hover:bg-sky-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chargingSessions.map((session, index) => (
                    <div key={session.id}>
                      <div className="flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-white">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{session.station}</h4>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {session.location}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {session.date} • {session.time}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                            <div>
                              <div className="text-muted-foreground">Duration</div>
                              <div className="font-medium">{session.duration}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Energy</div>
                              <div className="font-medium">{session.energy}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Cost</div>
                              <div className="font-medium text-primary">{session.cost}</div>
                            </div>
                          </div>
                          <Badge className="bg-success/10 text-success border-success/20">
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                      {index < chargingSessions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Analytics ===== */}
          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle>Power preference analysis</CardTitle>
                <p className="text-sm text-muted-foreground">Power choices & average cost</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chargingHabits.powerPreferences.map((power) => (
                    <div key={power.type} className="p-4 border rounded-lg bg-white/80">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Battery className="w-5 h-5 text-primary" />
                          <span className="font-medium">{power.type}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">{power.percentage}%</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usage count:</span>
                          <span className="font-medium">{power.usage} sessions</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average cost:</span>
                          <span className="font-medium text-primary">${power.avgCost}</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${power.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card border-0 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Charging efficiency</CardTitle>
                  <p className="text-sm text-muted-foreground">Performance & trend overview</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Battery className="w-10 h-10 text-success" />
                      </div>
                      <div className="text-3xl font-bold text-success mb-2">{monthlyStats.efficiency}</div>
                      <p className="text-sm text-muted-foreground">Average efficiency</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Vs last month:</span>
                        <Badge className="bg-success/10 text-success border-success/20">+2.1%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">6-month trend:</span>
                        <span className="text-sm text-success font-medium flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Improving
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ranking:</span>
                        <Badge className="bg-warning/10 text-warning border-warning/20">Top 15%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Cost optimization</CardTitle>
                  <p className="text-sm text-muted-foreground">Tips to save more</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">Savings this month</span>
                      </div>
                      <div className="text-2xl font-bold text-success mb-1">$15.20</div>
                      <p className="text-xs text-muted-foreground">Compared to last month</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                        <div className="font-medium text-info mb-1">💡 Tip</div>
                        <p className="text-sm text-muted-foreground">Charge between 10:00–14:00 to save ~15%.</p>
                      </div>
                      <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                        <div className="font-medium text-warning mb-1">⚡ Optimize</div>
                        <p className="text-sm text-muted-foreground">Use DC Fast instead of Ultra Fast for short trips.</p>
                      </div>
                      <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
                        <div className="font-medium text-secondary mb-1">📍 Location</div>
                        <p className="text-sm text-muted-foreground">Mall Station #2 offers the best frequent-charge price.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Habits summary */}
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle>Personal charging habits</CardTitle>
                <p className="text-sm text-muted-foreground">A quick look at your behavior</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Favorite location</h4>
                    <p className="text-sm text-muted-foreground mb-2">{monthlyStats.mostUsedStation}</p>
                    <Badge className="bg-primary/10 text-primary border-primary/20">35% of sessions</Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-secondary" />
                    </div>
                    <h4 className="font-semibold mb-2">Favorite time</h4>
                    <p className="text-sm text-muted-foreground mb-2">{monthlyStats.preferredTime}</p>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20">61% of sessions</Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-warning" />
                    </div>
                    <h4 className="font-semibold mb-2">Preferred power</h4>
                    <p className="text-sm text-muted-foreground mb-2">DC Ultra Fast</p>
                    <Badge className="bg-warning/10 text-warning border-warning/20">44% usage</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsPage;