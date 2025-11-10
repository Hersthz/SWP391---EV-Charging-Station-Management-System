// src/pages/_parts/VehicleSection.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Car, Plug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

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
  currentSoc?: number;     // 0..1 or 0..100
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

/* =========================
   Component
========================= */
const VehicleSection = () => {
  const [list, setList] = useState<VehicleBE[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // fetch vehicles of current user
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const meRes = await api.get<UserMe | any>("/auth/me", { withCredentials: true });
        const uid = (meRes.data?.user_id ?? meRes.data?.id) as number | undefined;
        if (!uid) throw new Error("No userId");

        const vRes = await api.get<any>(`/vehicle/${uid}`, { withCredentials: true });
        const arr: VehicleBE[] = (vRes?.data?.data ?? vRes?.data ?? []) as VehicleBE[];

        if (!ignore) {
          setList(arr);
          if (arr.length > 0) setIdx(0);
        }
      } catch {
        if (!ignore) setList([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // luôn xác định veh, tags, socPct bằng hook trước MỌI return sớm
  const veh = list[idx];

  const tags = useMemo(() => {
    const arr: string[] = [];
    if (veh?.chargerType) arr.push(veh.chargerType);
    if (veh?.connectorStandard) arr.push(veh.connectorStandard);
    return Array.from(new Set(arr));
  }, [veh]);

  const socPct = useMemo(() => {
    if (typeof veh?.currentSoc !== "number") return undefined;
    return Math.max(0, Math.min(100, pctFrom01or100(veh.currentSoc)!));
  }, [veh]);

  /* =========================
     Selector handlers
  ========================= */
  const select = useCallback(
    (i: number) => {
      if (!list.length) return;
      const n = Math.max(0, Math.min(i, list.length - 1));
      setIdx(n);
    },
    [list]
  );

  const prev = useCallback(
    () => select((idx - 1 + (list.length || 1)) % (list.length || 1)),
    [idx, list.length, select]
  );

  const next = useCallback(
    () => select((idx + 1) % (list.length || 1)),
    [idx, list.length, select]
  );

  // KHÔNG return sớm trước hook; điều kiện hóa ngay trong JSX
  const shouldHide = !loading && list.length === 0;

  return shouldHide ? null : (
    <div className="group [perspective:1200px]">
      {/* Selector row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {list.map((v, i) => {
            const active = i === idx;
            return (
              <Button
                key={v.id ?? i}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => select(i)}
                className={
                  active
                    ? "rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow"
                    : "rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                }
              >
                {(v.make || "EV")} {(v.model || "")}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={prev}
            disabled={list.length < 2 || loading}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={next}
            disabled={list.length < 2 || loading}
          >
            ›
          </Button>
        </div>
      </div>

      <Card
        className="
          relative overflow-hidden rounded-3xl border border-white/40 bg-white/70
          shadow-[0_24px_80px_-28px_rgba(2,6,23,0.28)] backdrop-blur-xl
          transition-transform duration-300 group-hover:[transform:rotateX(2deg)_rotateY(2deg)_translateZ(8px)]
        "
      >
        {/* moving gradient ribbon */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl
                      after:absolute after:inset-[-2px] after:rounded-[inherit]
                      after:bg-[conic-gradient(from_var(--ang),theme(colors.sky.400),theme(colors.emerald.400),theme(colors.sky.400))]
                      after:opacity-60 after:blur-[10px] motion-safe:animate-[spin-slow_10s_linear_infinite]"
        />

        <CardHeader className="relative z-[1] pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <Car className="w-5 h-5 text-slate-500" /> Your EV
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-[1]">
          <AnimatePresence mode="wait">
            {/* Key theo vehicle để animate khi đổi */}
            <motion.div
              key={veh?.id ?? idx}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-5"
            >
              {/* header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {loading ? "…" : `${veh?.make ?? "—"} ${veh?.model ?? ""}`.trim()}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <Badge
                        key={t}
                        className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 rounded-full"
                      >
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
                  <span className="font-semibold text-slate-900">
                    {typeof socPct === "number" ? `${socPct}%` : "—"}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[inset_0_0_6px_rgba(255,255,255,.35)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${socPct ?? 0}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleSection;
