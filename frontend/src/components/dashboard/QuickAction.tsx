import { Map, Wallet, History, HeadphonesIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Map,
      title: "View Map",
      desc: "Explore charging stations near you",
      action: () => navigate("/map"),
      tone: {
        grad: "from-emerald-500 via-teal-500 to-cyan-500",
        ring: "ring-emerald-200/50",
        glow: "shadow-[0_24px_60px_-18px_rgba(16,185,129,.55)]",
        btnText: "text-emerald-700",
        orb: "bg-emerald-300/30",
      },
      btnText: "Open Map",
    },
    {
      icon: History,
      title: "Report",
      desc: "View your charging history and analytics",
      action: () => navigate("/reports"),
      tone: {
        grad: "from-orange-500 via-rose-500 to-pink-500",
        ring: "ring-orange-200/50",
        glow: "shadow-[0_24px_60px_-18px_rgba(249,115,22,.55)]",
        btnText: "text-orange-700",
        orb: "bg-orange-300/30",
      },
      btnText: "View Reports",
    },
    {
      icon: Wallet,
      title: "Wallet & Payments",
      desc: "Manage balance and transactions",
      action: () => navigate("/wallet"),
      tone: {
        grad: "from-indigo-500 via-violet-500 to-fuchsia-500",
        ring: "ring-indigo-200/50",
        glow: "shadow-[0_24px_60px_-18px_rgba(99,102,241,.55)]",
        btnText: "text-indigo-700",
        orb: "bg-indigo-300/30",
      },
      btnText: "Open Wallet",
    },
    {
      icon: HeadphonesIcon,
      title: "Your Plan",
      desc: "Manage your subscription",
      action: () => navigate("/subscription"),
      tone: {
        grad: "from-emerald-600 via-green-500 to-lime-500",
        ring: "ring-emerald-200/50",
        glow: "shadow-[0_24px_60px_-18px_rgba(16,185,129,.55)]",
        btnText: "text-emerald-700",
        orb: "bg-lime-300/30",
      },
      btnText: "View Subscription",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
      </div>

      <div
        className="
          grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6
          [perspective:1200px]
        "
      >
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <Card
              key={i}
              role="button"
              tabIndex={0}
              aria-label={a.title}
              onClick={a.action}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && a.action()}
              className={[
                "group relative overflow-hidden border-0 rounded-3xl ring-1",
                "bg-gradient-to-br", a.tone.grad, a.tone.ring, a.tone.glow,
                "transition-all duration-500",
                "motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02]",
                "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,.6)]",
                "cursor-pointer",
              ].join(" ")}
            >
              {/* Animated conic border halo */}
              <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-70
                              before:absolute before:inset-[-2px] before:rounded-[inherit]
                              before:bg-[conic-gradient(from_var(--ca,_0deg),#fff8,transparent_30%,#fff8_60%,transparent_85%)]
                              motion-safe:before:animate-spin-slower" />

              {/* Soft blobs */}
              <div className="pointer-events-none absolute -top-10 -right-12 h-40 w-40 rounded-full blur-3xl bg-white/30" />
              <div className="pointer-events-none absolute -bottom-14 -left-16 h-40 w-40 rounded-full blur-3xl bg-black/10" />

              <CardContent
                className="
                  relative p-6 text-white min-h-[230px]
                  grid grid-cols-[60px_1fr] grid-rows-[auto_auto_1fr_auto] gap-x-4 gap-y-3
                  transform-gpu
                  motion-safe:group-hover:[transform:rotateX(3deg)_rotateY(-3deg)_translateZ(6px)]
                "
              >
                {/* Icon orb */}
                <div
                  className={[
                    "row-start-1 col-start-1 size-[58px] rounded-2xl",
                    "bg-white/25 backdrop-blur-sm border border-white/30",
                    "flex items-center justify-center",
                    "shadow-[inset_0_1px_4px_rgba(255,255,255,.45),0_10px_30px_-10px_rgba(0,0,0,.35)]",
                    "relative overflow-hidden",
                  ].join(" ")}
                >
                  <span className={`absolute -inset-2 rounded-[inherit] ${a.tone.orb}`} />
                  <Icon className="relative z-[1] size-[26px] text-white drop-shadow" />
                </div>

                {/* Title */}
                <h3
                  className="
                    row-start-1 col-start-2 text-[22px] font-black leading-tight
                    drop-shadow-sm tracking-tight
                  "
                >
                  {a.title}
                </h3>

                {/* Description */}
                <p className="row-start-2 col-span-2 text-[13px]/5 opacity-95">
                  {a.desc}
                </p>

                {/* Spacer */}
                <div className="row-start-3 col-span-2" />

                {/* CTA button with shine */}
                <div className="row-start-4 col-span-2 flex justify-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      a.action();
                    }}
                    className={[
                      "relative h-11 rounded-2xl font-semibold shadow-sm",
                      "bg-white text-base", a.tone.btnText,
                      "transition-all hover:shadow-md active:scale-[.985]",
                      "focus-visible:ring-2 focus-visible:ring-white/60",
                      "overflow-hidden",
                    ].join(" ")}
                  >
                    {/* Shine */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full
                                     bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.8),transparent)]
                                     motion-safe:group-hover:animate-shine" />
                    {a.btnText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActions;

