"use client";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Zap, Battery, TrendingUp, Star, Play, ArrowRight } from "lucide-react";
import heroImage from "../../assets/hero-charging.jpg";
import heroBackground from "../../assets/hero-background.jpg";
import { ScrollReveal } from "../lightswind/scroll-reveal";
import { CountUp } from "../lightswind/count-up";
import { TrustedUsers } from "../lightswind/trusted-users";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/* ====== Animation variants ====== */
// Easing 
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Page fade
const pageVariants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { delay, duration: 0.5, ease: EASE_OUT }
  })
} satisfies Variants;

// Stagger container
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } }
};

// Fade up
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }
} satisfies Variants;

// Scale in
const scaleIn = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } }
} satisfies Variants;

// Floating badges
const floatIn = (d = 0): Variants => ({
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { delay: d, duration: 0.45, ease: EASE_OUT } }
});

const Hero = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.section
      id="hero"
      className="
        relative isolate overflow-hidden overflow-x-clip
        min-h-screen min-h-[100svh]
        flex items-center pt-28 pb-12 px-4
      "
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label="Hero"
      initial="hidden"
      animate="visible"
      // nếu user bật reduce motion: render ngay, không animate
      variants={prefersReducedMotion ? undefined : pageVariants}
    >
      <motion.div
        className="
          absolute inset-0 -z-10
          bg-[radial-gradient(1200px_600px_at_22%_32%,rgba(0,0,0,.48),transparent_60%)]
          md:bg-[radial-gradient(1400px_700px_at_30%_35%,rgba(0,0,0,.44),transparent_66%)]
        "
        variants={prefersReducedMotion ? undefined : pageVariants}
        custom={0.05}
      />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial="hidden"
          animate="visible"
          variants={prefersReducedMotion ? undefined : stagger}
        >
          {/* LEFT */}
          <motion.div className="text-white space-y-8 min-w-0" variants={prefersReducedMotion ? undefined : stagger}>
            {/* Label line */}
            <motion.div className="flex items-center gap-3 mb-1" variants={prefersReducedMotion ? undefined : fadeUp}>
              <div className="w-10 h-10 rounded-xl grid place-items-center shadow-xl bg-gradient-to-tr from-emerald-500 to-cyan-600">
                <Zap className="w-5 h-5 text-white" />
              </div>

              <span
                className="
                  font-extrabold uppercase tracking-[0.28em]
                  text-[clamp(0.95rem,1.8vw,1.15rem)] text-white
                  [text-shadow:0_0_34px_rgba(16,185,129,.55),0_0_18px_rgba(6,182,212,.45)]
                "
              >
                The future of EV charging
              </span>

              <Badge
                variant="secondary"
                className="px-3 py-1.5 rounded-full border-none text-white bg-gradient-to-r from-emerald-500 to-cyan-600 shadow"
              >
                V3.0 ⚡
              </Badge>
            </motion.div>

            {/* Heading */}
            <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
              <ScrollReveal size="2xl" align="left" variant="default">
                <h1
                  className="
                    font-extrabold tracking-tight leading-[1.05]
                    text-[clamp(2.2rem,5.6vw,4rem)]
                    [text-shadow:0_14px_44px_rgba(6,182,212,.36),0_4px_18px_rgba(0,0,0,.45)]
                  "
                >
                  Real-time stations, reliable bookings & elegant dashboards
                </h1>
              </ScrollReveal>
            </motion.div>

            <motion.p
              className="text-[clamp(1rem,1.6vw,1.25rem)] text-white/90 leading-relaxed max-w-2xl"
              variants={prefersReducedMotion ? undefined : fadeUp}
            >
              Live availability, queue-aware reservations, secure payments, and operations-grade
              monitoring for drivers &amp; operators.
            </motion.p>

            {/* CTAs */}
            <motion.div className="flex flex-col sm:flex-row gap-4 pt-1" variants={prefersReducedMotion ? undefined : fadeUp}>
              <Button
                variant="default"
                size="lg"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg hover:brightness-110"
                onClick={() => (window.location.href = "/login")}
              >
                <span className="relative z-10">Get started today</span>
                <Zap className="w-5 h-5 relative z-10 ml-2" />
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 bg-white/20" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="group rounded-2xl border-2 bg-white/85 backdrop-blur text-foreground"
                onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore the network
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* KPIs */}
            <motion.div
              className="mt-6 grid gap-4 md:gap-6 min-w-0 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]"
              variants={prefersReducedMotion ? undefined : stagger}
            >
              <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
                <Stat label="Charging sessions">
                  <CountUp
                    value={2000000}
                    duration={2.0}
                    suffix=" +"
                    numberClassName="font-extrabold tracking-tight leading-none text-[clamp(1.8rem,4.4vw,2.4rem)] whitespace-nowrap overflow-hidden [&>span:last-child]:text-[0.6em] [&>span:last-child]:ml-1 [&>span:last-child]:font-bold"
                  />
                </Stat>
              </motion.div>

              <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
                <Stat label="Average speed">
                  <CountUp
                    value={150}
                    duration={2.0}
                    suffix=" kW"
                    numberClassName="font-extrabold tracking-tight leading-none text-[clamp(1.8rem,4.4vw,2.4rem)] whitespace-nowrap overflow-hidden [&>span:last-child]:text-[0.58em] [&>span:last-child]:ml-1 [&>span:last-child]:font-semibold"
                  />
                </Stat>
              </motion.div>

              <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
                <Stat label="Setup time">
                  <CountUp
                    value={30}
                    duration={2.0}
                    suffix=" s"
                    numberClassName="font-extrabold tracking-tight leading-none text-[clamp(1.8rem,4.4vw,2.4rem)] whitespace-nowrap overflow-hidden [&>span:last-child]:text-[0.58em] [&>span:last-child]:ml-1 [&>span:last-child]:font-semibold"
                  />
                </Stat>
              </motion.div>

              <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
                <Stat label="Satisfaction">
                  <CountUp
                    value={95}
                    duration={2.0}
                    suffix="%"
                    numberClassName="font-extrabold tracking-tight leading-none text-[clamp(1.8rem,4.4vw,2.4rem)] whitespace-nowrap overflow-hidden [&>span:last-child]:text-[0.6em] [&>span:last-child]:ml-1 [&>span:last-child]:font-bold"
                  />
                </Stat>
              </motion.div>
            </motion.div>

            {/* Trusted users */}
            <motion.div
              className="inline-flex items-center rounded-full border border-white/15 bg-black/25 backdrop-blur px-4 py-2 shadow-[0_8px_30px_rgba(0,0,0,.35)] text-white/95"
              variants={prefersReducedMotion ? undefined : fadeUp}
            >
              <TrustedUsers
                avatars={[
                  "https://i.pravatar.cc/60?img=32",
                  "https://i.pravatar.cc/60?img=5",
                  "https://i.pravatar.cc/60?img=8",
                  "https://i.pravatar.cc/60?img=15",
                ]}
                rating={5}
                totalUsersText={12000}
                caption="Trusted by"
                ringColors={["ring-emerald-500", "ring-sky-500", "ring-fuchsia-500", "ring-amber-500"]}
                className="[&_*]:text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,.65)] [text-shadow:0_0_22px_rgba(34,197,94,.28)]"
              />
            </motion.div>
          </motion.div>

          {/* RIGHT media */}
          <motion.div className="relative min-w-0" variants={prefersReducedMotion ? undefined : scaleIn}>
            <motion.img
              src={heroImage}
              alt="Electric vehicle charging at a modern station"
              className="w-full rounded-3xl shadow-xl transition-transform duration-700 will-change-transform group-hover:scale-[1.02]"
              loading="eager"
              decoding="async"
              initial="hidden"
              animate="visible"
              variants={prefersReducedMotion ? undefined : scaleIn}
            />

            {/* Battery */}
            <motion.div
              className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border"
              initial="hidden"
              animate="visible"
              variants={prefersReducedMotion ? undefined : floatIn(0.15)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-cyan-600 rounded-xl grid place-items-center">
                  <Battery className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Battery status</p>
                  <p className="text-2xl font-bold text-primary">85%</p>
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Network */}
            <motion.div
              className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border"
              initial="hidden"
              animate="visible"
              variants={prefersReducedMotion ? undefined : floatIn(0.25)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-600 rounded-xl grid place-items-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Network status</p>
                  <p className="text-2xl font-bold text-cyan-600">Online</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    All systems operational
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rating */}
            <motion.div
              className="absolute top-1/2 -left-4 bg-emerald-600/90 text-white rounded-xl px-3 py-2 shadow"
              initial="hidden"
              animate="visible"
              variants={prefersReducedMotion ? undefined : floatIn(0.35)}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="text-sm font-bold">4.9</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #hero * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </motion.section>
  );
};

/* ======= KPI Card ======= */
function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="
        group relative min-w-0 w-full rounded-3xl px-6 py-6
        border border-white/16 bg-white/12 backdrop-blur
        supports-[backdrop-filter]:bg-white/10
        shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]
      "
    >
      <span
        className="
          pointer-events-none absolute inset-0 rounded-3xl
          bg-[linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0)_40%)]
          opacity-70"
        aria-hidden
      />
      <div className="relative min-w-0 w-full flex items-baseline gap-2 whitespace-nowrap overflow-hidden leading-none">
        {children}
      </div>
      <div className="relative mt-2 text-sm text-white/85">{label}</div>
    </div>
  );
}

export default Hero;
