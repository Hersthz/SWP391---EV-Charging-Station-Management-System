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
import VerifyEmail from "./pages/VerifyEmail";
import StationMap from "./pages/StationMap";
import Profile from "./pages/Profile";
import StaffDashboard from "./pages/StaffDashboard";
import StaffPayments from "./components/staff/StaffPayments";
import StaffIncidents from "./components/staff/StaffIncidents";
import StaffStationMonitor from "./components/staff/StaffStationMonitor";
import StaffStationDetails from "./components/staff/StaffStationsDetails";
import Booking from "./pages/BookingPage";
import ReportsPage from "./pages/ReportsPage";
import AdminAddStation from "./components/admin/AdminAddStation";
import WalletPaymentPage from "./pages/WalletPaymentPage";
import ReservationDeposit from "./pages/ReservationDeposit"
import DepositSS from "./pages/DepositSS";
import KycPage from "./pages/KycPage";
import Checkin from "./pages/Checkin";
import ChargingSessionPage from "./pages/ChargingSessionPage";
import StaffReport from "./components/staff/StaffReport";
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
          <Route path="/staff/monitor" element={<StaffStationMonitor />} />
          <Route path="/staff/details" element={<StaffStationDetails />} />
          <Route path="/staff/payments" element={<StaffPayments />} />
          <Route path="/staff/incidents" element={<StaffIncidents />} />
          <Route path="/staff/reports" element={<StaffReport />} />
          <Route path="/map" element={<StationMap />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<WalletPaymentPage />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stations" element={<AdminStations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/insights" element={<AdminInsights />} />
          <Route path="/admin/add-station" element={<AdminAddStation />} />
          <Route path="/reservation/deposit" element={<ReservationDeposit />} />
          <Route path="/depositss" element={<DepositSS />} />
          <Route path="/kyc" element={<KycPage />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/charging" element={<ChargingSessionPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
