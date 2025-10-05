import { Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

const VehicleSection = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Car className="w-5 h-5" />
          <span>Your EV</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-medium">Tesla Model 3</div>
          <div className="text-sm text-muted-foreground">2023 • Long Range</div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Battery Health</span>
            <span className="font-medium">96%</span>
          </div>
          <Progress value={96} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Charge</span>
            <span className="font-medium">78%</span>
          </div>
          <Progress value={78} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Range (EPA)</div>
            <div className="font-medium">400 km</div>
          </div>
          <div>
            <div className="text-muted-foreground">Charging Type</div>
            <div className="font-medium">Type 2 / CCS</div>
          </div>
          <div>
            <div className="text-muted-foreground">Max Power</div>
            <div className="font-medium">250 kW</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleSection;
