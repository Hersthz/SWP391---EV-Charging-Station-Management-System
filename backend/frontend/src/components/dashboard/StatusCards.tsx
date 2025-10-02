import { Battery, Clock, Calendar, TrendingUp, Zap, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";

const StatusCards = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Today’s Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Battery Status */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-green-700 flex items-center gap-2">
              <Battery className="w-5 h-5" />
              Current Battery Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-800">85%</span>
              <span className="text-sm text-green-600 mb-1">425 km</span>
            </div>
            <Progress value={85} className="h-2 bg-green-100" />
            <p className="text-sm text-green-600">Enough for a long trip</p>
          </CardContent>
        </Card>

        {/* Charging Session */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-blue-700 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Most Recent Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-blue-800">2 hours ago</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Duration:</span>
                <span className="font-medium">45 minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Energy:</span>
                <span className="font-medium">38.5 kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Booking */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-purple-700 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-purple-800">Tomorrow</span>
              <span className="text-sm text-purple-600 mb-1">14:00</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-600">Downtown Station #3</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
              DC Fast
            </Badge>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-orange-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              This Month’s Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold text-orange-800">23</div>
                <div className="text-xs text-orange-600">Sessions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-800">$127</div>
                <div className="text-xs text-orange-600">Cost</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-800">580 kWh</div>
                <div className="text-xs text-orange-600">Energy</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-800">$95</div>
                <div className="text-xs text-orange-600">Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Charge completed at Central Mall</span>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Reservation made at Downtown Station #3</span>
                </div>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Vehicle information updated</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusCards;
