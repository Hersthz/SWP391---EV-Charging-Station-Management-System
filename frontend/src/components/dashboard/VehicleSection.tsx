import { Car, Zap, Plug, Gauge, Wrench, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const VehicleSection = () => {
  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[0_12px_40px_-12px_rgba(2,6,23,0.18)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <Car className="w-5 h-5 text-slate-500" /> Your EV
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Header line */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-slate-900">Tesla Model 3</div>
            <div className="text-sm text-slate-500">2023 • Long Range</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1"><Plug className="w-3.5 h-3.5" /> Type 2</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">CCS</Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">VIN • ****7821</Badge>
            </div>
          </div>
        </div>

        {/* Battery + Charge */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Battery Health</span>
            <span className="font-semibold text-slate-900">96%</span>
          </div>
          <Progress value={96} className="h-2.5 rounded-full overflow-hidden bg-slate-100">
          </Progress>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Current Charge</span>
            <span className="font-semibold text-slate-900">78%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-[78%] bg-gradient-to-r from-emerald-500 to-sky-500" />
          </div>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Gauge className="w-4 h-4" /> Range (EPA)</div>
            <div className="mt-1 font-semibold text-slate-900">400 km</div>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Zap className="w-4 h-4" /> Max Power</div>
            <div className="mt-1 font-semibold text-slate-900">250 kW</div>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 bg-white/60">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Wrench className="w-4 h-4" /> Next Service</div>
            <div className="mt-1 font-semibold text-slate-900">12/2025 • 10k km</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleSection;