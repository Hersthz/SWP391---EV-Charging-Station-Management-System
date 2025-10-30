import { useEffect, useMemo, useState } from "react";
import { Car, Zap, Plug, Gauge, Wrench, MapPin, Battery, IdCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import api from "../../api/axios";

/* =========================
   Types
========================= */
type VehicleBE = {
  id: number;
  make?: string;
  model?: string;
  year?: string | number;
  variant?: string;
  vin?: string;
  chargerType?: string;
  maxPower?: number;
  range?: number;
  battery?: number;        // kWh
  socNow?: number;         // 0..1 or 0..100
  batteryHealthPct?: number;
  connectorStandard?: string; // "Type 2"/"CCS"...
};

type UserMe = { id?: number; user_id?: number };

/* =========================
   Helpers
========================= */
function pctFrom01or100(x: number | undefined | null): number | undefined {
  if (x == null || Number.isNaN(Number(x))) return undefined;
  const n = Number(x);
  if (n <= 1) return Math.round(n * 100);
  return Math.round(n);
}
function maskVIN(vin?: string) {
  if (!vin) return "—";
  if (vin.length < 6) return "****";
  return `VIN • ****${vin.slice(-4)}`;
}

/* =========================
   Component
========================= */
const VehicleSection = () => {
  const [veh, setVeh] = useState<VehicleBE | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const meRes = await api.get<UserMe | any>("/auth/me", { withCredentials: true });
        const uid = (meRes.data?.user_id ?? meRes.data?.id) as number | undefined;
        if (!uid) throw new Error("No userId");

        const vRes = await api.get<any>(`/vehicle/${uid}`, { withCredentials: true });
        const list: VehicleBE[] = (vRes?.data?.data ?? vRes?.data ?? []) as VehicleBE[];
        const first = list.find((x: any) => (x as any)?.isPrimary) ?? list[0];

        if (!ignore) {
          const merged: VehicleBE = {
            id: first?.id ?? 0,
            make: first?.make ?? localStorage.getItem("vehicle_make") ?? "Tesla",
            model: first?.model ?? localStorage.getItem("vehicle_model") ?? "Model 3",
            year: String(first?.year ?? localStorage.getItem("vehicle_year") ?? "2023"),
            variant: first?.variant ?? "Long Range",
            vin: first?.vin,
            chargerType: first?.chargerType ?? "Type 2 / CCS",
            maxPower: Number(first?.maxPower ?? 250),
            range: Number(first?.range ?? 400),
            battery: Number(first?.battery ?? 75),
            connectorStandard: first?.connectorStandard ?? "CCS",
            socNow:
              pctFrom01or100(first?.socNow) ??
              Number(localStorage.getItem("soc_now") ?? 78),
            batteryHealthPct:
              Number(first?.batteryHealthPct ?? localStorage.getItem("battery_health") ?? 96),
          };
          setVeh(merged);
        }
      } catch {
        if (!ignore) {
          setVeh({
            id: 0,
            make: "Tesla",
            model: "Model 3",
            year: "2023",
            variant: "Long Range",
            vin: "5YJ3E1EA7JF000821",
            chargerType: "Type 2 / CCS",
            maxPower: 250,
            range: 400,
            battery: 75,
            connectorStandard: "CCS",
            socNow: Number(localStorage.getItem("soc_now") ?? 78),
            batteryHealthPct: Number(localStorage.getItem("battery_health") ?? 96),
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

  const tags = useMemo(() => {
    const arr: string[] = [];
    if (veh?.chargerType) arr.push(veh.chargerType);
    if (veh?.connectorStandard) arr.push(veh.connectorStandard);
    return Array.from(new Set(arr));
  }, [veh]);

  const socNowPct = typeof veh?.socNow === "number" ? Math.max(0, Math.min(100, veh.socNow)) : undefined;
  const healthPct = typeof veh?.batteryHealthPct === "number" ? Math.max(0, Math.min(100, veh.batteryHealthPct)) : undefined;

  return (
    <div className="group [perspective:1200px]">
      <Card
        className="
          relative overflow-hidden rounded-3xl border border-white/40 bg-white/70
          shadow-[0_24px_80px_-28px_rgba(2,6,23,0.28)] backdrop-blur-xl
          transition-transform duration-300 group-hover:[transform:rotateX(2deg)_rotateY(2deg)_translateZ(8px)]
        "
      >
        {/* moving gradient ribbon */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl
                        after:absolute after:inset-[-2px] after:rounded-[inherit]
                        after:bg-[conic-gradient(from_var(--ang),theme(colors.sky.400),theme(colors.emerald.400),theme(colors.sky.400))]
                        after:opacity-60 after:blur-[10px] motion-safe:animate-[spin-slow_10s_linear_infinite]" />
        <CardHeader className="relative z-[1] pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <Car className="w-5 h-5 text-slate-500" /> Your EV
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-[1] space-y-5">
          {/* header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-slate-900">
                {loading ? "…" : `${veh?.make} ${veh?.model}`}
              </div>
              <div className="text-sm text-slate-600">
                {loading ? "…" : `${veh?.year ?? "—"} • ${veh?.variant ?? ""}`}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 rounded-full">
                    <Plug className="w-3.5 h-3.5" /> {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Battery + Charge */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Current Charge</span>
              <span className="font-semibold text-slate-900">{socNowPct ?? "—"}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[inset_0_0_6px_rgba(255,255,255,.35)]
                           animate-[barin_700ms_ease-out]"
                style={{ width: `${socNowPct ?? 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleSection;

