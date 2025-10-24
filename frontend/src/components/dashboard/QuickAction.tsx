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
        bg: "from-emerald-500 via-teal-500 to-cyan-500",
        ring: "ring-emerald-200/40",
        glow: "shadow-[0_10px_30px_-5px_rgba(16,185,129,.55)]",
        btnText: "text-emerald-700",
      },
      btnText: "Open Map",
    },
    {
      icon: History,
      title: "Charging History",
      desc: "See your previous sessions",
      action: () => navigate("/reports"),
      tone: {
        bg: "from-orange-500 via-rose-500 to-pink-500",
        ring: "ring-orange-200/50",
        glow: "shadow-[0_10px_30px_-5px_rgba(249,115,22,.55)]",
        btnText: "text-orange-700",
      },
      btnText: "View History",
    },
    {
      icon: Wallet,
      title: "Wallet & Payments",
      desc: "Manage balance and transactions",
      action: () => navigate("/wallet"),
      tone: {
        bg: "from-indigo-500 via-violet-500 to-fuchsia-500",
        ring: "ring-indigo-200/50",
        glow: "shadow-[0_10px_30px_-5px_rgba(99,102,241,.55)]",
        btnText: "text-indigo-700",
      },
      btnText: "Open Wallet",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      desc: "Contact us for help",
      action: () => navigate("/charging"),
      tone: {
        bg: "from-emerald-600 via-green-500 to-lime-500",
        ring: "ring-emerald-200/40",
        glow: "shadow-[0_10px_30px_-5px_rgba(16,185,129,.55)]",
        btnText: "text-emerald-700",
      },
      btnText: "Contact",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
        <span className="text-xs text-muted-foreground">Handy shortcuts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {actions.map((a, i) => (
          <Card
            key={i}
            className={[
              "relative overflow-hidden border-0 rounded-2xl ring-1",
              "bg-gradient-to-br", a.tone.bg,
              a.tone.ring, a.tone.glow,
              "transition-all duration-300 hover:scale-[1.012] hover:shadow-2xl",
            ].join(" ")}
          >
            {/* decoration */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

            <CardContent className="
              relative p-6 text-white min-h-[220px]
              grid grid-cols-[56px_1fr] grid-rows-[auto_auto_1fr_auto] gap-x-3 gap-y-3
            ">
              {/* row1 col1: icon */}
              <div className="row-start-1 col-start-1 col-end-2 size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
                <a.icon className="size-6 text-white" />
              </div>

              {/* row1 col2: title */}
              <h3 className="row-start-1 col-start-2 text-[22px] font-extrabold leading-tight">
                {a.title}
              </h3>

              {/* row2  */}
              <p className="row-start-2 col-span-2 text-sm leading-snug opacity-95">
                {a.desc}
              </p>

              {/* row3  */}
              <div className="row-start-3 col-span-2" />

              {/* row4 button */}
              <div className="row-start-4 col-span-2">
                <Button
                  onClick={a.action}
                  className={[
                    "h-11 w-full rounded-xl font-semibold shadow-sm hover:shadow",
                    "bg-white text-base", a.tone.btnText,
                  ].join(" ")}
                >
                  {a.btnText}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;