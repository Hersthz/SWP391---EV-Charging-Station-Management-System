import { Map, Zap, Wallet, History, Settings, HeadphonesIcon } from "lucide-react";
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
      color: "bg-green-500",
      btnText: "Open Map",
      btnAction: () => navigate("/map"),
      bg: "from-green-50 to-green-100 border-green-200",
    },
    {
      icon: History,
      title: "Charging History",
      desc: "See your previous sessions",
      color: "bg-orange-500",
      btnText: "View History",
      btnAction: () => navigate("/reports"),
      bg: "from-orange-50 to-orange-100 border-orange-200",
    },
    {
      icon: Wallet,
      title: "Wallet & Payments",
      desc: "Manage balance and transactions",
      color: "bg-purple-500",
      btnText: "Open Wallet",
      btnAction: () => {},
      bg: "from-purple-50 to-purple-100 border-purple-200",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      desc: "Contact us for help",
      color: "bg-teal-500",
      btnText: "Contact",
      btnAction: () => {},
      bg: "from-teal-50 to-teal-100 border-teal-200",
    },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((item, i) => (
          <Card
            key={i}
            className={`bg-gradient-to-br ${item.bg} hover:shadow-lg transition-all duration-300`}
          >
            <CardContent className="h-full min-h-[200px] p-6 flex flex-col items-center justify-between text-center">
              {/* Icon */}
              <div className={`p-3 ${item.color} rounded-xl`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>

              {/* Text block */}
              <div className="flex flex-col items-center justify-center w-full">
                <h3 className="mt-3 text-lg font-semibold leading-tight antialiased line-clamp-2 min-h-[44px]">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {item.desc}
                </p>
              </div>

              <Button
                size="sm"
                className="w-full rounded-lg font-medium
                            bg-gradient-to-r from-primary to-accent text-white shadow-sm
                            hover:from-primary/90 hover:to-accent/90 hover:scale-105 hover:shadow-md
                            transition-all duration-300"
                onClick={item.btnAction}
              >
                {item.btnText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
