import { useState } from "react";
import { Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import NotificationModal from "../../components/NotificationModal";


const DashboardHeader = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ChargeStation</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-primary/10"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              3
            </Badge>
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-primary/10"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-sm">
            <div className="font-medium">John</div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
    </header>
  );
};

export default DashboardHeader;