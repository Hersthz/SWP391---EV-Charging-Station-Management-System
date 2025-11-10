import { BarChart3, Award, Shield, ChevronRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

type Item = {
  icon: any;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  href?: string;
  kpi?: string;
};

const StatsSection = () => {
  const navigate = useNavigate();

  const highlights: Item[] = [
    {
      icon: BarChart3,
      label: "View Reports",
      description: "Detailed statistics & trends",
      color: "text-sky-700",
      bg: "bg-sky-50",
      border: "border-sky-200",
      kpi: "+14%",
    },
    {
      icon: Award,
      label: "Achievements",
      description: "Level: Gold Member",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      kpi: "3 badges",
    },
    {
      icon: Shield,
      label: "Security",
      description: "Account protected & up-to-date",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      kpi: "2FA On",
    },
  ];

  return (
    <div className="space-y-3">
      {highlights.map((item, i) => (
        <Card
          key={i}
          className={`${item.bg} ${item.border} rounded-2xl border transition-all cursor-pointer hover:shadow-[0_10px_30px_-12px_rgba(2,6,23,0.18)] hover:-translate-y-[1px]`}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white/70 border border-white/60 mr-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`font-semibold ${item.color}`}>{item.label}</div>
                  {item.kpi && (
                    <Badge className="h-5 bg-white/60 text-slate-700 border-white/80 flex gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> {item.kpi}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-600">{item.description}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsSection;