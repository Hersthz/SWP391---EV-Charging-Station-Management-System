import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import QuickActions from "../components/dashboard/QuickAction";
import StatusCards from "../components/dashboard/StatusCards";
import ProfileSection from "../components/dashboard/ProfileSection";
import VehicleSection from "../components/dashboard/VehicleSection";
import RecentSessions from "../components/dashboard/RecentSessions";
import StatsSection from "../components/dashboard/StatsSection";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
  }
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