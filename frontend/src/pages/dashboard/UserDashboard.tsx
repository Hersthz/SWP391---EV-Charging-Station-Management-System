import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import DashboardHeader from "../../components/user/DashboardHeader";
import WelcomeSection from "../../components/user/WelcomeSection";
import QuickActions from "../../components/user/QuickAction";
import StatusCards from "../../components/user/StatusCards";
import ProfileSection from "../../components/user/ProfileSection";
import VehicleSection from "../../components/user/VehicleSection";
import api from "../../api/axios";
import { ChatBot } from "../ChatBot";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [loading, setLoading] = useState(true);

  if (sessionStorage.getItem("IS_CHARGING") === "true") {
    return null; 
  }
  
  interface UserResponse {
    id: number;
    username: string;
    role: string;
    fullName: string;
  }

  useEffect(() => {
    sessionStorage.removeItem("IS_CHARGING");
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("reservation_cache_") ||
        key.startsWith("soc")
      ) {
        localStorage.removeItem(key);
      }
    });
    const checkAuth = async () => {
      try {
        const response = await api.get<UserResponse>("/auth/me", { withCredentials: true });
        const data = response.data as any;

        const id =
            Number(data.id ?? data.userId ?? data.user_id ?? data?.user?.id ?? data?.profile?.id);
        const username = data.username ?? data.email ?? data.user_id;
        const role = data.role ?? data.roleName ?? data.role_name ?? data.roleName?.toString();
        const fullName = data.full_name ?? data.fullName ?? data.fullname ?? data.fullName;

        if (Number.isFinite(id)) {
          localStorage.setItem("userId", String(id));   
          localStorage.setItem("user_id", String(id));    
          localStorage.setItem("id", String(id));
        }
        if (username) localStorage.setItem("currentUser", String(username));
        if (role) localStorage.setItem("role", String(role));
        if (fullName) localStorage.setItem("fullName", String(fullName));
      } catch (error) {
        const isCharging = sessionStorage.getItem("IS_CHARGING") === "true";
        if (isCharging) {
           console.warn("UserDashboard checkAuth failed, but Charging Mode is active. Redirect blocked.");
           return; // Dừng ngay, không được clear localStorage hay navigate
        }

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
            </div>

            <div className="space-y-6">
              <ProfileSection />
              <VehicleSection />
              <ChatBot />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
