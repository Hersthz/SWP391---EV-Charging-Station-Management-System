import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStations from "./components/admin/AdminStations";
import AdminUsers from "./components/admin/AdminUsers";
import AdminSubscriptions from "./components/admin/AdminSubscriptions";
import AdminReports from "./components/admin/AdminReports";
import AdminInsights from "./components/admin/AdminInsights";
import StaffDashboard from "./pages/StaffDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import StationMap from "./pages/StationMap";
import Profile from "./pages/Profile";
import Booking from "./pages/BookingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/map" element={<StationMap />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stations" element={<AdminStations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/insights" element={<AdminInsights />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
