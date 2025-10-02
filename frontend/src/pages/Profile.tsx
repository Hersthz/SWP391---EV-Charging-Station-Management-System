import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  Edit,
  Save,
  Wallet,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import api from "../api/axios";


const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // ===== Prefill from localStorage =====
  const [fullName, setFullName] = useState(
    localStorage.getItem("full_name") || "UserRandom"
  );
  const [email, setEmail] = useState(
    localStorage.getItem("email") || "userrandom@example.com"
  );
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "0123456789");

  // Vehicle info (if available)
  const [vehicleMake, setVehicleMake] = useState(
    localStorage.getItem("vehicle_make") || "Tesla"
  );
  const [vehicleModel, setVehicleModel] = useState(
    localStorage.getItem("vehicle_model") || "Model 3"
  );
  const [vehicleYear, setVehicleYear] = useState(
    localStorage.getItem("vehicle_year") || "2023"
  );
  const [batteryCapacity, setBatteryCapacity] = useState(
    localStorage.getItem("battery_capacity") || "75"
  );

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [promotionNotif, setPromotionNotif] = useState(false);

  useEffect(() => {
    (async () => {
        try {
        const { data } = await api.get("/users/me");
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setVehicleMake(data.vehicle_make ?? "");
        setVehicleModel(data.vehicle_model ?? "");
        setVehicleYear(data.vehicle_year ?? "");
        } catch {}
    })();
    }, []);

  const handleSave = async () => {
    try {
        setIsEditing(false); 
        const payload = {
        full_name: fullName.trim(),
        email,
        phone,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        };

        const { data } = await api.put("/users/me", payload); 
        // Đồng bộ lại localStorage theo dữ liệu server trả về
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("email", data.email);
        localStorage.setItem("phone", data.phone);
        localStorage.setItem("vehicle_make", data.vehicle_make ?? "");
        localStorage.setItem("vehicle_model", data.vehicle_model ?? "");
        localStorage.setItem("vehicle_year", data.vehicle_year ?? "");
        toast({ title: "Profile updated", description: "Saved to server." });
    } catch (err: any) {
        // Nếu lỗi, giữ nguyên editing hoặc khôi phục state nếu cần
        setIsEditing(true);
        const message = err?.response?.data?.message ?? "Update failed";
        toast({ title: "Error", description: message, variant: "destructive" });
    }
    };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">My Profile</h1>
              <p className="text-xs text-muted-foreground">
                Manage your personal information
              </p>
            </div>
          </div>
          {isEditing ? (
            <Button onClick={handleSave} size="sm" className="shadow-lg">
              <Save className="w-4 h-4 mr-2" />
              Save changes
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary/40"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden border-none shadow-xl">
        {/* Banner */}
        <div className="relative h-44 md:h-52 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />
        </div>

        {/* Info area */}
        <CardContent className="relative z-10 px-6 md:px-8 pb-8 -mt-7 md:-mt-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 pt-4">
            {/* Avatar + basic info */}
            <div className="flex items-center gap-4 md:gap-5">
                <Avatar className="w-28 h-28 border-4 border-white shadow-2xl ring-2 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold">
                    JD
                </AvatarFallback>
                </Avatar>
                <div className="min-w-0 mt-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                    {fullName}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm md:text-[15px] text-gray-600">
                    <User className="w-4 h-4 shrink-0 text-gray-500" />
                    <span className="truncate">{email}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-blue-600 text-white shadow-sm rounded-full h-6 px-2.5 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Premium
                    </Badge>
                    <Badge variant="outline" className="rounded-full h-6 px-2.5 text-xs border-gray-300 text-gray-700 bg-white/60 backdrop-blur">
                    Since Jan 2023
                    </Badge>
                </div>
                </div>
            </div>

            {/* Stats: chắc chắn ở nền trắng, không dính gradient */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="min-w-[110px] rounded-xl border border-black/5 bg-white p-3 md:p-4 shadow-sm">
                <div className="text-lg md:text-2xl font-semibold text-blue-700 leading-none">147</div>
                <div className="text-[11px] md:text-xs text-gray-500 mt-1">Sessions</div>
                </div>
                <div className="min-w-[110px] rounded-xl border border-black/5 bg-white p-3 md:p-4 shadow-sm">
                <div className="text-lg md:text-2xl font-semibold text-indigo-700 leading-none">3,420</div>
                <div className="text-[11px] md:text-xs text-gray-500 mt-1">kWh</div>
                </div>
                <div className="min-w-[110px] rounded-xl border border-black/5 bg-white p-3 md:p-4 shadow-sm">
                <div className="text-lg md:text-2xl font-semibold text-purple-700 leading-none">₫2.1M</div>
                <div className="text-[11px] md:text-xs text-gray-500 mt-1">Spend</div>
                </div>
            </div>
            </div>
        </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-background to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Đổi thành 1 trường Full name để khớp với ProfileSection */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-muted/50"
                        : "border-primary/30 focus:border-primary"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-muted/50"
                        : "border-primary/30 focus:border-primary"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-muted/50"
                        : "border-primary/30 focus:border-primary"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-background to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Car className="w-5 h-5 text-accent-foreground" />
                  </div>
                  Vehicle Information
                </CardTitle>
                <CardDescription>Details of your vehicle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make" className="text-sm font-semibold">
                      Make
                    </Label>
                    <Input
                      id="make"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      disabled={!isEditing}
                      className={
                        !isEditing
                          ? "bg-muted/50"
                          : "border-primary/30 focus:border-primary"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-semibold">
                      Model
                    </Label>
                    <Input
                      id="model"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      disabled={!isEditing}
                      className={
                        !isEditing
                          ? "bg-muted/50"
                          : "border-primary/30 focus:border-primary"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold">
                      Year
                    </Label>
                    <Input
                      id="year"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      disabled={!isEditing}
                      className={
                        !isEditing
                          ? "bg-muted/50"
                          : "border-primary/30 focus:border-primary"
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="battery" className="text-sm font-semibold">
                    Battery capacity (kWh)
                  </Label>
                  <Input
                    id="battery"
                    value={batteryCapacity}                  
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-muted/50"
                        : "border-primary/30 focus:border-primary"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security & Logout */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-background to-destructive/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Shield className="w-5 h-3 text-destructive" />
                  </div>
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary/5 hover:border-primary/40 transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Change password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/40 transition-all"                 
                >
                  <Shield className="w-4 h-4 mr-2" />
                  2-step verification
                </Button>
              </CardContent>
            </Card>
          </div>
        
          {/* Right Column */}
          <div className="space-y-6">
            {/* Wallet & Payments */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-background to-secondary/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  Wallet & Payments
                </CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5" />
                      <p className="text-sm font-medium opacity-90">Wallet balance</p>
                    </div>
                    <p className="text-4xl font-bold mb-4">1,250,000 ₫</p>
                    <Button variant="secondary" size="sm" className="shadow-md">
                      <Plus className="w-4 h-4 mr-2" />
                      Top up
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Saved payment methods</p>
                  <div className="group flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary/40 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                        VISA
                      </div>
                      <div>
                        <p className="font-semibold">•••• 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Default
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add new method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-background to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Bell className="w-5 h-5 text-accent-foreground" />
                  </div>
                  Notifications
                </CardTitle>
                <CardDescription>Control how you get notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="font-semibold">Email notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts by email</p>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="font-semibold">Push notifications</p>
                    <p className="text-sm text-muted-foreground">Get device push alerts</p>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/5 transition-colors">
                  <div>
                    <p className="font-semibold">Promotions & offers</p>
                    <p className="text-sm text-muted-foreground">
                      Receive information about discounts
                    </p>
                  </div>
                  <Switch
                    checked={promotionNotif}
                    onCheckedChange={setPromotionNotif}
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
