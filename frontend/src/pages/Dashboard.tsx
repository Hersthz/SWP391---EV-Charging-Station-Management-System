// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ⬅️ thêm useLocation
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import QuickActions from "../components/dashboard/QuickAction";
import StatusCards from "../components/dashboard/StatusCards";
import ProfileSection from "../components/dashboard/ProfileSection";
import VehicleSection from "../components/dashboard/VehicleSection";
import RecentSessions from "../components/dashboard/RecentSessions";
import StatsSection from "../components/dashboard/StatsSection";
import api from "../api/axios";
import { ChatBot } from "./ChatBot";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [loading, setLoading] = useState(true);

  interface UserResponse {
    username: string;
    role: string;
    full_name: string;
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get<UserResponse>("/auth/me", { withCredentials: true });
        const data = response.data as any;

        const username = data.username ?? data.email ?? data.user_id;
        const role = data.role ?? data.roleName ?? data.role_name ?? data.roleName?.toString();
        const full_name = data.full_name ?? data.fullName ?? data.fullname ?? data.full_name;

        if (username) localStorage.setItem("currentUser", String(username));
        if (role) localStorage.setItem("role", String(role));
        if (full_name) localStorage.setItem("full_name", String(full_name));
      } catch {
        localStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const st = (location.state || {}) as any;
    if (st?.refreshReservations) {
      window.dispatchEvent(new Event("refresh-reservations"));
      navigate(location.pathname, { replace: true, state: {} as any });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(100%_80%_at_0%_0%,rgba(24,73,153,0.12),transparent_55%),radial-gradient(95%_75%_at_100%_0%,rgba(37,99,235,0.12),transparent_60%),radial-gradient(120%_100%_at_50%_100%,rgba(14,165,233,0.10),transparent_65%)]"
      />
      <div
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(80%_60%_at_50%_0%,transparent_40%,rgba(30,58,138,0.08)_90%)]"
      />

      <div className="relative">
        <DashboardHeader />

        <main className="container mx-auto px-4 pt-20 pb-8 space-y-6">
          <WelcomeSection />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <QuickActions />
              <StatusCards />
              <RecentSessions />
            </div>

            <div className="space-y-6">
              <ProfileSection />
              <VehicleSection />
              <StatsSection />
              <ChatBot />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
