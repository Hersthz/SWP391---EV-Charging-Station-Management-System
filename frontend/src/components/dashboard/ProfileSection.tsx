import { User, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

const ProfileSection = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Driver Profile</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{localStorage.getItem("full_name")}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Premium Member</span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Member Since</div>
            <div className="font-medium">Jan 2023</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Sessions</div>
            <div className="font-medium">147</div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground">Energy Consumed</div>
            <div className="font-medium">2.4 MWh</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;