// src/pages/admin/AdminUsersPage.tsx
import { useEffect, useMemo, useState, ReactNode } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useToast } from "../../hooks/use-toast";
import { Search, Edit, UserX, Mail, Phone, Calendar, Loader2, Users, UserCheck, Star } from "lucide-react";

/* =========================
  Types: khớp BE hiện có
type Station = {
  id: number;
  name: string;
};

/* ===== Types ===== */
type UserResponse = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: boolean;
  isVerified: boolean;
  roleName: string;
  createdAt?: string | null;
};
type PageResp<T> = {
  code?: string; message?: string;
  data: { content: T[]; totalElements: number; totalPages: number; size: number; number: number; };
};

/* ===== Role helpers (giống file cũ) ===== */
const roleUiToBackend: Record<string, string> = {
  "Basic User": "ROLE_USER",
  "Premium User": "ROLE_PREMIUM",
};
const backendToRoleUi: Record<string, string> = {
  ROLE_USER: "Basic User",
  ROLE_PREMIUM: "Premium User",
  USER: "Basic User",
  PREMIUM: "Premium User",
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [sessionsMap, setSessionsMap] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  

  const [stations, setStations] = useState<Station[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "basic" | "premium" | "fleet">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<UserResponse | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    stationId: "" as string | "", // để Select xài string
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  /* =========================
    Fetch users
  ========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<UserResponse[]>("/user/getAll");
        if (!isMounted) return;
        const list = (res.data || []).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setUsers(list);
        // lấy số session
        Promise.all(
          list.map(async (u) => {
            try {
              const page = await api.get<PageResp<any>>(`/session/user/${u.id}`, {
                params: { page: 0, size: 1 },
              });
              const total = page.data?.data?.totalElements ?? 0;
              setSessionsMap((m) => ({ ...m, [u.id]: total }));
            } catch {
              // bỏ qua
            }
          })
        ).catch(() => undefined);
        // ====== MỚI: fetch station ======
        try {
          const stRes = await api.get<Station[]>("/station/getAll"); // đổi endpoint nếu BE m khác
          if (isMounted) {
            setStations(stRes.data || []);
          }
        } catch {
          // không có station thì thôi
        }
        // ================================
      } catch (e: any) {
        toast({
          title: "Load users failed",
          description: e?.response?.data?.message || "Không thể tải danh sách người dùng",
          variant: "destructive",
        });
      } catch (e:any) {
        toast({ title:"Load users failed", description:e?.response?.data?.message || "Không tải được danh sách", variant:"destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(u => {
      const roleUi = backendToRoleUi[u.roleName] || u.roleName;
      const matchSearch =
        !term ||
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term);
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "basic" && roleUi === "Basic User") ||
        (roleFilter === "premium" && roleUi === "Premium User");
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const toggleStatus = async (u: UserResponse) => {
    setLoadingMap(m => ({...m,[u.id]:true}));
    const prev = u.status;
    setUsers(list => list.map(x => x.id===u.id ? {...x, status: !x.status} : x));
    try {
      await api.put(`/admin/users/${u.id}/status`, null, { params: { active: !prev } });
      toast({ title: !prev ? "Activated" : "Suspended" });
    } catch (e:any) {
      setUsers(list => list.map(x => x.id===u.id ? {...x, status: prev} : x));
      toast({ title:"Update status failed", description: e?.response?.data?.message, variant:"destructive" });
    } finally {
      setLoadingMap(m => ({...m,[u.id]:false}));
    }
  };

  const saveRole = async () => {
    if (!selected) return;
    const ui = backendToRoleUi[selected.roleName] || selected.roleName;
    const be = roleUiToBackend[ui] ?? "ROLE_USER";
    try {
      // 1. set role như cũ
      await api.post("/user/setRole", {
        username: u.username,
        roleName,
        keepUserBaseRole: false,
      });

      // 2. nếu là staff/fleet và có stationId thì assign thêm
      if (
        (roleName === "ROLE_FLEET_MANAGER" || roleName === "STAFF") &&
        // @ts-ignore
        u.stationId
      ) {
        await api.post("/station-managers/assign", {
          userId: u.id,
          // @ts-ignore
          stationId: u.stationId,
        });
      }

      toast({ title: "Updated", description: "Role has been updated." });
      setEditOpen(false);

      // cập nhật lại state
      setUsers((list) =>
        list.map((x) =>
          x.id === u.id
            ? {
              ...x,
              roleName,
              // @ts-ignore
              stationId: (u as any).stationId ?? (x as any).stationId,
            }
            : x
        )
      );
    } catch (e: any) {
      toast({
        title: "Update role failed",
        description: e?.response?.data?.message || "Không cập nhật được vai trò.",
        variant: "destructive",
      });
    }
  };
  const addStaff = async () => {
    if (!addPayload.fullName || !addPayload.username || !addPayload.email || !addPayload.phone) {
      toast({
        title: "Validation error",
        description: "Vui lòng điền đủ họ tên, username, email, phone.",
        variant: "destructive",
      });
      return;
    }
    setSubmittingAdd(true);
    try {
      const res = await api.post("/user/add-staff", addPayload);
      const list = await api.get<UserResponse[]>("/user/getAll");
      setUsers(list.data || []);
      setAddOpen(false);
      setAddPayload({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        stationId: "",
      });
      toast({ title: "Staff created", description: "Tạo nhân viên thành công." });
    } catch (e: any) {
      toast({
        title: "Create staff failed",
        description: e?.response?.data?.message || "Không tạo được nhân viên.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const header = (
    <div className="flex items-center gap-3 bg-white rounded-full p-2.5 shadow">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9 w-[320px] rounded-full bg-slate-100 border-0" placeholder="Search users…" value={search} onChange={(e)=>setSearch(e.target.value)} />
      </div>
      <Select value={roleFilter} onValueChange={(v:any)=>setRoleFilter(v)}>
        <SelectTrigger className="w-44 rounded-full border-0 bg-slate-100">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="basic">Basic User</SelectItem>
          <SelectItem value="premium">Premium User</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AdminLayout title="Users" actions={header}>
      <Card className="border-0 shadow-xl">
        <CardContent className="p-0">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pb-0">
            <Kpi title="Total Users" value={users.length} icon={<Users className="w-6 h-6" />} />
            <Kpi title="Active Users" value={users.filter(u=>u.status).length} icon={<UserCheck className="w-6 h-6" />} />
            <Kpi title="Premium Users" value={users.filter(u=>(backendToRoleUi[u.roleName]||u.roleName)==="Premium User").length} icon={<Star className="w-6 h-6" />} />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-72 text-slate-500 gap-2 p-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u=>{
                    const sessions = sessionsMap[u.id] ?? 0;
                    const uiRole = backendToRoleUi[u.roleName] || u.roleName;
                    const roleBadge =
                      <Badge className="bg-slate-100 text-slate-800 border-slate-200">{uiRole}</Badge>;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-semibold">{u.fullName}</div>
                          <div className="text-xs text-slate-500 flex items-center"><Calendar className="w-3 h-3 mr-1"/>Joined {formatDate(u.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center"><Mail className="w-3.5 h-3.5 mr-2"/>{u.email||"-"}</div>
                          <div className="text-sm text-slate-600 flex items-center"><Phone className="w-3.5 h-3.5 mr-2"/>{u.phone||"-"}</div>
                        </TableCell>
                        <TableCell>{roleBadge}</TableCell>
                        <TableCell>
                          {u.status
                            ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                            : <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold">{sessions}</div>
                          <div className="text-xs text-slate-500">sessions</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="text-blue-600"
                              onClick={()=>{ setSelected(u); setEditOpen(true); }}>
                              <Edit className="w-3.5 h-3.5 mr-1.5"/> Edit
                            </Button>
                            <Button size="sm" variant="ghost"
                              disabled={!!loadingMap[u.id]}
                              className={u.status?"text-red-600":"text-emerald-600"}
                              onClick={()=>toggleStatus(u)}>
                              {loadingMap[u.id] ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : <UserX className="w-3.5 h-3.5 mr-1.5"/>}
                              {u.status?"Suspend":"Activate"}
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

      {/* Edit role dialog (Users) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full name</Label><Input disabled value={selected.fullName} /></div>
                <div><Label>Username</Label><Input disabled value={selected.username} /></div>
                <div><Label>Email</Label><Input disabled value={selected.email||""} /></div>
                <div><Label>Phone</Label><Input disabled value={selected.phone||""} /></div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={(backendToRoleUi[selected.roleName] as "Basic User"|"Premium User") || "Basic User"}
                  onValueChange={(ui)=>{ const be = roleUiToBackend[ui] ?? "ROLE_USER"; setSelected({...selected, roleName: be}); }}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Basic User">Basic User</SelectItem>
                    <SelectItem value="Premium User">Premium User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

          </div>
          {/* MỚI: Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={addPayload.password}
              onChange={(e) => setAddPayload((p) => ({ ...p, password: e.target.value }))}
            />
          </div>

          {/* MỚI: Station */}
          <div className="space-y-2">
            <Label>Station</Label>
            <Select
              value={addPayload.stationId}
              onValueChange={(val) => setAddPayload((p) => ({ ...p, stationId: val }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chose station" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {stations.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addStaff} disabled={submittingAdd} className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
              {submittingAdd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* =========================
    Render
  ========================= */
  return (
    <AdminLayout title="User Management" actions={headerActions}>
      <div className="w-full h-full bg-slate-100 text-slate-900">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={kpiContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            title="Total Users"
            value={users.length}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={users.filter((u) => u.status).length}
            icon={<UserCheck className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Premium Users"
            value={users.filter((u) => (backendToRoleUi[u.roleName] || u.roleName) === "Premium User").length}
            icon={<Star className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Fleet Managers"
            value={users.filter((u) => (backendToRoleUi[u.roleName] || u.roleName) === "Fleet Manager").length}
            icon={<Truck className="w-6 h-6" />}
            color="purple"
          />
        </motion.div>

        {/* Table */}
        <motion.div variants={kpiCardVariants} initial="hidden" animate="visible">
          <Card className="bg-white border-0 shadow-2xl shadow-slate-900/10 rounded-2xl">
            <CardContent className="p-0">
              <div className="px-8 py-6">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                  <Users className="w-5 h-5 mr-3 text-slate-500" />
                  User Management ({filteredUsers.length} users)
                </h3>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 p-8 justify-center h-96">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-slate-200 hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-8">User Details</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-6">Contact Info</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-6">Role</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-6">Status</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-6">Activity</TableHead>
                        <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider h-14 px-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const created = formatDate(u.createdAt);
                        const sessions = sessionsMap[u.id] ?? 0;
                        return (
                          <TableRow key={u.id} className="border-b border-slate-200/60 last:border-b-0 hover:bg-slate-50/70 transition-colors">
                            <TableCell className="py-5 px-8">
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-900 text-base">{u.fullName}</div>
                                <div className="text-sm text-slate-500 flex items-center">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                  Joined {created}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                  <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                  <span className="text-blue-600 font-medium">{u.email || "-"}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                  <span>{u.phone || "-"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">{getRoleBadge(u.roleName)}</TableCell>
                            <TableCell className="py-5 px-6">{getStatusBadge(u.status)}</TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="space-y-1 text-center">
                                <div className="text-base font-semibold text-slate-900">{sessions}</div>
                                <div className="text-xs text-slate-500">sessions</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => openEdit(u)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!!loadingMap[u.id]}
                                  className={
                                    u.status
                                      ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  }
                                  onClick={() => toggleStatus(u)}
                                >
                                  {loadingMap[u.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5 mr-1.5" />
                                  )}
                                  {u.status ? "Suspend" : "Activate"}
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
        </motion.div>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[520px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Edit className="w-5 h-5 mr-2 text-blue-600" />
                Edit User
              </DialogTitle>
              <DialogDescription>Update user role & view basic info</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={selectedUser.fullName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={selectedUser.username} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={selectedUser.email || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={selectedUser.phone || ""} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User Role</Label>
                    <Select
                      value={
                        (backendToRoleUi[selectedUser.roleName] as
                          | "Basic User"
                          | "Premium User"
                          | "Fleet Manager") || "Basic User"
                      }
                      onValueChange={(uiRole) => {
                        const be = roleUiToBackend[uiRole] ?? "ROLE_USER";
                        setSelectedUser({ ...selectedUser, roleName: be });
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Basic User">Basic User</SelectItem>
                        <SelectItem value="Premium User">Premium User</SelectItem>
                        <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Input value={selectedUser.status ? "Active" : "Suspended"} disabled />
                  </div>
                </div>
                {(
                  selectedUser.roleName === "ROLE_FLEET_MANAGER" ||
                  selectedUser.roleName === "FLEET_MANAGER" ||
                  selectedUser.roleName === "STAFF"
                ) && (
                    <div className="space-y-2">
                      <Label>Station</Label>
                      <Select
                        value={(selectedUser as any).stationId ? String((selectedUser as any).stationId) : ""}
                        onValueChange={(val) =>
                          setSelectedUser({
                            ...selectedUser,
                            // @ts-ignore: thêm field mới
                            stationId: val ? Number(val) : null,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Chose Station" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {stations.map((st) => (
                            <SelectItem key={st.id} value={String(st.id)}>
                              {st.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Kpi({title,value,icon}:{title:string; value:number; icon:ReactNode}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">{icon}</div>
      </CardContent>
    </Card>
  );
}
