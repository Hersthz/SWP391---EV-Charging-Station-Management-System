// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Bell,
  Globe,
  Moon,
  Sun,
  Car,
  Plus,
  Edit,
  Trash2,
  Battery,
  Zap,
  Save,
  ArrowLeft,
  Camera,
  CreditCard,
  Gauge
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { useToast } from "../hooks/use-toast";
import api from "../api/axios";

type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: string;
  variant?: string;
  battery?: number;
  range?: number;
  chargerType?: string;
  maxPower?: number;
  isPrimary?: boolean;
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ===== view state =====
  const [activeTab, setActiveTab] = useState<"profile" | "vehicles" | "security" | "preferences">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // ===== user state =====
  const [fullName, setFullName] = useState(localStorage.getItem("full_name") || "UserRandom");
  const [email, setEmail] = useState(localStorage.getItem("email") || "userrandom@example.com");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "0123456789");

  // ===== vehicle state =====
  const [vehicleMake, setVehicleMake] = useState(localStorage.getItem("vehicle_make") || "Tesla");
  const [vehicleModel, setVehicleModel] = useState(localStorage.getItem("vehicle_model") || "Model 3");
  const [vehicleYear, setVehicleYear] = useState(localStorage.getItem("vehicle_year") || "2023");
  const [batteryCapacity, setBatteryCapacity] = useState(localStorage.getItem("battery_capacity") || "75");

  // ===== security state =====
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Missing fields",
        description: "Please fill all password fields.",
        variant: "destructive",
      });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPwd(true);

      // Gọi API đổi mật khẩu — chỉnh endpoint nếu backend của bạn khác
      // Ví dụ payload phổ biến:
      // { current_password: "...", new_password: "..." }
      await api.post("/user/change-password", {
        current_password: passwords.current,
        new_password: passwords.new,
      });

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to change password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 1,
      make: vehicleMake,
      model: vehicleModel,
      year: vehicleYear,
      battery: Number(batteryCapacity) || 75,
      range: 400,
      chargerType: "Type 2 / CCS",
      maxPower: 250,
      isPrimary: true,
    },
  ]);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    make: "",
    model: "",
    year: "",
    variant: "",
    battery: undefined,
    range: undefined,
    chargerType: "",
    maxPower: undefined,
  });

  // ===== notifications / preferences =====
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [promotionNotif, setPromotionNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [currency, setCurrency] = useState("VND");
  const [autoBooking, setAutoBooking] = useState(false);

  // ===== fetch profile =====
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setVehicleMake(data.vehicle_make ?? vehicleMake);
        setVehicleModel(data.vehicle_model ?? vehicleModel);
        setVehicleYear(data.vehicle_year ?? vehicleYear);
        setVehicles((prev) => {
          const primary = {
            ...(prev[0] || {}),
            make: data.vehicle_make ?? vehicleMake,
            model: data.vehicle_model ?? vehicleModel,
            year: data.vehicle_year ?? vehicleYear,
          };
          const rest = prev.slice(1);
          return [primary as Vehicle, ...rest];
        });
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== save profile =====
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
      const { data } = await api.put("/auth/me", payload);
      localStorage.setItem("full_name", data.full_name);
      localStorage.setItem("email", data.email);
      localStorage.setItem("phone", data.phone);
      localStorage.setItem("vehicle_make", data.vehicle_make ?? "");
      localStorage.setItem("vehicle_model", data.vehicle_model ?? "");
      localStorage.setItem("vehicle_year", data.vehicle_year ?? "");
      toast({ title: "Profile updated", description: "Saved to server." });
    } catch (err: any) {
      setIsEditing(true);
      const message = err?.response?.data?.message ?? "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  // ===== vehicles handlers (UI only) =====
  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year) {
      toast({
        title: "Validation error",
        description: "Please fill required fields (make/model/year).",
        variant: "destructive",
      });
      return;
    }
    const v: Vehicle = {
      id: vehicles.length + 1,
      make: newVehicle.make!,
      model: newVehicle.model!,
      year: newVehicle.year!,
      variant: newVehicle.variant || "",
      battery: Number(newVehicle.battery) || undefined,
      range: Number(newVehicle.range) || undefined,
      chargerType: newVehicle.chargerType || "",
      maxPower: Number(newVehicle.maxPower) || undefined,
      isPrimary: vehicles.length === 0,
    };
    setVehicles((prev) => [...prev, v]);
    setIsAddVehicleOpen(false);
    setNewVehicle({
      make: "",
      model: "",
      year: "",
      variant: "",
      battery: undefined,
      range: undefined,
      chargerType: "",
      maxPower: undefined,
    });
    toast({ title: "Vehicle added", description: `${v.make} ${v.model} was added to your garage.` });
  };

  const handleDeleteVehicle = (id: number) => {
    setVehicles((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", description: "Vehicle removed from your garage." });
  };

  const handleSetPrimaryVehicle = (id: number) => {
    setVehicles((prev) => prev.map((x) => ({ ...x, isPrimary: x.id === id })));
    toast({ title: "Primary vehicle set", description: "This vehicle is now the default one." });
  };

  const initials =
    (fullName || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-sky-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              ChargeHub
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your profile, vehicles and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-6"
        >
          <TabsList
            className="
              grid w-full grid-cols-4
              rounded-2xl bg-[#F7FAFD] p-1.5
              ring-1 ring-slate-200/70
              h-auto gap-1
            "
          >
            <TabsTrigger
              value="profile"
              className="
                group w-full rounded-xl px-6 py-3
                text-slate-600 font-medium
                hover:text-slate-700
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <User className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">Profile</span>
            </TabsTrigger>

            <TabsTrigger
              value="vehicles"
              className="
                group w-full rounded-xl px-6 py-3
                text-slate-600 font-medium
                hover:text-slate-700
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <Car className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">My EV</span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="
                group w-full rounded-xl px-6 py-3
                text-slate-600 font-medium
                hover:text-slate-700
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <Shield className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">Security</span>
            </TabsTrigger>

            <TabsTrigger
              value="preferences"
              className="
                group w-full rounded-xl px-6 py-3
                text-slate-600 font-medium
                hover:text-slate-700
                data-[state=active]:text-white
                data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)]
                data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <Bell className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">Custom</span>
            </TabsTrigger>
          </TabsList>


          {/* ===== Profile ===== */}
          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-primary" />
                  Personal information
                </CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar row */}
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-electric">
                      <AvatarFallback className="bg-sky-500 text-white text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-sky-500 hover:bg-sky-600"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{fullName}</h3>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                      Premium Member
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Profile form */}
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">Full name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                    
                  </div>

                  <div className="flex justify-end gap-3">
                    {isEditing ? (
                      <Button
                        onClick={handleSave}
                        className="shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save changes
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card className="border border-sky-100 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  Payment methods
                </CardTitle>
                <CardDescription>Manage your cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700 border-sky-200">Default</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add payment method
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Vehicles ===== */}
          <TabsContent value="vehicles" className="space-y-6 animate-fade-in">
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Car className="w-6 h-6 text-sky-600" />
                      <span className="text-sky-900">My EVs</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Manage your electric vehicles and charging info
                    </CardDescription>
                  </div>

                  <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-9 px-4 rounded-lg shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add vehicle
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
                          Add new EV
                        </DialogTitle>
                        <DialogDescription>
                          Enter your vehicle details
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 pt-2">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Make *</Label>
                            <Input
                              value={newVehicle.make || ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                              placeholder="Tesla, Nissan, VinFast..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Model *</Label>
                            <Input
                              value={newVehicle.model || ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                              placeholder="Model 3, Leaf, VF8..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Year *</Label>
                            <Input
                              value={newVehicle.year || ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                              placeholder="2023"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Variant</Label>
                            <Input
                              value={newVehicle.variant || ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, variant: e.target.value })}
                              placeholder="Long Range, e+, Plus..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Battery (kWh)</Label>
                            <Input
                              type="number"
                              value={newVehicle.battery ?? ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, battery: Number(e.target.value) })}
                              placeholder="75"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Range (km)</Label>
                            <Input
                              type="number"
                              value={newVehicle.range ?? ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, range: Number(e.target.value) })}
                              placeholder="400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Charger type</Label>
                            <Input
                              value={newVehicle.chargerType || ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, chargerType: e.target.value })}
                              placeholder="Type 2 / CCS"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max power (kW)</Label>
                            <Input
                              type="number"
                              value={newVehicle.maxPower ?? ""}
                              onChange={(e) => setNewVehicle({ ...newVehicle, maxPower: Number(e.target.value) })}
                              placeholder="250"
                            />
                          </div>
                        </div>

                        <div className="p-4 rounded-lg border-2 border-dashed border-sky-200 bg-sky-50/40">
                          <p className="text-sm text-slate-500 mb-1">Preview</p>
                          <p className="font-semibold text-slate-800">
                            {(newVehicle.make || "Make")} {(newVehicle.model || "Model")} {(newVehicle.year || "Year")}
                          </p>
                          {newVehicle.variant && (
                            <p className="text-sm text-slate-500">{newVehicle.variant}</p>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddVehicle} className="h-9 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {vehicles.map((v) => (
                  <Card
                    key={v.id}
                    className={`rounded-xl bg-white shadow-sm border ${v.isPrimary ? "border-sky-400" : "border-slate-200"
                      }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
                            <Car className="w-8 h-8" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-slate-900">
                                {v.make} {v.model}
                              </h3>
                              {v.isPrimary && (
                                <Badge className="bg-sky-100 text-sky-700 border-sky-200">Primary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                              {v.year} {v.variant ? `• ${v.variant}` : ""}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Battery className="w-3 h-3" /> Battery
                                </div>
                                <p className="font-semibold text-slate-800">{v.battery ?? "-"} kWh</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Gauge className="w-3 h-3" /> Range
                                </div>
                                <p className="font-semibold text-slate-800">{v.range ?? "-"} km</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Zap className="w-3 h-3" /> Charger
                                </div>
                                <p className="font-semibold text-slate-800">{v.chargerType || "-"}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Zap className="w-3 h-3" /> Max power
                                </div>
                                <p className="font-semibold text-slate-800">{v.maxPower ?? "-"} kW</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!v.isPrimary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimaryVehicle(v.id)}
                              className="border-sky-200 text-sky-700 hover:bg-sky-50"
                            >
                              Set primary
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="hover:bg-slate-50">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteVehicle(v.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Security ===== */}
          <TabsContent value="security" className="space-y-6 animate-fade-in">
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="w-6 h-6 text-primary" />
                  Account Security
                </CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Password Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      Current password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      New password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-electric"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Change password
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* 2FA Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">2FA Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Enhance your security with two-factor authentication
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                {/* Sessions Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Login Sessions</h3>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Windows - Chrome</p>
                      <Badge className="bg-success/10 text-success border-success/20">
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Hanoi, Vietnam • Today 2:30 PM</p>
                  </div>
                  <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-white transition-colors">
                    Log out from all other devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ===== Preferences ===== */}
          <TabsContent value="preferences" className="space-y-6 animate-fade-in">
            {/* Notifications */}
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Bell className="w-6 h-6 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose how you prefer to be notified</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Email notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts by email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>

                {/* Push */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Push notifications</p>
                      <p className="text-sm text-muted-foreground">Get browser/device notifications</p>
                    </div>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>

                {/* SMS / Promotions */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Promotions & offers</p>
                      <p className="text-sm text-muted-foreground">Receive information about discounts</p>
                    </div>
                  </div>
                  <Switch checked={promotionNotif} onCheckedChange={setPromotionNotif} />
                </div>
              </CardContent>
            </Card>

            {/* General */}
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Globe className="w-6 h-6 text-primary" />
                  General
                </CardTitle>
                <CardDescription>Tweak global preferences</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Dark mode */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">Dark mode</p>
                      <p className="text-sm text-muted-foreground">Switch the theme between light/dark</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND (₫)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Auto booking */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Auto booking</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically book when battery lower than 20%
                    </p>
                  </div>
                  <Switch checked={autoBooking} onCheckedChange={setAutoBooking} />
                </div>

                {/* Save */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() =>
                      toast({
                        title: "Preferences saved",
                        description: "Your preferences have been updated.",
                      })
                    }
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90 shadow-electric"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
