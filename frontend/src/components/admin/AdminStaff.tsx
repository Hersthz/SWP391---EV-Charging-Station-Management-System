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
  UserPlus,
  Mail,
  Phone,
  Loader2,
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
/* roleId map cho request tạo staff (DB: 1=USER, 2=STAFF, 3=ADMIN) */
const uiToRoleId: Record<"Staff" | "Admin", number> = { Staff: 2, Admin: 3 };

/* ===== Station option used in selects ===== */
type StationOption = { id: number; name: string; address?: string };

/* ===== ChargingStation (rút gọn) cho preview nhỏ ===== */
type ChargingStationDetailResponse = {
  id: number;
  name: string;
  address: string;
  status?: string | null;
  totalConnectors?: number | null;
  pillars?: { power?: number | null; pricePerKwh?: number | null }[];
  minPrice?: number | null;
  maxPrice?: number | null;
  maxPower?: number | null;
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
    roleUi: "Staff" as "Staff" ,
    stationId: "" as number | "",
  });

  // Station options (dùng chung cho Add + Edit)
  const [stations, setStations] = useState<StationOption[]>([]);

  /* ========= Edit dialog ========= */
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [editRoleUi, setEditRoleUi] = useState<"Staff" | "Admin">("Staff");
  const [editStationId, setEditStationId] = useState<number | "">("");

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
            const r = await api.get<any>(`/station-managers/${u.id}`, {
              withCredentials: true,
            });
            const raw = r?.data?.data ?? r?.data;
            const arr: StationAssign[] = raw
              ? [
                  {
                    id: Number(raw.station?.id ?? raw.id),
                    name: raw.station?.name ?? raw.name,
                    address: raw.station?.address ?? raw.address,
                  },
                ]
              : [];
            setAssigns((m) => ({ ...m, [u.id]: arr }));
          } catch {
            setAssigns((m) => ({ ...m, [u.id]: [] }));
          }
        });
      } catch (e: any) {
        toast({
          title: "Load staff failed",
          description: e?.response?.data?.message,
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  /* ===== Load stations for selects (when mở Add/Edit) ===== */
  const loadStationsOnce = async () => {
    if (stations.length) return;
    try {
      const res = await api.get<{
        data: { content: ChargingStationDetailResponse[] };
      }>("/charging-stations/getAll", { params: { page: 0, size: 200 } });
      const rows = res.data?.data?.content ?? [];
      setStations(
        rows.map((s) => ({ id: Number(s.id), name: s.name, address: s.address }))
      );
    } catch {
      setStations([]);
    }
  };

  useEffect(() => {
    if (addOpen) loadStationsOnce();
  }, [addOpen]);

  useEffect(() => {
    if (editOpen) loadStationsOnce();
  }, [editOpen]);

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
  // Toggle bằng API đúng: PUT /user/block/{id}
  const toggleBlock = async (u: User) => {
    setLoadingMap((m) => ({ ...m, [u.id]: true }));
    const prev = u.status;
    setStaff((list) => list.map((x) => (x.id === u.id ? { ...x, status: !x.status } : x)));
    try {
      await api.put(`/user/block/${u.id}`); // principal xác thực phía BE
      toast({ title: prev ? "Suspended" : "Activated" });
    } catch (e: any) {
      setStaff((list) => list.map((x) => (x.id === u.id ? { ...x, status: prev } : x)));
      toast({
        title: "Update failed",
        description: e?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMap((m) => ({ ...m, [u.id]: false }));
    }
  };

  const saveRole = async (user: User, roleUi: "Staff" | "Admin") => {
    const be = uiToBackend[roleUi];
    await api.post("/user/setRole", {
      username: user.username,
      roleName: be,
      keepUserBaseRole: false,
    });
    setStaff((list) =>
      list.map((x) => (x.id === user.id ? { ...x, roleName: be } : x))
    );
  };

  const assignStation = async (userId: number, stationId: number) => {
    await api.post("/station-managers/assign", { userId, stationId });
    // update local assigns
    const opt = stations.find((s) => s.id === stationId);
    setAssigns((m) => ({
      ...m,
      [userId]: opt ? [{ id: opt.id, name: opt.name, address: opt.address }] : [],
    }));
  };

  const addStaff = async () => {
    const { fullName, username, email, phone, password, roleUi, stationId } =
      addPayload;
    if (!fullName || !username || !email || !phone || !password || !roleUi) {
      return toast({
        title: "Validation",
        description:
          "Vui lòng điền đủ: Full name, Username, Email, Phone, Password, Role và Station.",
        variant: "destructive",
      });
    }
    if (!stationId) {
      return toast({
        title: "Validation",
        description: "Vui lòng chọn trạm để gán quản lý.",
        variant: "destructive",
      });
    }
    setAddSaving(true);
    try {
      // 1) Tạo staff
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

      // 2) Gán station
      await assignStation(newId, Number(stationId));

      // 3) Reload list
      const list = await api.get<User[]>("/user/getAll");
      setStaff(
        (list.data || []).filter((u) => {
          const ui = backendToUi[u.roleName] || u.roleName;
          return ui === "Staff" || ui === "Admin";
        })
      );

      // reset
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

  /* ===== Header (search + filter + add) ===== */
  const header = (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-full p-2.5 shadow">
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

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Station to manage *
              </Label>
              <Select
                value={String(addPayload.stationId || "")}
                onValueChange={(v) =>
                  setAddPayload((p) => ({ ...p, stationId: Number(v) }))
                }
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
                    <TableHead>Name</TableHead>
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
                                <Badge key={st.id} variant="outline" title={st.address || ""}>
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
                            <Dialog
                              open={editOpen && selected?.id === s.id}
                              onOpenChange={(open) => {
                                setEditOpen(open);
                                if (open) {
                                  setSelected(s);
                                  setEditRoleUi(roleUi);
                                  const first = (assigns[s.id] || [])[0];
                                  setEditStationId(first?.id ?? "");
                                } else {
                                  setSelected(null);
                                  setEditStationId("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-blue-600">
                                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[520px] bg-white">
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

                                    {/* Station reassignment */}
                                    <div className="space-y-2">
                                      <Label className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Station
                                      </Label>
                                      <Select
                                        value={String(editStationId || "")}
                                        onValueChange={(v) => setEditStationId(Number(v))}
                                      >
                                        <SelectTrigger className="bg-white">
                                          <SelectValue placeholder="Select a station" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-72 overflow-y-auto">
                                          {stations.length ? (
                                            stations.map((st) => (
                                              <SelectItem key={st.id} value={String(st.id)}>
                                                #{st.id} • {st.name}
                                              </SelectItem>
                                            ))
                                          ) : (
                                            <div className="p-3 text-sm text-slate-500">No stations found.</div>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={async () => {
                                      if (!selected) return;
                                      try {
                                        // cập nhật role nếu đổi
                                        const newRoleChanged =
                                          (backendToUi[selected.roleName] || "Staff") !== editRoleUi;
                                        if (newRoleChanged) await saveRole(selected, editRoleUi);

                                        // gán station nếu chọn
                                        if (editStationId) {
                                          await assignStation(selected.id, Number(editStationId));
                                        }
                                        toast({ title: "Updated" });
                                        setEditOpen(false);
                                      } catch (e: any) {
                                        toast({
                                          title: "Update failed",
                                          description: e?.response?.data?.message,
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="bg-sky-500 text-white"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!!loadingMap[s.id]}
                              className={s.status ? "text-red-600" : "text-emerald-600"}
                              onClick={() => toggleBlock(s)}
                            >
                              {loadingMap[s.id] ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : null}
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
    </AdminLayout>
  );
}
