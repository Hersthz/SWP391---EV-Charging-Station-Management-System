import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Shield, Key, Car, Plus, Edit, Trash2,
  Battery, Zap, Save, ArrowLeft, Camera, PlugZap, IdCard
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { useToast } from "../../hooks/use-toast";
import api from "../../api/axios";
import { ChatBot } from "./../ChatBot";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "../../components/ui/select";

/* ===== EV catalog ===== */
type CatalogModel = { model: string; acMaxKw: number; dcMaxKw: number; batteryKwh?: number };
type CatalogMake = { make: string; models: CatalogModel[] };

const EV_CATALOG: CatalogMake[] = [
  {
    make: "Tesla",
    models: [
      { model: "Model 3 Long Range", acMaxKw: 11, dcMaxKw: 250 },
      { model: "Model Y Long Range", acMaxKw: 11, dcMaxKw: 250 },
    ],
  },
  {
    make: "Hyundai",
    models: [
      { model: "IONIQ 5", acMaxKw: 11, dcMaxKw: 233 },
      { model: "Kona Electric", acMaxKw: 11, dcMaxKw: 100 },
    ],
  },
  {
    make: "Kia",
    models: [
      { model: "EV6", acMaxKw: 11, dcMaxKw: 239 },
      { model: "Niro EV", acMaxKw: 11, dcMaxKw: 85 },
    ],
  },
  {
    make: "Volkswagen",
    models: [
      { model: "ID.4 Pro", acMaxKw: 11, dcMaxKw: 135 },
      { model: "ID.3 Pro", acMaxKw: 11, dcMaxKw: 120 },
    ],
  },
  {
    make: "Nissan",
    models: [
      { model: "Leaf", acMaxKw: 6.6, dcMaxKw: 50 },
      { model: "Ariya 87kWh", acMaxKw: 7.4, dcMaxKw: 130 },
    ],
  },
  {
    make: "Porsche",
    models: [
      { model: "Taycan", acMaxKw: 11, dcMaxKw: 270 },
    ],
  },
  {
    make: "BMW",
    models: [
      { model: "i4 eDrive40", acMaxKw: 11, dcMaxKw: 205 },
      { model: "iX3", acMaxKw: 11, dcMaxKw: 150 },
    ],
  },
  {
    make: "BYD",
    models: [
      { model: "Atto 3", acMaxKw: 7, dcMaxKw: 88 },
      { model: "Dolphin", acMaxKw: 7, dcMaxKw: 65 },
    ],
  },
  {
    make: "MG",
    models: [
      { model: "MG4", acMaxKw: 7, dcMaxKw: 117 },
      { model: "ZS EV", acMaxKw: 7, dcMaxKw: 76 },
    ],
  },
  {
    make: "VinFast",
    models: [
      { model: "VF 8", acMaxKw: 11, dcMaxKw: 160 },
      { model: "VF e34", acMaxKw: 7.4, dcMaxKw: 60 },
    ],
  },
];

/* ===== Types ===== */
type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: string;
  variant?: string;
  socNowPct?: number;
  connectorType?: string;
  batteryCapacityKwh?: number;
  battery?: number;
  range?: number;
  isPrimary?: boolean;
  acMaxKw?: number;
  dcMaxKw?: number;
};

type VehicleBE = {
  id: number;
  make?: string;
  model?: string;
  year?: string | number;
  variant?: string;
  currentSoc?: number;
  soc_now?: number;
  socNow?: number;
  connectorStandard?: string;
  connectorType?: string;
  battery_capacity_kwh?: number;
  batteryCapacityKwh?: number;
  range?: number;
  battery?: number;
  isPrimary?: boolean;
  ac_max_kw?: number;
  dc_max_kw?: number;
  acMaxKw?: number;
  dcMaxKw?: number;
};

type VehicleForm = {
  make: string;
  model: string;
  currentSoc: number;          // %
  batteryCapacityKwh: number;  // kWh
  acMaxKw?: number;
  dcMaxKw?: number;
  year?: string;
  variant?: string;
};

/* ===== Helpers ===== */
const clampPct = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n) ? Math.max(0, Math.min(100, Math.round(n))) : undefined;

