// src/pages/admin/AdminStaff.tsx
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useToast } from "../../hooks/use-toast";
import {
  Search,
  Shield,
  Edit,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  X,
  Building2,
  KeyRound,
  IdCard,
} from "lucide-react";

/* ================= Types ================= */
type User = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: boolean;
  roleName: string; // BE label
};

type StationAssign = { id: number; name: string; address?: string };

/* ===== Role map (ONLY Staff/Admin) ===== */
const backendToUi: Record<string, "Staff" | "Admin" | undefined> = {
  STAFF: "Staff",
  ROLE_STAFF: "Staff",
  ADMIN: "Admin",
  ROLE_ADMIN: "Admin",
};
const uiToBackend: Record<"Staff" | "Admin", "ROLE_STAFF" | "ROLE_ADMIN"> = {
  Staff: "ROLE_STAFF",
  Admin: "ROLE_ADMIN",
};
/* roleId map cho request tạo staff (theo DB: 1=USER, 2=STAFF, 3=ADMIN) */
const uiToRoleId: Record<"Staff" | "Admin", number> = { Staff: 2, Admin: 3 };

/* ===== Station detail types used in dialogs ===== */
type Pillar = {
  code: string;
  status: string;
  power: number;
  pricePerKwh: number;
  connectors: { type: string }[];
};
type StationDetail = {
  id: number;
  name: string;
  address: string;
  status: string;
  distance?: number;
  availablePorts?: number;
  totalPorts?: number;
  minPrice?: number;
  maxPrice?: number;
  maxPower?: number;
  connectorTypes?: string[];
  pillars: Pillar[];
};
type ChargingStationDetailResponse = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  status?: string | null;
  availableConnectors?: number | null;
  totalConnectors?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minPower?: number | null;
  maxPower?: number | null;
  pillars?: {
    code?: string;
    status?: string | null;
    power?: number | null;
    pricePerKwh?: number | null;
    connectors?: { type?: string }[];
  }[];
};

/* ===== Station option + preview model for Add Staff ===== */
type StationOption = { id: number; name: string; address?: string };

type StationPreview = {
  id: number;
  name: string;
  address: string;
  status?: string | null;
  pillars: number; // tổng số pillars/ports
  maxPower?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Occupied: "bg-amber-50 text-amber-700 border-amber-200",
  Offline: "bg-slate-100 text-slate-600 border-slate-200",
  Maintenance: "bg-slate-100 text-slate-600 border-slate-200",
};

const mapDetailToStation = (d: ChargingStationDetailResponse): StationDetail => {
  const pillars: Pillar[] =
    (d.pillars ?? []).map((p) => ({
      code: String(p.code ?? ""),
      status: String(p.status ?? "Unknown"),
      power: Number(p.power ?? 0),
      pricePerKwh: Number(p.pricePerKwh ?? 0),
      connectors: (p.connectors ?? []).map((c) => ({ type: String(c.type ?? "") })),
    })) ?? [];
  const connectorTypes = [...new Set(pillars.flatMap((p) => p.connectors.map((c) => c.type)))];
  const availableFromPillars = pillars.filter((p) => String(p.status).toLowerCase().includes("avail")).length;

  return {
    id: d.id,
    name: d.name,
    address: d.address,
    status: String(d.status ?? "Unknown"),
    distance: d.distance ?? undefined,
    availablePorts: Number(d.availableConnectors ?? availableFromPillars),
    totalPorts: Number(d.totalConnectors ?? pillars.length),
    minPrice: d.minPrice ?? undefined,
    maxPrice: d.maxPrice ?? undefined,
    maxPower: d.maxPower ?? undefined,
    connectorTypes: d.pillars ? connectorTypes : undefined,
    pillars,
  };
};

const vnd = (n?: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n!);

