import { Clock, CreditCard, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const RecentSessions = () => {
  const sessions = [
    { id: 1, station: "Mall Station #2", date: "Yesterday 3:30 PM", duration: "2h 15m", energy: "45 kWh", cost: "$18.50", status: "Completed" },
    { id: 2, station: "Highway Station #7", date: "3 days ago", duration: "1h 45m", energy: "52 kWh", cost: "$22.10", status: "Completed" },
    { id: 3, station: "Downtown Station #3", date: "1 week ago", duration: "45 min", energy: "28 kWh", cost: "$15.80", status: "Scheduled" }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recent Sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">{session.station}</div>
              <div className="text-sm text-muted-foreground">{session.date}</div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                <span>{session.duration}</span>
                <span>•</span>
                <span>{session.energy}</span>
                <span>•</span>
                <span>{session.cost}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={session.status === "Completed" ? "default" : "secondary"}
                className={session.status === "Completed" ? "bg-green-100 text-green-800" : ""}
              >
                {session.status}
              </Badge>
              <Button variant="ghost" size="sm" aria-label="View details">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-4">
          View Payments
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentSessions;
