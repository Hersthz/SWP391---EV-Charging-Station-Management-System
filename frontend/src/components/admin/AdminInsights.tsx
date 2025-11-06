import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
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
  TrendingUp,
  RefreshCw,
  Calendar,
  Target,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AdminInsights = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3);
  const handleLogout = () => {
    navigate("/");
  };
  const marketInsights = [
    {
      title: "EV Adoption Growth",
      value: "+28% YoY",
      description: "Regional EV registrations accelerating faster than national average",
      priority: "High",
    },
    {
      title: "Fast Charging Preference",
      value: "73% prefer",
      description: "Users increasingly choose fast charging over standard options",
      priority: "Medium",
    },
    {
      title: "Subscription Growth",
      value: "+45% adoption",
      description: "Monthly subscription models showing strong customer retention",
      priority: "High",
    },
  ];

  const recommendations = [
    {
      id: 1,
      title: "Expand Downtown District",
      description:
        "Add 3 fast-charging stations in downtown area within 4 months to meet growing demand.",
      impact: "Revenue increase: $45K/month",
      timeframe: "4 months",
      investment: "$180,000",
      roi: "285%",
      confidence: "94% confidence",
      priority: "High priority",
      details: {
        rationale:
          "Analysis shows 90% peak usage during weekdays with 2+ hour wait times. Market analysis indicates 300+ potential new users in 2-mile radius.",
        basedOn: ["Usage patterns", "Demographic analysis", "Competitor mapping", "Traffic data"],
      },
    },
    {
      id: 2,
      title: "Upgrade Highway Station #7",
      description:
        "Install 2 additional ultra-fast connectors to reduce wait times and increase throughput.",
      impact: "Capacity increase: +40%",
      timeframe: "6 weeks",
      investment: "$95,000",
      roi: "190%",
      confidence: "87% confidence",
      priority: "High priority",
      details: {
        rationale:
          "Current station operates at 95% capacity with frequent queuing. Highway traffic patterns show consistent demand growth.",
        basedOn: ["Usage patterns", "Demographic analysis", "Competitor mapping", "Traffic data"],
      },
    },
  ];

  const priorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes("high")) {
      return <Badge className="bg-red-100 text-red-600 border-red-200">High</Badge>;
    }
    if (p.includes("medium")) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>;
    }
    return <Badge variant="outline">{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white">
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
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Reports</span>
            </Link>
            
            <Link 
              to="/admin/insights" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">AI Insights</span>
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          {/* Page header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-sky-600 bg-clip-text text-transparent">
                AI Insights
              </h1>
              <p className="text-sm text-muted-foreground">
                Data-driven recommendations for your charging network
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Last updated <span className="font-medium">2 hours ago</span>
              </div>
              <Button className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow hover:opacity-90">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Hero banner */}
          <Card className="mb-8 overflow-hidden border-0 shadow-lg">
            <CardContent className="relative p-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-300/30 blur-3xl" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-inner">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
                  <p className="text-muted-foreground">
                    Smart analysis across demand, revenue and operations—updated continuously.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {marketInsights.map((insight, i) => (
              <Card
                key={i}
                className="border-0 bg-white/90 shadow-lg transition hover:shadow-xl rounded-2xl"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium">
                    <TrendingUp className="mr-2 h-4 w-4 text-emerald-600" />
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold text-sky-600">{insight.value}</div>
                  <div className="text-xs text-muted-foreground">{insight.description}</div>
                  <div>
                    {insight.priority === "High" ? (
                      <Badge className="bg-red-100 text-red-600 border-red-200">High</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Strategic Recommendations</h3>
            <Badge className="bg-sky-100 text-sky-700 border-sky-200">5 insights available</Badge>
          </div>

          {/* Recommendation cards */}
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="border-0 bg-white/95 shadow-lg transition hover:shadow-xl rounded-2xl"
              >
                <CardContent className="p-6">
                  {/* Title */}
                  <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-sky-500/10">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {rec.confidence}
                      </Badge>
                      {priorityBadge(rec.priority)}
                    </div>
                  </div>

                  {/* Facts */}
                  <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <div className="text-xs text-emerald-700/80">Impact</div>
                      <div className="font-semibold">{rec.impact}</div>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-3">
                      <div className="text-xs text-sky-700/80">Timeframe</div>
                      <div className="font-semibold">{rec.timeframe}</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <div className="text-xs text-emerald-700/80">Investment</div>
                      <div className="font-semibold">{rec.investment}</div>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-3">
                      <div className="text-xs text-sky-700/80">Expected ROI</div>
                      <div className="font-semibold text-emerald-700">{rec.roi}</div>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 p-4">
                    <h5 className="mb-2 font-medium">AI Rationale</h5>
                    <p className="mb-3 text-sm text-muted-foreground">{rec.details.rationale}</p>
                    <div className="text-sm">
                      <span className="font-medium">Based on analysis of:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rec.details.basedOn.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow hover:opacity-90">
                      Implement
                    </Button>
                    <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700">
                      <Calendar className="h-4 w-4" />
                      Schedule Review
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-sky-700 hover:text-sky-800">
                      <Target className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminInsights;
