import { TrendingUp, BarChart3, Award, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const StatsSection = () => {
  const navigate = useNavigate();
  
  const highlights = [
    { 
      icon: BarChart3, 
      label: "Xem báo cáo", 
      description: "Thống kê chi tiết",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    { 
      icon: Award, 
      label: "Thành tích", 
      description: "Level: Gold Member",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    { 
      icon: Shield, 
      label: "Bảo mật", 
      description: "Tài khoản được bảo vệ",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  return (
    <div className="space-y-4">
      {highlights.map((item, index) => (
        <Card key={index} className={`${item.bgColor} ${item.borderColor} hover:shadow-md transition-all duration-200`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white/60`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <div className={`font-medium ${item.color}`}>{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
          <Button 
            className="w-full"
            onClick={() => navigate('/reports')}
          >
            Xem báo cáo chi tiết
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;