import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, User as UserIcon, CalendarClock, BatteryCharging, Activity, Trophy,
  ArrowRight, TrendingUp, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import api from "../../api/axios";

/* =========================
   Types
========================= */
type Me = {
  id?: number;
  user_id?: number;
  full_name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  member_since?: string;
};

type DriverStats = {
  totalSessions: number;
  totalEnergyMWh: number; // MWh
  percentile?: number;    // 0..100 (xếp hạng)
  growthPct?: number;     // tăng trưởng %
};

/* =========================
   Small spark chart
========================= */
const Spark = ({ data = [6, 9, 7, 10, 8, 12, 11] }: { data?: number[] }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-7">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-[2px] bg-gradient-to-t from-emerald-400/60 to-emerald-500
                     animate-[grow_700ms_ease-out_forwards] origin-bottom"
          style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
};

function initialsOf(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

function monthYear(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

/* =========================
   Component
========================= */
const ProfileSection = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile + stats (fallback localStorage / mock)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me", { withCredentials: true });

        const name = data?.full_name ?? localStorage.getItem("full_name") ?? "Unknown User";
        const role =
          data?.role ??
          localStorage.getItem("role") ??
          (data?.authorities?.[0] ?? data?.userRole) ??
          "USER";
        const created =
          data?.member_since ??
          data?.createdAt ??
          data?.created_at ??
          localStorage.getItem("member_since") ??
          new Date().toISOString();

        if (!ignore) {
          setMe({
            id: data?.user_id ?? data?.id,
            user_id: data?.user_id ?? data?.id,
            full_name: name,
            role,
            member_since: created,
          });
        }

        try {
          const uid = data?.user_id ?? data?.id;
          let s: DriverStats | null = null;
          if (uid) {
            const res = await api.get(`/user/${uid}/stats`, { withCredentials: true });
            const raw = res?.data?.data ?? res?.data;
            if (raw) {
              s = {
                totalSessions: Number(raw.totalSessions ?? raw.sessions ?? 147),
                totalEnergyMWh: Number(raw.totalEnergyMWh ?? raw.energyMWh ?? 2.4),
                percentile: Number(raw.percentile ?? 90),
                growthPct: Number(raw.growthPct ?? 12),
              };
            }
          }
          if (!s) throw new Error("no stats endpoint");
          if (!ignore) setStats(s);
        } catch {
          if (!ignore)
            setStats({
              totalSessions: Number(localStorage.getItem("total_sessions") ?? 147),
              totalEnergyMWh: Number(localStorage.getItem("energy_mwh") ?? 2.4),
              percentile: Number(localStorage.getItem("driver_percentile") ?? 90),
              growthPct: Number(localStorage.getItem("driver_growth_pct") ?? 12),
            });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const initials = useMemo(() => initialsOf(me?.full_name), [me?.full_name]);

  const tier = useMemo(() => {
    const p = stats?.percentile ?? 90;
    if (p >= 95)
      return {
        label: "Platinum",
        chip: "bg-gradient-to-r from-fuchsia-500/15 to-violet-500/15 border-violet-300/30 text-violet-700",
        orb: "bg-violet-500/15",
      };
    if (p >= 85)
      return {
        label: "Gold",
        chip: "bg-gradient-to-r from-amber-400/20 to-yellow-400/15 border-amber-300/30 text-amber-700",
        orb: "bg-amber-400/20",
      };
    return {
      label: "Silver",
      chip: "bg-gradient-to-r from-slate-300/25 to-slate-200/20 border-slate-300/40 text-slate-700",
      orb: "bg-slate-300/25",
    };
  }, [stats?.percentile]);

  return (
    <div className="group [perspective:1200px]">
      <Card
        className="
          relative overflow-hidden rounded-3xl border border-white/40 bg-white/70
          shadow-[0_24px_80px_-28px_rgba(2,6,23,0.28)] backdrop-blur-xl
          transition-transform duration-300 group-hover:[transform:rotateX(2deg)_rotateY(-2deg)_translateZ(8px)]
        "
      >
        {/* Gradient ring (animated) */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl
                        [mask-image:radial-gradient(60%_80%_at_50%_-20%,#000_20%,transparent_60%)_]
                        before:absolute before:inset-[-2px] before:rounded-[inherit]
                        before:bg-[conic-gradient(from_0deg,theme(colors.sky.400),theme(colors.emerald.400),theme(colors.sky.400))]
                        before:opacity-70 before:blur-[10px]" />
        {/* subtle ambience */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full blur-3xl bg-sky-400/15" />
        <div className="pointer-events-none absolute -top-28 -right-16 h-64 w-64 rounded-full blur-3xl bg-emerald-400/15" />

        <CardHeader className="relative z-[1] pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <UserIcon className="w-5 h-5 text-slate-500" />
            Driver Profile
            <Badge className="ml-2 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-[1] space-y-5">
          {/* Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="shadow-sm ring-2 ring-white">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-900">{me?.full_name ?? "—"}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in fade-in" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gradient-to-r from-emerald-500/15 to-sky-500/15 text-emerald-700 border-emerald-500/20">
                    Premium
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                    {String(me?.role ?? "USER").toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-slate-200 bg-white/70 hover:bg-white/90"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Insights
            </Button>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-tile">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CalendarClock className="w-4 h-4" /> Member Since
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {monthYear(me?.member_since)}
              </div>
            </div>
            <div className="glass-tile">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Activity className="w-4 h-4" /> Total Sessions
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {loading ? "…" : stats?.totalSessions ?? 0}
              </div>
            </div>
            <div className="glass-tile">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <BatteryCharging className="w-4 h-4" /> Energy
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {loading ? "…" : `${(stats?.totalEnergyMWh ?? 0).toFixed(1)} MWh`}
              </div>
            </div>
          </div>

          {/* Achievement */}
          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${tier.chip} backdrop-blur`}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{tier.label} Member</div>
                <div className="text-xs text-slate-600">
                  Top {100 - (stats?.percentile ?? 90)}% drivers in city
                </div>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <Spark />
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1"
              >
                +{stats?.growthPct ?? 0}% <ArrowRight className="w-3 h-3" />
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;