const toPercent = (raw?: number) => {
  if (typeof raw !== "number" || Number.isNaN(raw)) return undefined;
  return clampPct(raw <= 1 ? raw * 100 : raw);
};

const toNumberOrUndef = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const mapVehicleBEToUI = (v: VehicleBE): Vehicle => {
  const socRaw =
    (typeof v.currentSoc === "number" ? v.currentSoc : undefined) ??
    (typeof v.soc_now === "number" ? v.soc_now * 100 : undefined) ??
    (typeof v.socNow === "number" ? (v.socNow <= 1 ? v.socNow * 100 : v.socNow) : undefined);

  const cap =
    (typeof v.batteryCapacityKwh === "number" ? v.batteryCapacityKwh : undefined) ??
    (typeof v.battery_capacity_kwh === "number" ? v.battery_capacity_kwh : undefined);

  const ac =
    (typeof v.acMaxKw === "number" ? v.acMaxKw : undefined) ??
    (typeof v.ac_max_kw === "number" ? v.ac_max_kw : undefined);

  const dc =
    (typeof v.dcMaxKw === "number" ? v.dcMaxKw : undefined) ??
    (typeof v.dc_max_kw === "number" ? v.dc_max_kw : undefined);

  return {
    id: v.id,
    make: v.make ?? "—",
    model: v.model ?? "",
    year: String(v.year ?? ""),
    variant: v.variant,
    socNowPct: toPercent(socRaw),
    connectorType: v.connectorStandard ?? v.connectorType ?? "",
    batteryCapacityKwh: cap,
    range: typeof v.range === "number" ? v.range : undefined,
    battery: typeof v.battery === "number" ? v.battery : undefined,
    isPrimary: !!v.isPrimary,
    acMaxKw: ac,
    dcMaxKw: dc,
  };
};

