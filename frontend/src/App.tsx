import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/HomePage";
import Login from "./pages/Login";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminStations from "./components/admin/AdminStations";
import AdminUsers from "./components/admin/AdminUsers";
import AdminStaff from "./components/admin/AdminStaff";
import AdminSubscriptions from "./components/admin/AdminSubscriptions";
import AdminReports from "./components/admin/AdminReports";
import AdminInsights from "./components/admin/AdminInsights";
import VerifyEmail from "./pages/actions/VerifyEmail";
import StationMap from "./pages/reservation/StationMap";
import Profile from "./pages/profile/Profile";
import StaffDashboard from "./pages/dashboard/StaffDashboard";
import StaffIncidents from "./components/staff/StaffIncidents";
import Booking from "./pages/reservation/BookingPage";
import ReportsPage from "./pages/actions/ReportsPage";
import AdminAddStation from "./components/admin/AdminAddStation";
import WalletPaymentPage from "./pages/actions/WalletPaymentPage";
import ReservationDeposit from "./pages/payment/ReservationDeposit"
import DepositSS from "./pages/payment/DepositSS";
import KycPage from "./pages/profile/KycPage";
import Checkin from "./pages/reservation/Checkin";
import ChargingSessionPage from "./pages/charging/ChargingSessionPage";
import StaffReport from "./components/staff/StaffReport";
import ChargingReceiptPage from "./pages/charging/ChargingReceiptPage";
import SessionPayment from "./pages/payment/SessionPayment";
import SessionPaymentResult from "./pages/payment/SessionPaymentResult";
import WalletTopupResult from "./pages/payment/WalletTopupResult";
import SubscriptionPage from "./pages/actions/SubscriptionPage";
import StationReviewPage from "./pages/actions/StationReviewPage";
import StaffReservations from "./components/staff/StaffReservations";
import StaffPayment from "./components/staff/StaffPayment";
import AdminKyc from "./components/admin/AdminKyc";
import CashPayment from "./pages/payment/CashPayment";


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
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/reservations" element={<StaffReservations />} />
          <Route path="/staff/payments" element={<StaffPayment />} />
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
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/insights" element={<AdminInsights />} />
          <Route path="/admin/add-station" element={<AdminAddStation />} />
          <Route path="/reservation/deposit" element={<ReservationDeposit />} />
          <Route path="/depositss" element={<DepositSS />} />
          <Route path="/kyc" element={<KycPage />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/charging" element={<ChargingSessionPage />} />
          <Route path="/charging/receipt" element={<ChargingReceiptPage />} />
          <Route path="/session/payment" element={<SessionPayment />} />
          <Route path="/session/payment/cash" element={<CashPayment />} />
          <Route path="/session-payment-result" element={<SessionPaymentResult />} />
          <Route path="/wallet/topup-result" element={<WalletTopupResult />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/stations/:stationId/review" element={<StationReviewPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
