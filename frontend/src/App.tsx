import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/HomePage";
import Login from "./pages/Login";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminStations from "./components/admin/AdminStations";
import AdminUsers from "./components/admin/AdminUsers";
import AdminStaff from "./components/admin/AdminStaff";
import AdminVoucher from "./components/admin/AdminVoucher";
import AdminReports from "./components/admin/AdminReports";
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
import VoucherPage from "./pages/actions/VoucherPage";
import StationReviewPage from "./pages/actions/StationReviewPage";
import StaffReservations from "./components/staff/StaffReservations";
import StaffPayment from "./components/staff/StaffPayment";
import AdminKyc from "./components/admin/AdminKyc";
import CashPayment from "./pages/payment/CashPayment";
import SessionVoucher from "./pages/charging/SessionVoucher";
import ResetPassword from "./pages/ResetPassword";
import { useLayoutEffect } from "react";

const queryClient = new QueryClient();

const ChargingGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const isCharging = sessionStorage.getItem("IS_CHARGING") === "true";
    
    // Các đường dẫn được phép đi khi đang sạc 
    const allowedPaths = ["/charging", "/charging/receipt", "/session/payment"]; 
    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));

    if (isCharging && !isAllowed) {
      console.warn("🚨 ChargingGuard: Phát hiện tẩu thoát trái phép! Đang bắt quay lại chuồng...");
      
      // Bắt quay lại trang sạc ngay lập tức
      // Dùng replace: true để xóa lịch sử 'đi lạc'
      // Lấy lại sessionId từ localStorage để quay lại đúng phiên
      const lastSessionKey = Object.keys(localStorage).find(k => k.startsWith("session_meta_"));
      let query = "";
      if (lastSessionKey) {
         const meta = JSON.parse(localStorage.getItem(lastSessionKey) || "{}");
         if (meta.reservationId && meta.vehicleId) {
             const sessionId = lastSessionKey.replace("session_meta_", "");
             query = `?sessionId=${sessionId}&reservationId=${meta.reservationId}&vehicleId=${meta.vehicleId}`;
         }
      }

      navigate(`/charging${query}`, { replace: true });
    }
  }, [location, navigate]);
  return null; 
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChargingGuard />
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
          <Route path="/admin/voucher" element={<AdminVoucher />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/add-station" element={<AdminAddStation />} />
          <Route path="/reservation/deposit" element={<ReservationDeposit />} />
          <Route path="/depositss" element={<DepositSS />} />
          <Route path="/kyc" element={<KycPage />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/charging" element={<ChargingSessionPage />} />
          <Route path="/charging/receipt" element={<ChargingReceiptPage />} />
          <Route path="/session/payment" element={<SessionPayment />} />
          <Route path="/session/voucher" element={<SessionVoucher />} />
          <Route path="/session/payment/cash" element={<CashPayment />} />
          <Route path="/session-payment-result" element={<SessionPaymentResult />} />
          <Route path="/wallet/topup-result" element={<WalletTopupResult />} />
          <Route path="/voucher" element={<VoucherPage />} />
          <Route path="/stations/:stationId/review" element={<StationReviewPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