export default function AdminStaffPage() {
  const { toast } = useToast();

  /* ========= Page state ========= */
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "admin">("all");
  const [assigns, setAssigns] = useState<Record<number, StationAssign[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  /* ========= Add staff dialog ========= */
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addPayload, setAddPayload] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    roleUi: "Staff" as "Staff" | "Admin",
    stationId: "" as number | "",
  });

  // Stations for select + preview
  const [stations, setStations] = useState<StationOption[]>([]);
  const [stationMap, setStationMap] = useState<Record<number, StationPreview>>({});
  const [selectedStation, setSelectedStation] = useState<StationPreview | null>(null);

  /* ========= Edit dialog ========= */
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  /* ========= Station detail dialog (view) ========= */
  const [stationOpen, setStationOpen] = useState(false);
  const [stationLoading, setStationLoading] = useState(false);
  const [stationDetail, setStationDetail] = useState<StationDetail | null>(null);

  /* ===== Load staff + their station assignments ===== */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<User[]>("/user/getAll");
        if (!mounted) return;
        const list = (res.data || []).filter((u) => {
          const ui = backendToUi[u.roleName] || u.roleName;
          return ui === "Staff" || ui === "Admin";
        });
        setStaff(list);

        // load assignment cho từng user
        list.forEach(async (u) => {
          try {
            const r = await api.get<any>(`/station-managers/${u.id}`, { withCredentials: true }).catch(() => null);
            const raw = r?.data?.data ?? r?.data;
            const arr: StationAssign[] = Array.isArray(raw)
              ? raw
                  .map((x: any) => x.station ?? x.stationDto ?? x)
                  .filter(Boolean)
                  .map((s: any) => ({ id: Number(s.id), name: s.name, address: s.address }))
              : raw
              ? [
                  {
                    id: Number(raw.station?.id ?? raw.id),
                    name: raw.station?.name ?? raw.name,
                    address: raw.station?.address ?? raw.address,
                  },
                ]
              : [];
            setAssigns((m) => ({ ...m, [u.id]: arr }));
          } catch {}
        });
      } catch (e: any) {
        toast({ title: "Load staff failed", description: e?.response?.data?.message, variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  /* ===== Load stations for Add Staff dialog ===== */
  useEffect(() => {
    if (!addOpen) return;
    (async () => {
      try {
        // Chuẩn API: /charging-stations/getAll
        const res = await api.get<{ data: { content: ChargingStationDetailResponse[] } }>(
          "/charging-stations/getAll",
          { params: { page: 0, size: 200 } }
        );
        const rows = res.data?.data?.content ?? [];

        const opts: StationOption[] = rows.map((s) => ({
          id: Number(s.id),
          name: String(s.name),
          address: s.address,
        }));

        const preview: Record<number, StationPreview> = {};
        rows.forEach((s) => {
          const pillars = (s.pillars ?? []).length || Number(s.totalConnectors ?? 0);
          const priceList = (s.pillars ?? [])
            .map((p) => p.pricePerKwh)
            .filter((x): x is number => typeof x === "number");
          const minP = priceList.length ? Math.min(...priceList) : s.minPrice ?? null;
          const maxP = priceList.length ? Math.max(...priceList) : s.maxPrice ?? null;
          const powerList = (s.pillars ?? [])
            .map((p) => p.power)
            .filter((x): x is number => typeof x === "number");
          const maxPower = powerList.length ? Math.max(...powerList) : s.maxPower ?? null;

          preview[s.id] = {
            id: s.id,
            name: s.name,
            address: s.address,
            status: s.status,
            pillars,
            maxPower,
            minPrice: minP ?? null,
            maxPrice: maxP ?? null,
          };
        });

        setStations(opts);
        setStationMap(preview);

        if (addPayload.stationId) {
          setSelectedStation(preview[Number(addPayload.stationId)] ?? null);
        } else {
          setSelectedStation(null);
        }
      } catch {
        setStations([]);
        setStationMap({});
        setSelectedStation(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen]);

  /* ===== Derived list with search + role filter ===== */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return staff.filter((u) => {
      const ui = backendToUi[u.roleName] || u.roleName;
      const matchText =
        !term ||
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term);
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "staff" && ui === "Staff") ||
        (roleFilter === "admin" && ui === "Admin");
      return matchText && (ui === "Staff" || ui === "Admin") && matchRole;
    });
  }, [staff, search, roleFilter]);

  /* ===== Actions ===== */
  const changeStatus = async (u: User) => {
    setLoadingMap((m) => ({ ...m, [u.id]: true }));
    const prev = u.status;
    setStaff((list) => list.map((x) => (x.id === u.id ? { ...x, status: !x.status } : x)));
    try {
      await api.put(`/admin/users/${u.id}/status`, null, { params: { active: !prev } });
      toast({ title: !prev ? "Activated" : "Suspended" });
    } catch (e: any) {
      setStaff((list) => list.map((x) => (x.id === u.id ? { ...x, status: prev } : x)));
      toast({ title: "Update failed", description: e?.response?.data?.message, variant: "destructive" });
    } finally {
      setLoadingMap((m) => ({ ...m, [u.id]: false }));
    }
  };

  const saveRole = async () => {
    if (!selected) return;
    const uiNow = (backendToUi[selected.roleName] || "Staff") as "Staff" | "Admin";
    const be = uiToBackend[uiNow];
    try {
      await api.post("/user/setRole", { username: selected.username, roleName: be, keepUserBaseRole: false });
      setStaff((list) => list.map((x) => (x.id === selected.id ? { ...x, roleName: be } : x)));
      toast({ title: "Role updated" });
      setEditOpen(false);
    } catch (e: any) {
      toast({ title: "Update role failed", description: e?.response?.data?.message, variant: "destructive" });
    }
  };

  const addStaff = async () => {
    const { fullName, username, email, phone, password, roleUi, stationId } = addPayload;
    if (!fullName || !username || !email || !phone || !password || !roleUi) {
      return toast({
        title: "Validation",
        description: "Vui lòng điền đủ: Full name, Username, Email, Phone, Password, Role và Station.",
        variant: "destructive",
      });
    }
    if (!stationId) {
      return toast({ title: "Validation", description: "Vui lòng chọn trạm để gán quản lý.", variant: "destructive" });
    }
    setAddSaving(true);
    try {
      // 1) Tạo staff (CreateStaffRequest)
      const roleId = uiToRoleId[roleUi];
      const r = await api.post<{ user_id: number }>("/admin/createStaff", {
        fullName,
        username,
        password,
        email,
        phone,
        roleId,
      });
      const newId = Number(r?.data?.user_id);
      if (!newId) throw new Error("Create staff succeeded but cannot determine new user id.");

      // 2) Gán station cho user vừa tạo
      await api.post("/station-managers/assign", { userId: newId, stationId });

      // 3) Reload danh sách
      const list = await api.get<User[]>("/user/getAll");
      setStaff(
        (list.data || []).filter((u) => {
          const ui = backendToUi[u.roleName] || u.roleName;
          return ui === "Staff" || ui === "Admin";
        })
      );

      // 4) Refresh assignment map cho user mới
      try {
        const g = await api.get<any>(`/station-managers/${newId}`, { withCredentials: true });
        const raw = g?.data?.data ?? g?.data;
        const arr: StationAssign[] = raw
          ? [
              {
                id: Number(raw.station?.id ?? raw.id),
                name: raw.station?.name ?? raw.name,
                address: raw.station?.address ?? raw.address,
              },
            ]
          : [];
        setAssigns((m) => ({ ...m, [newId]: arr }));
      } catch {}

      setAddOpen(false);
      setAddPayload({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        roleUi: "Staff",
        stationId: "",
      });
      setSelectedStation(null);
      toast({ title: "Staff created" });
    } catch (e: any) {
      toast({
        title: "Create staff failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    } finally {
      setAddSaving(false);
    }
  };

  /* ===== Station detail (View) ===== */
  const openStationDialog = async (stationId: number) => {
    setStationOpen(true);
    setStationLoading(true);
    setStationDetail(null);
    try {
      const { data } = await api.get<ChargingStationDetailResponse>(`/charging-stations/${stationId}`);
      setStationDetail(mapDetailToStation(data));
    } catch (e: any) {
      toast({ title: "Load station failed", description: e?.response?.data?.message, variant: "destructive" });
    } finally {
      setStationLoading(false);
    }
  };

  /* ===== Header (search + role filter + add staff) ===== */
  const header = (
    <div className="flex items-center gap-3 bg-white rounded-full p-2.5 shadow">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9 w-[320px] rounded-full bg-slate-100 border-0"
          placeholder="Search staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
        <SelectTrigger className="w-44 rounded-full border-0 bg-slate-100">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
            <UserPlus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] bg-white">
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <IdCard className="w-4 h-4" /> Full Name *
              </Label>
              <Input
                value={addPayload.fullName}
                onChange={(e) => setAddPayload((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>Username *</Label>
              <Input
                value={addPayload.username}
                onChange={(e) => setAddPayload((p) => ({ ...p, username: e.target.value }))}
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={addPayload.email}
                onChange={(e) => setAddPayload((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div>
              <Label>Phone *</Label>
              <Input
                value={addPayload.phone}
                onChange={(e) => setAddPayload((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Password *
              </Label>
              <Input
                type="password"
                value={addPayload.password}
                onChange={(e) => setAddPayload((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            <div>
              <Label>Role *</Label>
              <Select
                value={addPayload.roleUi}
                onValueChange={(v: "Staff" | "Admin") => setAddPayload((p) => ({ ...p, roleUi: v }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Station to manage *
              </Label>
              <Select
                value={String(addPayload.stationId || "")}
                onValueChange={(v) => {
                  const id = Number(v);
                  setAddPayload((p) => ({ ...p, stationId: id }));
                  setSelectedStation(stationMap[id] ?? null);
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a station" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-72 overflow-y-auto">
                  {stations.length ? (
                    stations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        #{s.id} • {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-slate-500">No stations found.</div>
                  )}
                </SelectContent>
              </Select>

              {/* ==== Station preview card ==== */}
              {selectedStation ? (
                <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{selectedStation.name}</div>
                      <div className="text-slate-600 truncate">{selectedStation.address || "—"}</div>
                    </div>
                    <Badge
                      className={`ml-3 ${
                        String(selectedStation.status ?? "")
                          .toLowerCase()
                          .includes("avail")
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {selectedStation.status ?? "—"}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white p-2 border text-center">
                      <div className="text-[11px] text-slate-500 uppercase">Pillars</div>
                      <div className="text-base font-semibold">{selectedStation.pillars}</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border text-center">
                      <div className="text-[11px] text-slate-500 uppercase">Max Power</div>
                      <div className="text-base font-semibold">{selectedStation.maxPower ?? "—"} kW</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border text-center">
                      <div className="text-[11px] text-slate-500 uppercase">Price</div>
                      <div className="text-base font-semibold">
                        {vnd(selectedStation.minPrice)}
                        {selectedStation.maxPrice != null &&
                        selectedStation.maxPrice !== selectedStation.minPrice
                          ? `–${vnd(selectedStation.maxPrice)}`
                          : "" }
                        /kWh
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addStaff} disabled={addSaving} className="bg-sky-500 text-white">
              {addSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <AdminLayout title="Staff" actions={header}>
      <Card className="border-0 shadow-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-72 text-slate-500 gap-2 p-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stations</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const roleUi = (backendToUi[s.roleName] || "Staff") as "Staff" | "Admin";
                    const list = assigns[s.id] || [];
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-semibold">{s.fullName}</TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-2" />
                            {s.email || "-"}
                          </div>
                          <div className="text-sm text-slate-600 flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-2" />
                            {s.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {roleUi === "Admin" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              <Shield className="w-3.5 h-3.5 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-800 border-slate-200">Staff</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.status ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {list.length ? (
                            <div className="flex flex-wrap gap-2">
                              {list.map((st) => (
                                <Badge
                                  key={st.id}
                                  variant="outline"
                                  className="cursor-pointer"
                                  onClick={() => openStationDialog(st.id)}
                                  title={st.address || ""}
                                >
                                  #{st.id} • {st.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => {
                                setSelected(s);
                                setEditOpen(true);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-700"
                              onClick={() => {
                                const first = (assigns[s.id] || [])[0];
                                if (first) openStationDialog(first.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!!loadingMap[s.id]}
                              className={s.status ? "text-red-600" : "text-emerald-600"}
                              onClick={() => changeStatus(s)}
                            >
                              {loadingMap[s.id] ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                              {s.status ? "Suspend" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Edit Staff dialog (Staff/Admin) ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input disabled value={selected.fullName} />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input disabled value={selected.username} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input disabled value={selected.email || ""} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input disabled value={selected.phone || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={(backendToUi[selected.roleName] as "Staff" | "Admin") || "Staff"}
                  onValueChange={(ui) => {
                    const be = uiToBackend[ui as "Staff" | "Admin"] ?? "ROLE_STAFF";
                    setSelected({ ...selected, roleName: be });
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole} className="bg-sky-500 text-white">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Station detail dialog (View) ===== */}
      <Dialog open={stationOpen} onOpenChange={setStationOpen}>
        <DialogContent className="w-[92vw] max-w-3xl p-0 overflow-hidden sm:rounded-2xl [&>button]:hidden">
          <div className="flex max-h-[82vh] flex-col">
            {/* Header */}
            <div className="relative h-20 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={() => setStationOpen(false)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
              <div className="relative z-10 flex h-full items-end gap-3 px-5 pb-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-700 shadow">
                  <span className="text-sm font-bold">
                    {(stationDetail?.name ?? "ST")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {stationDetail?.name ?? (stationLoading ? "Loading…" : "—")}
                    </h2>
                    {stationDetail && (
                      <Badge
                        className={`border ${
                          statusStyles[stationDetail.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
                        } bg-white/90`}
                      >
                        {stationDetail.status}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-white/90">{stationDetail?.address}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            {stationLoading ? (
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
                <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : stationDetail ? (
              <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Availability</div>
                    <div className="mt-1 text-lg font-semibold flex items-center gap-2">
                      <span>
                        {stationDetail.availablePorts}/{stationDetail.totalPorts}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">Free / Total ports</div>
                  </div>
                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Price Range</div>
                    <div className="mt-1 text-lg font-semibold">
                      {vnd(stationDetail.minPrice)}
                      {stationDetail.maxPrice && stationDetail.maxPrice !== stationDetail.minPrice
                        ? `–${vnd(stationDetail.maxPrice)}`
                        : ""}
                      /kWh
                    </div>
                  </div>
                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Max Power</div>
                    <div className="mt-1 text-lg font-semibold">{stationDetail.maxPower ?? "—"} kW</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {(stationDetail.maxPower ?? 0) >= 150 ? "Fast" : "Standard"}
                    </div>
                  </div>
                </div>

                {/* Connectors */}
                <div>
                  <div className="mb-2 text-xs font-medium text-slate-500">Available Connectors</div>
                  <div className="flex flex-wrap gap-1.5">
                    {stationDetail.connectorTypes?.length ? (
                      stationDetail.connectorTypes.map((c) => (
                        <Badge key={c} variant="outline" className="rounded-full">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No connector info.</span>
                    )}
                  </div>
                </div>

                {/* Pillars */}
                <div>
                  <div className="mb-2 text-xs font-medium text-slate-500">Charging Pillars</div>
                  <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                    {stationDetail.pillars.length ? (
                      stationDetail.pillars.map((p) => (
                        <div
                          key={p.code}
                          className="group relative rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold">{p.code}</div>
                                <Badge
                                  className={`border ${
                                    statusStyles[p.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {p.status}
                                </Badge>
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {p.power} kW • {vnd(p.pricePerKwh)}/kWh
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {p.connectors.map((c, i) => (
                                  <Badge key={i} variant="secondary" className="rounded-full text-xs">
                                    {c.type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="pointer-events-none absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 opacity-0 ring-1 ring-slate-200 transition group-hover:opacity-100">
                            Port
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                        No detailed port information from server.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-slate-600">No station data.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
