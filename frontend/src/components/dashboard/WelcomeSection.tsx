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
  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5">
        <Card className="border-0 shadow-xl bg-gradient-to-tr from-primary via-accent to-emerald-500 text-white">
          <CardContent className="relative p-7 md:p-9">
            {/* soft grid overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {greeting}, {localStorage.getItem("full_name")} 👋
                </h1>
                <p className="text-white/85 text-base md:text-lg">Ready for today’s journey?</p>

                <div className="flex flex-wrap gap-4 text-white/85">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">{dateString}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-md">
                    <Battery className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs mt-1 text-white/80">85% Battery</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-md rounded-2xl ring-1 ring-green-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700/80 text-sm font-medium">Sessions this week</p>
                <p className="text-3xl font-bold text-green-700">12</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">+3 from last week</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-md rounded-2xl ring-1 ring-blue-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700/80 text-sm font-medium">Savings this month</p>
                <p className="text-3xl font-bold text-blue-700">$45.80</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">Compared to gas</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-md rounded-2xl ring-1 ring-purple-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700/80 text-sm font-medium">Favorite station</p>
                <p className="text-lg font-bold text-purple-800">Downtown #3</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">2.1 km</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeSection;