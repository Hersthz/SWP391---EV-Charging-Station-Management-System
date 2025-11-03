// src/pages/staff/StaffLayout.tsx
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Zap,
  LogOut,
  BarChart3,
  MapPin,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

interface StaffLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

type MePayload =
  | {
      id?: number;
      user?: { id?: number; fullName?: string; role?: { name?: string } };
      fullName?: string;
      data?: { id?: number; fullName?: string; role?: { name?: string } };
      role?: { name?: string };
    }
  | any;

const StaffLayout = ({ children, title, actions }: StaffLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<{ fullName: string; role: string } | null>(null);
  const [loadingMe, setLoadingMe] = useState<boolean>(true);

  // ===== Load staff name from /auth/me =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMe(true);
        const res = await api.get<MePayload>("/auth/me", { withCredentials: true });
        if (!mounted) return;
        // chuẩn hóa các kiểu trả về khác nhau
        const root: any = res?.data ?? {};
        const fullName =
          root.fullName ??
          root?.user?.fullName ??
          root?.data?.fullName ??
          root?.profile?.fullName ??
          "Staff";
        const role =
          root?.role?.name ??
          root?.user?.role?.name ??
          root?.data?.role?.name ??
          "STAFF";
        setMe({ fullName: String(fullName), role: String(role) });
      } catch {
        setMe({ fullName: "Staff", role: "STAFF" });
      } finally {
        setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", null, { withCredentials: true });
    } catch {
      // ignore
    }
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/staff") {
      return location.pathname === "/staff";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navItems = useMemo(
    () => [
      { path: "/staff", icon: BarChart3, label: "Dashboard" },
      { path: "/staff/monitor", icon: MapPin, label: "Monitor Station" },
      { path: "/staff/incidents", icon: AlertTriangle, label: "Incidents" },
      { path: "/staff/reports", icon: TrendingUp, label: "Reports" },
    ],
    []
  );

  // Helper tạo avatar initials
  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(2,132,199,0.35)]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <Link to="/staff" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 bg-gradient-to-br from-sky-500 to-emerald-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                ChargeHub
              </span>
              <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                Staff Portal
              </Badge>
            </Link>

            {/* User box (no bell/settings) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 border border-slate-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                  {loadingMe ? "…" : initials(me?.fullName || "S")}
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-slate-900">
                    {loadingMe ? "Loading…" : me?.fullName || "Staff"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(me?.role || "STAFF").replace(/^ROLE_/, "").replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto shadow-[inset_-1px_0_0_rgba(2,6,23,0.05)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    active
                      ? "bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)] text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md shadow-cyan-500/30 flex items-center justify-center">
                {/* decorative spark icon */}
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
