import { ReactNode, useState } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Zap,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  MapPin,
  Users,
  CreditCard,
  Database,
  Brain
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

const AdminLayout = ({ children, title, actions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState(3);

  const handleLogout = () => {
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/admin", icon: BarChart3, label: "Dashboard" },
    { path: "/admin/stations", icon: MapPin, label: "Stations" },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
    { path: "/admin/reports", icon: Database, label: "Reports" },
    { path: "/admin/insights", icon: Brain, label: "AI Insights" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-electric">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">ChargeStation</span>
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
        <aside className="w-64 bg-card border-r border-border h-screen sticky top-16 overflow-y-auto shadow-card">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${active
                      ? "bg-primary/10 text-primary border border-primary/20 font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            </div>
            {actions && (
              <div className="flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;