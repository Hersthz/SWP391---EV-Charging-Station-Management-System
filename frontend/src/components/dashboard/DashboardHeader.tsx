import { useMemo, useState } from "react";
import { Bell, Settings, User, LogOut, Zap, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationModal from "../homepage/NotificationModal";
import api from "../../api/axios";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const userId =
    Number(localStorage.getItem("user_id") ||
          localStorage.getItem("userId") ||
          localStorage.getItem("id") || "");
  const fullName = (localStorage.getItem("fullName") || "Unknown User").toString();
  const initials = useMemo(
    () =>
      fullName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [fullName]
  );

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      localStorage.clear();
      toast.success("Signed out successfully!");
      navigate("/");
    } catch {
      toast.error("Logout failed!");
    }
  };

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50",
        // Glass + subtle pattern
        "border-b border-white/25",
        "bg-[radial-gradient(1200px_800px_at_0%_-40%,rgba(14,165,233,.14),transparent_35%),",
        "radial-gradient(1200px_800px_at_100%_-60%,rgba(16,185,129,.14),transparent_35%),",
        "linear-gradient(180deg,rgba(255,255,255,.90),rgba(255,255,255,.78))] backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-white/70",
        "shadow-[0_10px_40px_-24px_rgba(2,6,23,.45)]",
      ].join(" ")}
      role="banner"
    >
      <div className="pointer-events-auto mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-3 outline-none"
          aria-label="Go to dashboard"
        >
          <div className="relative transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95">
            <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-[inset_0_1px_6px_rgba(255,255,255,.55),0_16px_36px_-18px_rgba(14,165,233,.55)]">
              <Zap className="w-5 h-5 text-white drop-shadow" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">ChargeHub</span>
            <span className="text-[11px] text-slate-500 -mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              secure & real-time
            </span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-300 transition motion-safe:active:scale-95"
            onClick={() => setShowNotifications(true)}
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
          </Button>

          {/* User Avatar  */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={[
                  "group relative grid place-items-center w-11 h-11 rounded-2xl",
                  "bg-white/75 backdrop-blur-sm border border-white/70",
                  "shadow-[0_10px_24px_-12px_rgba(2,6,23,.28)]",
                  "transition will-change-transform hover:scale-[1.03] active:scale-95",
                  // 3D tilt on hover (very subtle)
                  "hover:[transform:perspective(800px)_rotateX(2deg)_rotateY(-2deg)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                ].join(" ")}
                aria-label="Open user menu"
                title={fullName}
              >
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-50/60 to-slate-100/60" />
                <span className="relative z-[1] font-bold text-[11px] text-slate-700">
                  {initials}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-56 shadow-xl rounded-xl p-1"
            >
              <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-lg text-red-600 focus:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Accent progress-like bar */}
      <div className="pointer-events-none h-[6px] bg-[linear-gradient(90deg,#0EA5E9,40%,#10B981,70%,#06B6D4)]" />
      <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} userId={userId}/>
    </header>
  );
};

export default DashboardHeader;