/* ===== Component ===== */
const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // view
  const [activeTab, setActiveTab] =
    useState<"profile" | "vehicles" | "security">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // user state
  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "UserRandom");
  const [email, setEmail] = useState(localStorage.getItem("email") || "userrandom@example.com");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "0123456789");
  const [date, setDate] = useState<string>(localStorage.getItem("date") || "");

  // avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // password policy
  const [canChangePwd, setCanChangePwd] = useState(false);

  const initials = useMemo(
    () =>
      (fullName || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U",
    [fullName]
  );

  // security
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // dialogs & form
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>({
    make: "",
    model: "",
    currentSoc: 50,
    batteryCapacityKwh: 60,
    acMaxKw: 7.4,
    dcMaxKw: 50,
    year: "",
    variant: "",
  });

  // derived: models for selected make
  const modelsForMake = useMemo(() => {
    const mk = EV_CATALOG.find(m => m.make === form.make);
    return mk?.models ?? [];
  }, [form.make]);

  const findCatalogSpec = (make?: string, model?: string) => {
    const mk = EV_CATALOG.find(m => m.make === make);
    const m = mk?.models.find(x => x.model === model);
    return m;
  };

  // LOAD PROFILE & VEHICLES
  useEffect(() => {
    (async () => {
      try {
        // profile
        const { data } = await api.get("/auth/me", { withCredentials: true });
        setFullName(data.fullName ?? fullName);
        setEmail(data.email ?? email);
        setPhone(data.phone ?? phone);
        if (data.dateOfBirth) {
          setDate(String(data.dateOfBirth));
          localStorage.setItem("date", String(data.dateOfBirth));
        }
        if (data.url) setAvatarUrl(data.url as string);

        // provider
        const providerFromApi = String(
          data?.provider ?? data?.authProvider ?? data?.loginType ?? data?.oauthProvider ?? ""
        ).toUpperCase();
        const hasPasswordFlag = Boolean(data?.passwordSet ?? data?.hasPassword);
        const providerFromLS = String(localStorage.getItem("authProvider") || "").toUpperCase();

        const isLocal =
          hasPasswordFlag ||
          providerFromApi === "" ||
          providerFromApi === "LOCAL" ||
          providerFromApi === "PASSWORD" ||
          providerFromLS === "LOCAL" ||
          providerFromLS === "PASSWORD";

        setCanChangePwd(!!isLocal);

        // vehicles
        setLoadingVehicles(true);
        const uid: number | undefined = (data?.user_id ?? data?.id) as number | undefined;
        if (!uid) throw new Error("No userId");
        const vRes = await api.get(`/vehicle/${uid}`, { withCredentials: true });
        const raw = (vRes?.data?.data ?? vRes?.data ?? []) as VehicleBE[];
        setVehicles(raw.map(mapVehicleBEToUI));
      } catch {
        setVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= PROFILE ================= */
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const normalizeDate = (v: string) => {
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1]}-${m[2]}`;
    return v;
  };

  const handleChooseAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const url = URL.createObjectURL(f);
    setAvatarUrl(url);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const formData = new FormData();
      const payload = {
        full_name: fullName.trim(),
        phone: phone?.trim() || "",
        email: email.trim(),
        date_of_birth: normalizeDate(date) || null,
      };
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      if (avatarFile) {
        formData.append("file", avatarFile);
      }

      const { data } = await api.post("/user/update-profile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newName = data?.fullName ?? fullName;
      const newEmail = data?.email ?? email;
      const newPhone = data?.phone ?? phone;
      const newDob = data?.dateOfBirth ? String(data.dateOfBirth) : date;
      const newUrl = data?.url ?? avatarUrl;

      setFullName(newName);
      setEmail(newEmail);
      setPhone(newPhone);
      setDate(newDob || "");
      setAvatarUrl(newUrl);
      setAvatarFile(null);

      localStorage.setItem("fullName", newName);
      localStorage.setItem("email", newEmail);
      localStorage.setItem("phone", newPhone);
      localStorage.setItem("date", newDob || "");

      setIsEditingProfile(false);
      toast({ title: "Profile updated", description: "Saved to server." });
    } catch (err: any) {
      setIsEditingProfile(true);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Unexpected server error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* ================= PASSWORD ================= */
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm)
      return toast({ title: "Missing fields", description: "Please fill all password fields.", variant: "destructive" });
    if (passwords.new !== passwords.confirm)
      return toast({ title: "Mismatch", description: "New password and confirmation do not match.", variant: "destructive" });

    try {
      setIsChangingPwd(true);
      await api.post("/user/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      }, { withCredentials: true });
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Failed to change password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsChangingPwd(false);
    }
  };

  /* ================= VEHICLES ================= */
  const openAdd = () => {
    setForm({
      make: "",
      model: "",
      currentSoc: 50,
      batteryCapacityKwh: 60,
      acMaxKw: undefined,
      dcMaxKw: undefined,
      year: "",
      variant: "",
    });
    setIsAddVehicleOpen(true);
  };

  const submitAdd = async () => {
    if (!form.make || !form.model || form.currentSoc === undefined || form.batteryCapacityKwh === undefined)
      return toast({ title: "Validation error", description: "Made, Model, SOC and Battery are required", variant: "destructive" });

    try {
      setPending(true);
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        currentSoc: Number(form.currentSoc),
        batteryCapacityKwh: Number(form.batteryCapacityKwh),
        acMaxKw: toNumberOrUndef(form.acMaxKw),
        dcMaxKw: toNumberOrUndef(form.dcMaxKw),
      };
      const { data } = await api.post("/vehicle/create", payload, { withCredentials: true });
      const created = (data?.data ?? data) as any;

      const v: Vehicle = {
        id: created.id,
        make: created.make,
        model: created.model,
        year: "",
        socNowPct: toPercent(created.currentSoc),
        batteryCapacityKwh: toNumberOrUndef(created.batteryCapacityKwh),
        isPrimary: vehicles.length === 0,
        acMaxKw: toNumberOrUndef(created.acMaxKw ?? created.ac_max_kw),
        dcMaxKw: toNumberOrUndef(created.dcMaxKw ?? created.dc_max_kw),
      };
      setVehicles((prev) => [v, ...prev]);
      setIsAddVehicleOpen(false);
      toast({ title: "Vehicle created", description: `${v.make} ${v.model} added.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message ?? "Create failed", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  const openEdit = (v: Vehicle) => {
    // nếu trùng catalog thì auto-fill AC/DC
    const spec = findCatalogSpec(v.make, v.model);
    setEditing(v);
    setForm({
      make: v.make,
      model: v.model,
      currentSoc: typeof v.socNowPct === "number" ? v.socNowPct : 50,
      batteryCapacityKwh: v.batteryCapacityKwh ?? 60,
      acMaxKw: spec?.acMaxKw ?? v.acMaxKw,
      dcMaxKw: spec?.dcMaxKw ?? v.dcMaxKw,
      year: v.year,
      variant: v.variant,
    });
    setIsEditVehicleOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setPending(true);
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        currentSoc: Number(form.currentSoc),
        batteryCapacityKwh: Number(form.batteryCapacityKwh),
        acMaxKw: toNumberOrUndef(form.acMaxKw),
        dcMaxKw: toNumberOrUndef(form.dcMaxKw),
      };
      const { data } = await api.put(`/vehicle/update/${editing.id}`, payload, { withCredentials: true });
      const updated = (data?.data ?? data) as any;

      setVehicles((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
              ...x,
              make: updated.make,
              model: updated.model,
              socNowPct: toPercent(updated.currentSoc),
              batteryCapacityKwh: toNumberOrUndef(updated.batteryCapacityKwh),
              acMaxKw: toNumberOrUndef(updated.acMaxKw ?? updated.ac_max_kw),
              dcMaxKw: toNumberOrUndef(updated.dcMaxKw ?? updated.dc_max_kw),
            }
            : x
        )
      );
      setIsEditVehicleOpen(false);
      toast({ title: "Vehicle updated", description: `${form.make} ${form.model} saved.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message ?? "Update failed", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      setPending(true);
      await api.post(`/vehicle/delete/${id}`, {}, { withCredentials: true });
      setVehicles((prev) => prev.filter((x) => x.id !== id));
      toast({ title: "Vehicle deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message ?? "Delete failed", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  // When make/model changes in form → auto-fill AC/DC from catalog
  useEffect(() => {
    const spec = findCatalogSpec(form.make, form.model);
    if (spec) {
      setForm((f) => ({ ...f, acMaxKw: spec.acMaxKw, dcMaxKw: spec.dcMaxKw }));
    }
  }, [form.make, form.model]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hover:bg-sky-50">
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

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, vehicles and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-[#F7FAFD] p-1.5 ring-1 ring-slate-200/70 h-auto gap-1">
            <TabsTrigger value="profile" className="group w-full rounded-xl px-6 py-3 text-slate-600 font-medium hover:text-slate-700 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)] data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)] transition-all flex items-center justify-center gap-2">
              <User className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="group w-full rounded-xl px-6 py-3 text-slate-600 font-medium hover:text-slate-700 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)] data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)] transition-all flex items-center justify-center gap-2">
              <Car className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">My EV</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="group w-full rounded-xl px-6 py-3 text-slate-600 font-medium hover:text-slate-700 data-[state=active]:text-white data-[state=active]:shadow-[0_6px_20px_-6px_rgba(14,165,233,.45)] data-[state=active]:bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)] transition-all flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 opacity-70 group-data-[state=active]:opacity-100" />
              <span className="text-sm font-medium">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* PROFILE */}
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
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-electric overflow-hidden">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="avatar" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-sky-500 text-white text-xl font-bold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {isEditingProfile && (
                      <>
                        <input
                          id="avatar-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleChooseAvatar}
                        />
                        <Button
                          size="sm"
                          className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-sky-500 hover:bg-sky-600"
                          onClick={() => document.getElementById("avatar-input")?.click()}
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </Button>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{fullName}</h3>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditingProfile}
                        className={!isEditingProfile ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        readOnly
                        className="bg-slate-50 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, ""); // bỏ hết ký tự không phải số
                          setPhone(v);
                        }}
                        inputMode="numeric"
                        disabled={!isEditingProfile}
                        className={!isEditingProfile ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date || ""}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={!isEditingProfile}
                        className={!isEditingProfile ? "bg-slate-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    {isEditingProfile ? (
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingProfile ? "Saving..." : "Save changes"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(true)}
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
          </TabsContent>

          {/* VEHICLES */}
          <TabsContent value="vehicles" className="space-y-6 animate-fade-in">
            <Card className="shadow-electric border-0 bg-gradient-card">
              <CardHeader className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Car className="w-6 h-6 text-sky-600" />
                      <span className="text-sky-900">My EVs</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500">Manage your electric vehicles and charging info</CardDescription>
                  </div>

                  {/* add */}
                  <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openAdd} className="h-9 px-4 rounded-lg shadow-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add vehicle
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Add new EV</DialogTitle>
                        <DialogDescription>Enter your vehicle details</DialogDescription>
                      </DialogHeader>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Make select */}
                        <div className="space-y-2">
                          <Label>Made *</Label>
                          <Select
                            value={form.make || undefined}
                            onValueChange={(val) => {
                              setForm((prev) => ({ ...prev, make: val, model: "", acMaxKw: undefined, dcMaxKw: undefined }));
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {EV_CATALOG.map((mk) => (
                                <SelectItem key={mk.make} value={mk.make}>{mk.make}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model select (depends on make) */}
                        <div className="space-y-2">
                          <Label>Model *</Label>
                          <Select
                            value={form.model || undefined}
                            onValueChange={(val) => {
                              const spec = findCatalogSpec(form.make, val);
                              setForm((prev) => ({
                                ...prev,
                                model: val,
                                acMaxKw: spec?.acMaxKw,
                                dcMaxKw: spec?.dcMaxKw,
                              }));
                            }}
                            disabled={!form.make}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={form.make ? "Select model" : "Choose made first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {modelsForMake.map((m) => (
                                <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>State of Charge (%) *</Label>
                          <Input type="number" min={0} max={100} value={form.currentSoc} onChange={(e) => setForm({ ...form, currentSoc: Number(e.target.value) })} placeholder="50" />
                        </div>
                        <div className="space-y-2">
                          <Label>Battery (kWh) *</Label>
                          <Input type="number" min={5} max={200} value={form.batteryCapacityKwh} onChange={(e) => setForm({ ...form, batteryCapacityKwh: Number(e.target.value) })} placeholder="60" />
                        </div>

                        {/* AC & DC */}
                        <div className="space-y-2">
                          <Label>AC Max (kW)</Label>
                          <Input type="number" value={form.acMaxKw ?? ""} disabled placeholder="auto from model" />
                        </div>
                        <div className="space-y-2">
                          <Label>DC Max (kW)</Label>
                          <Input type="number" value={form.dcMaxKw ?? ""} disabled placeholder="auto from model" />
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-2 border-dashed border-sky-200 bg-sky-50/40">
                        <p className="text-sm text-slate-500 mb-1">Preview</p>
                        <p className="font-semibold text-slate-800">{(form.model || "Model")} {(form.make || "Made")}</p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)}>Cancel</Button>
                        <Button onClick={submitAdd} disabled={pending} className="h-9 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
                          {pending ? "Saving..." : (<><Plus className="w-4 h-4 mr-2" />Add</>)}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* edit */}
                  <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Edit EV</DialogTitle>
                        <DialogDescription>Update your vehicle details</DialogDescription>
                      </DialogHeader>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Make select */}
                        <div className="space-y-2">
                          <Label>Made *</Label>
                          <Select
                            value={form.make || undefined}
                            onValueChange={(val) => {
                              setForm((prev) => ({ ...prev, make: val, model: "", acMaxKw: undefined, dcMaxKw: undefined }));
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {EV_CATALOG.map((mk) => (
                                <SelectItem key={mk.make} value={mk.make}>{mk.make}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model select */}
                        <div className="space-y-2">
                          <Label>Model *</Label>
                          <Select
                            value={form.model || undefined}
                            onValueChange={(val) => {
                              const spec = findCatalogSpec(form.make, val);
                              setForm((prev) => ({
                                ...prev,
                                model: val,
                                acMaxKw: spec?.acMaxKw,
                                dcMaxKw: spec?.dcMaxKw,
                              }));
                            }}
                            disabled={!form.make}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={form.make ? "Select model" : "Choose made first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(EV_CATALOG.find(m => m.make === form.make)?.models ?? []).map((m) => (
                                <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>State of Charge (%) *</Label>
                          <Input type="number" min={0} max={100} value={form.currentSoc} onChange={(e) => setForm({ ...form, currentSoc: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Battery (kWh) *</Label>
                          <Input type="number" min={5} max={200} value={form.batteryCapacityKwh} onChange={(e) => setForm({ ...form, batteryCapacityKwh: Number(e.target.value) })} />
                        </div>

                        {/* AC & DC (auto-filled, disabled) */}
                        <div className="space-y-2">
                          <Label>AC Max (kW)</Label>
                          <Input type="number" value={form.acMaxKw ?? ""} disabled placeholder="auto from model" />
                        </div>
                        <div className="space-y-2">
                          <Label>DC Max (kW)</Label>
                          <Input type="number" value={form.dcMaxKw ?? ""} disabled placeholder="auto from model" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsEditVehicleOpen(false)}>Cancel</Button>
                        <Button onClick={submitEdit} disabled={pending} className="h-9 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
                          {pending ? "Saving..." : (<><Save className="w-4 h-4 mr-2" />Save</>)}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {loadingVehicles && <div className="text-sm text-slate-500">Loading vehicles…</div>}
                {!loadingVehicles && vehicles.length === 0 && (
                  <div className="text-sm text-slate-500">No vehicles found. Click “Add vehicle” to add one.</div>
                )}

                {vehicles.map((v) => (
                  <Card key={v.id} className="rounded-xl bg-white shadow-sm border border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
                            <Car className="w-8 h-8" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-slate-900">{v.model} {v.make}</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">{v.year} {v.variant ? `• ${v.variant}` : ""}</p>

                            <div className="grid gap-4 md:gap-5 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))] w-full max-w-[760px]">
                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Battery className="w-3 h-3" /> State of Charge
                                </div>
                                <p className="font-semibold text-slate-800">
                                  {typeof v.socNowPct === "number" ? `${v.socNowPct} %` : "-"}
                                </p>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Zap className="w-3 h-3" /> Battery
                                </div>
                                <p className="font-semibold text-slate-800">
                                  {typeof v.batteryCapacityKwh === "number" ? `${v.batteryCapacityKwh} kWh` : "- kWh"}
                                </p>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Zap className="w-3 h-3" /> AC Max
                                </div>
                                <p className="font-semibold text-slate-800">
                                  {typeof v.acMaxKw === "number" ? `${v.acMaxKw} kW` : "— kW"}
                                </p>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <PlugZap className="w-3 h-3" /> DC Max
                                </div>
                                <p className="font-semibold text-slate-800">
                                  {typeof v.dcMaxKw === "number" ? `${v.dcMaxKw} kW` : "— kW"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" className="hover:bg-slate-50" onClick={() => openEdit(v)}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => confirmDelete(v.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY */}
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
                {!canChangePwd && (
                  <div className="p-3 rounded-lg border bg-sky-50/70 text-sky-800 text-sm">
                    You signed in with Google. Password changes are managed by your Google account.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" /> Current password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                      disabled={!canChangePwd}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" /> New password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                      disabled={!canChangePwd}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" /> Confirm new password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="border-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                      disabled={!canChangePwd}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      className="bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 shadow-md"
                      disabled={isChangingPwd || !canChangePwd}
                    >
                      {isChangingPwd ? "Processing..." : "Change password"}
                    </Button>
                  </div>
                </div>

                {/* KYC quick access */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-sky-50/60 border border-sky-200">
                  <div className="flex items-center gap-3">
                    <IdCard className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="font-medium">Identity verification (KYC)</p>
                      <p className="text-sm text-muted-foreground">
                        Verify once to unlock higher limits and faster payments.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/kyc")}
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
                  >
                    Go to KYC
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ChatBot />
    </div>
  );
};

export default Profile;
