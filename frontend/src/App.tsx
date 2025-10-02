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
import StaffDashboard from "./pages/StaffDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import StationMap from "./pages/StationMap";
import StaffStation from "./components/staff/StaffStation";
import StaffIncidents from "./components/staff/StaffIncidents";
import StaffPayments from "./components/staff/StaffPayments";

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
          <Route path="/staff/stations" element={<StaffStation />} />
          <Route path="/staff/incidents" element={<StaffIncidents />} />
          <Route path="/staff/payments" element={<StaffPayments />} />
          <Route path="/map" element={<StationMap />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stations" element={<AdminStations />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
