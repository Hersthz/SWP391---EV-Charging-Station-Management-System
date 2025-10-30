// src/components/dashboard/WelcomeSection.tsx
import { Card, CardContent } from "../../components/ui/card";
import { Battery, CalendarDays, Clock, MapPin, Zap, ShieldCheck } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { motion, useReducedMotion, cubicBezier, type Variants } from "framer-motion";
import { useMemo } from "react";

const WelcomeSection = () => {
  const prefersReduce = useReducedMotion();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" :
    currentHour < 18 ? "Good afternoon" : "Good evening";

  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const fullName = String(localStorage.getItem("fullName") || "Guest");
  const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  // Motion variants (type-safe)
  const easeStandard = cubicBezier(0.2, 0.8, 0.2, 1);
  const container: Variants = {
    hidden: { opacity: 0, y: 6 },
    show: {
      opacity: 1, y: 0,
      transition: { type: "tween", duration: 0.5, ease: easeStandard, when: "beforeChildren", staggerChildren: 0.06 }
    }
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.45, ease: easeStandard } }
  };

  // ===== BUBBLES CONFIG (tròn đều + rải đều theo cột) =====
  // 14 cột ảo x 3 “làn” khởi phát để toàn hero lúc nào cũng có bong bóng nổi ở các vùng khác nhau
  const bubbles = useMemo(() => {
    const cols = 14, lanes = 3;
    const arr: {
      leftPct: number; // 0..100
      size: number;    // px
      delay: number;   // s
      duration: number;// s
      driftX: number;  // px
    }[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; // pseudo-random ổn định

    for (let lane = 0; lane < lanes; lane++) {
      for (let c = 0; c < cols; c++) {
        const jitter = (rnd() - 0.5) * (100 / cols) * 0.35; // lệch nhẹ để không quá đều tăm tắp
        const leftPct = (c * (100 / (cols - 1))) + jitter;
        const size = 10 + Math.round(rnd() * 22);           // 10..32px
        const duration = 9 + Math.round(rnd() * 8);         // 9..17s
        const delay = lane * 1.2 + c * 0.18 + rnd() * 0.8;  // lệch pha theo cột/làn
        const driftX = (rnd() > 0.5 ? 1 : -1) * (8 + rnd() * 28); // 8..36px trái/phải
        arr.push({ leftPct, size, delay, duration, driftX });
      }
    }
    return arr;
  }, []);

  return (
    <section className="space-y-6">
      {/* === HERO (Dark premium + full-field round bubbles) === */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-200/70 shadow-[0_12px_40px_-12px_rgba(2,6,23,0.12)]">
        {/* Dark multi-layer gradient — gần bản cũ nhưng sâu & đều hơn */}
        <div className="absolute inset-0 bg-[linear-gradient(140deg,#075985_0%,#0e7490_38%,#0f766e_72%,#075985_100%)]" />
        {/* Vignette để đảm bảo contrast chữ */}
        <div className="absolute inset-0 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_25%,rgba(0,0,0,0.22)_85%)]" />
        {/* Dot-grid nhẹ cho texture enterprise */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.10] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Bubbles: dùng span tuyệt đối => luôn tròn (không méo vì tỷ lệ container) */}
        {!prefersReduce && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {bubbles.map((b, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${Math.max(0, Math.min(100, b.leftPct))}%`,
                  bottom: -b.size,              // phát sinh từ mép dưới
                  width: b.size,
                  height: b.size,
                  // mềm viền bằng radial-gradient (giống kính nổi)
                  background:
                    "radial-gradient( circle at 50% 40%, rgba(255,255,255,0.9), rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.0) 60% )",
                  filter: "blur(0.2px)",
                  opacity: 0
                }}
                animate={{
                  // đi lên ~ 120% chiều cao hero (dùng px lớn cho chắc trên các viewport)
                  y: [0, -480],
                  x: [0, b.driftX, 0],
                  opacity: [0, 0.55, 0]
                }}
                transition={{
                  duration: b.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: b.delay,
                  repeatDelay: 0.6
                }}
              />
            ))}
          </div>
        )}

        {/* Sweep glow rất mờ để tạo chiều sâu, không tạo hotspot */}
        {!prefersReduce && (
          <motion.div
            aria-hidden
            className="absolute right-[-15%] top-[-30%] h-[160%] w-[60%] bg-[radial-gradient(45%_55%_at_70%_35%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.08)_40%,transparent_70%)] mix-blend-screen"
            initial={{ x: 0, y: 0, rotate: -10, opacity: 0.5 }}
            animate={{ x: [-30, 20, -30], y: [-10, 18, -10], rotate: [-10, -6, -10], opacity: [0.45, 0.6, 0.45] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            style={{ WebkitMaskImage: "radial-gradient(60% 65% at 70% 35%, #000 40%, transparent 70%)" } as any}
          />
        )}

        <Card className="border-0 bg-transparent">
          <CardContent className="relative p-6 md:p-8 lg:p-10 text-white">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            >
              {/* Left: identity + time */}
              <div className="space-y-2">
                <motion.div variants={item} className="inline-flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur flex items-center justify-center font-bold">
                    {initials}
                  </div>
                  <h1 className="text-[28px] leading-[34px] md:text-[32px] md:leading-[38px] font-extrabold tracking-tight drop-shadow">
                    {greeting}, {fullName} 👋
                  </h1>
                </motion.div>

                <motion.p variants={item} className="text-white/90 text-[15px] md:text-base">
                  Ready for today’s journey?
                </motion.p>

                <motion.div variants={item} className="mt-3 flex flex-wrap items-center gap-4 text-white/90">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <CalendarDays className="w-4 h-4" />
                    {dateString}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {timeString}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WelcomeSection;
