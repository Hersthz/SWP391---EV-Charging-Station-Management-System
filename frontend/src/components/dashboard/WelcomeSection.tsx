import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CalendarDays, Clock, MapPin, Zap, TrendingUp, Battery } from "lucide-react";

const WelcomeSection = () => {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" :
    currentHour < 18 ? "Good afternoon" : "Good evening";

  const currentDate = new Date();
  // You can change locale as needed:
  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        <Card className="bg-gradient-hero border-0 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20"></div>
          <CardContent className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {greeting}, {localStorage.getItem("full_name")} 👋
                  </h1>
                  <p className="text-white/80 text-lg">
                    Ready for today’s journey?
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-white/70">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">{dateString}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {currentDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs text-white/70">Fast charge</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                    <Battery className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs text-white/70">85% Battery</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Sessions this week</p>
                <p className="text-2xl font-bold text-green-700">12</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                +3 from last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Savings this month</p>
                <p className="text-2xl font-bold text-blue-700">$45.80</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                Compared to gas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Favorite station</p>
                <p className="text-lg font-bold text-purple-700">Downtown #3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                2.1 km
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeSection;
