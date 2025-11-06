import { Calendar, Download, TrendingUp, Zap, Battery, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
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
// src/pages/staff/StaffReport.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";

// Mock data for charts (ONE station)
const usageData = [
  { date: "Mon", sessions: 24, energy: 156 },
  { date: "Tue", sessions: 28, energy: 189 },
  { date: "Wed", sessions: 32, energy: 203 },
  { date: "Thu", sessions: 29, energy: 178 },
  { date: "Fri", sessions: 35, energy: 221 },
  { date: "Sat", sessions: 42, energy: 267 },
  { date: "Sun", sessions: 38, energy: 241 },
];

const pillarPerformance = [
  { code: "P-01", uptime: 98, sessions: 45 },
  { code: "P-02", uptime: 100, sessions: 52 },
  { code: "P-03", uptime: 65, sessions: 18 },
  { code: "P-04", uptime: 85, sessions: 32 },
  { code: "P-05", uptime: 96, sessions: 41 },
  { code: "P-06", uptime: 99, sessions: 48 },
];

const statusDistribution = [
  { name: "Available", value: 2, color: "hsl(var(--status-available))" },
  { name: "Charging", value: 2, color: "hsl(var(--status-charging))" },
  { name: "Offline", value: 1, color: "hsl(var(--status-offline))" },
  { name: "Maintenance", value: 1, color: "hsl(var(--status-maintenance))" },
];

const Report = () => {
  return (
    <StaffLayout title="Report Management">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last 7 days
                </Button>
                <Button variant="default" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export report
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
                    <p className="text-sm font-medium text-muted-foreground">Total sessions</p>
                    <p className="text-2xl font-bold text-foreground">228</p>
                    <p className="text-xs text-primary font-medium">+12% vs last week</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Energy used</p>
                    <p className="text-2xl font-bold text-foreground">1,455 kWh</p>
                    <p className="text-xs text-primary font-medium">+8% vs last week</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Avg. uptime</p>
                    <p className="text-2xl font-bold text-foreground">92.8%</p>
                    <p className="text-xs text-primary font-medium">Excellent</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Avg. charge time</p>
                    <p className="text-2xl font-bold text-foreground">42 minutes</p>
                    <p className="text-xs text-muted-foreground">Per session</p>
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
            {/* Usage Trend (this station) */}
            <Card>
              <CardHeader>
                <CardTitle>Daily usage trend</CardTitle>
                <CardDescription>Sessions and energy consumption</CardDescription>
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
                      name="Sessions"
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="hsl(var(--electric))"
                      strokeWidth={2}
                      name="Energy (kWh)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pillar performance (inside this station) */}
            <Card>
              <CardHeader>
                <CardTitle>Pillar performance</CardTitle>
                <CardDescription>Uptime and sessions per pillar</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pillarPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    {/* FIX: use "code" instead of "name" */}
                    <XAxis dataKey="code" stroke="hsl(var(--muted-foreground))" />
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
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution (pillars) */}
            <Card>
              <CardHeader>
                <CardTitle>Status distribution</CardTitle>
                {/* FIX: pillars, not stations */}
                <CardDescription>Current status across pillars</CardDescription>
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
                <CardTitle>Peak hours</CardTitle>
                <CardDescription>Usage by time slot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: "08:00 - 10:00", usage: 85, label: "Morning peak" },
                    { time: "12:00 - 14:00", usage: 72, label: "Lunchtime" },
                    { time: "17:00 - 19:00", usage: 95, label: "Evening peak" },
                    { time: "20:00 - 22:00", usage: 45, label: "Night" },
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
                      <span className="text-xs text-muted-foreground">{slot.usage}% capacity</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </StaffLayout>
  );
};

export default Report;
