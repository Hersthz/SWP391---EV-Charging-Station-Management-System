import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import QuickActions from "../components/dashboard/QuickAction";
import StatusCards from "../components/dashboard/StatusCards";
import ProfileSection from "../components/dashboard/ProfileSection";
import VehicleSection from "../components/dashboard/VehicleSection";
import RecentSessions from "../components/dashboard/RecentSessions";
import StatsSection from "../components/dashboard/StatsSection";
import api from "../api/axios";

const Dashboard = () => {
  const navigate = useNavigate();
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

        const { username, role, full_name } = response.data;
        localStorage.setItem("currentUser", username);
        localStorage.setItem("role", role);
        localStorage.setItem("full_name", full_name);
      } catch {
        localStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;