import { CheckCircle2, User, CalendarClock, BatteryCharging, Activity, Trophy, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";

const Spark = ({ data = [6, 9, 7, 10, 8, 12, 11] }: { data?: number[] }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-6">
      {data.map((v, i) => (
        <div key={i} className="w-1.5 rounded-sm bg-gradient-to-t from-emerald-400/50 to-emerald-500" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
};

const ProfileSection = () => {
  const fullName = String(localStorage.getItem("full_name") || "Unknown User");
  const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  const role = (localStorage.getItem("role") || "Driver").toString();

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[0_12px_40px_-12px_rgba(2,6,23,0.18)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <User className="w-5 h-5 text-slate-500" />
          Driver Profile
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Top identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="shadow-sm ring-2 ring-white">
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-900">{fullName}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-gradient-to-r from-emerald-500/15 to-sky-500/15 text-emerald-700 border-emerald-500/20">Premium</Badge>
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">{role}</Badge>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><CalendarClock className="w-4 h-4" /> Member Since</div>
            <div className="mt-1 font-semibold text-slate-900">Jan 2023</div>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Activity className="w-4 h-4" /> Total Sessions</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-semibold text-slate-900">147</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><BatteryCharging className="w-4 h-4" /> Energy</div>
            <div className="mt-1 font-semibold text-slate-900">2.4 MWh</div>
          </div>
        </div>

        {/* Session trend mini-spark + achievement */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50 to-white p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200"><Trophy className="w-4 h-4 text-amber-600" /></div>
            <div>
              <div className="text-sm font-medium text-slate-900">Gold Member</div>
              <div className="text-xs text-slate-500">Top 10% drivers in city</div>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <Spark />
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
              +12% <ArrowRight className="w-3 h-3" />
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
