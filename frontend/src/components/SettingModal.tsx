{/*import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  Settings, 
  Bell, 
  Moon, 
  Globe, 
  CreditCard, 
  Shield, 
  Car,
  Zap,
  User,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    chargingAlerts: true,
    paymentAlerts: true
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'vi',
    currency: 'USD',
    autoStart: true,
    preauthorize: false
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Cài đặt đã được cập nhật");
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    toast.success("Cài đặt đã được cập nhật");
  };

  const handleSave = () => {
    toast.success("Tất cả cài đặt đã được lưu thành công!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <DialogTitle>Cài đặt</DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            
            {/* Notifications Section */}
            {/*<Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-primary" />
                  Thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Thông báo đẩy</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo trên thiết bị</p>
                  </div>
                  <Switch 
                    checked={notifications.pushNotifications}
                    onCheckedChange={() => handleNotificationChange('pushNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email thông báo</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">SMS thông báo</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo qua tin nhắn</p>
                  </div>
                  <Switch 
                    checked={notifications.smsNotifications}
                    onCheckedChange={() => handleNotificationChange('smsNotifications')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Cảnh báo sạc</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi sạc hoàn thành</p>
                  </div>
                  <Switch 
                    checked={notifications.chargingAlerts}
                    onCheckedChange={() => handleNotificationChange('chargingAlerts')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Cảnh báo thanh toán</Label>
                    <p className="text-sm text-muted-foreground">Thông báo giao dịch thanh toán</p>
                  </div>
                  <Switch 
                    checked={notifications.paymentAlerts}
                    onCheckedChange={() => handleNotificationChange('paymentAlerts')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            {/*<Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  Tùy chọn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Chế độ tối</Label>
                    <p className="text-sm text-muted-foreground">Sử dụng giao diện tối</p>
                  </div>
                  <Switch 
                    checked={preferences.darkMode}
                    onCheckedChange={(value) => handlePreferenceChange('darkMode', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Ngôn ngữ</Label>
                  <Select 
                    value={preferences.language} 
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Đơn vị tiền tệ</Label>
                  <Select 
                    value={preferences.currency} 
                    onValueChange={(value) => handlePreferenceChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="VND">VND (₫)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Charging Section */}
            {/*<Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  Sạc điện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Tự động bắt đầu</Label>
                    <p className="text-sm text-muted-foreground">Tự động bắt đầu sạc khi cắm</p>
                  </div>
                  <Switch 
                    checked={preferences.autoStart}
                    onCheckedChange={(value) => handlePreferenceChange('autoStart', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Ủy quyền trước</Label>
                    <p className="text-sm text-muted-foreground">Cho phép thanh toán tự động</p>
                  </div>
                  <Switch 
                    checked={preferences.preauthorize}
                    onCheckedChange={(value) => handlePreferenceChange('preauthorize', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Section */}
            {/*<Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Tài khoản & Bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Quản lý phương thức thanh toán
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Car className="w-4 h-4 mr-2" />
                  Quản lý thông tin xe
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Địa chỉ yêu thích
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
        <div className="pt-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Hủy
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;*/}