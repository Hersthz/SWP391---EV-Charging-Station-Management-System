// src/pages/admin/AdminUsers.tsx
import { useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useToast } from "../../hooks/use-toast";
import {
  Search,
  Shield,
  Edit,
  UserX,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Loader2,
  Users,
  UserCheck,
  Star,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";


/* =========================
  Types: khớp BE hiện có
========================= */
type UserResponse = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: boolean;
  isVerified: boolean;
  roleName: string;
  dateOfBirth?: string | null;
  createdAt?: string | null;
};

type PageResp<T> = {
  code: string;
  message: string;
  data: {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
};

/* =========================
  Helpers
========================= */
const roleUiToBackend: Record<string, string> = {
  "Basic User": "ROLE_USER",
  "Premium User": "ROLE_PREMIUM",
  "Fleet Manager": "ROLE_FLEET_MANAGER",
};

const backendToRoleUi: Record<string, string> = {
  ROLE_USER: "Basic User",
  ROLE_PREMIUM: "Premium User",
  ROLE_FLEET_MANAGER: "Fleet Manager",
  USER: "Basic User",
  PREMIUM: "Premium User",
  FLEET_MANAGER: "Fleet Manager",
  STAFF: "Fleet Manager",
  ADMIN: "Admin",
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
};

const kpiContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const kpiCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1],
    },
  },
};

/* =========================
  Component
========================= */
const AdminUsers = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [sessionsMap, setSessionsMap] = useState<Record<number, number>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "basic" | "premium" | "fleet">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addPayload, setAddPayload] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  /* =========================
    Fetch users
  ========================= */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<UserResponse[]>("/user/getAll");
        if (!isMounted) return;
        const list = (res.data || []).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setUsers(list);

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
      } catch (e: any) {
        toast({
          title: "Load users failed",
          description: e?.response?.data?.message || "Không thể tải danh sách người dùng",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  /* =========================
    Filters
  ========================= */
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const roleUi = backendToRoleUi[u.roleName] || u.roleName || "-";
      const statusStr = u.status ? "active" : "suspended";
      const matchSearch =
        !term ||
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term);

      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "basic" && roleUi === "Basic User") ||
        (roleFilter === "premium" && roleUi === "Premium User") ||
        (roleFilter === "fleet" && roleUi === "Fleet Manager");

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && statusStr === "active") ||
        (statusFilter === "suspended" && statusStr === "suspended");

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  /* =========================
    UI helpers
  ========================= */
  const getStatusBadge = (active: boolean) =>
    active ? (
      <Badge className="bg-emerald-100 text-emerald-700 font-medium py-1 px-3 rounded-full hover:bg-emerald-100 border border-emerald-200">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 font-medium py-1 px-3 rounded-full hover:bg-red-100 border border-red-200">Suspended</Badge>
    );

  const getRoleBadge = (roleName: string) => {
    const ui = backendToRoleUi[roleName] || roleName || "—";
    const cfg: Record<string, { cls: string; icon: ReactNode; text: string }> = {
      "Premium User": { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Star className="w-3.5 h-3.5" />, text: "Premium User" },
      "Fleet Manager": { cls: "bg-blue-100 text-blue-800 border-blue-200", icon: <Truck className="w-3.5 h-3.5" />, text: "Fleet Manager" },
      "Basic User": { cls: "bg-slate-100 text-slate-800 border-slate-200", icon: <Users className="w-3.5 h-3.5" />, text: "Basic User" },
      Admin: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <Shield className="w-3.5 h-3.5" />, text: "Admin" },
    };
    const c = cfg[ui] || { cls: "bg-slate-100 text-slate-800 border-slate-200", icon: <Users className="w-3.5 h-3.5" />, text: ui };
    return (
      <Badge className={`px-3 py-1.5 text-sm rounded-full font-medium ${c.cls} hover:${c.cls} border flex items-center gap-1.5`}>
        {c.icon}
        {c.text}
      </Badge>
    );
  };

  /* =========================
    Actions
  ========================= */
  const openEdit = (u: UserResponse) => {
    setSelectedUser(u);
    setEditOpen(true);
  };

  const toggleStatus = async (u: UserResponse) => {
    setLoadingMap((m) => ({ ...m, [u.id]: true }));
    const prev = u.status;
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: !x.status } : x)));

    try {
      await api.put(`/admin/users/${u.id}/status`, null, { params: { active: !prev } });

      toast({
        title: !prev ? "Activated" : "Suspended",
        description: `${u.fullName} has been ${!prev ? "activated" : "suspended"}.`,
      });
    } catch (e: any) {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: prev } : x)));
      toast({
        title: "Update status failed",
        description:
          e?.response?.data?.message ||
          "Không cập nhật được trạng thái. Hãy đảm bảo BE có endpoint PUT /admin/users/{id}/status.",
        variant: "destructive",
      });
    } finally {
      setLoadingMap((m) => ({ ...m, [u.id]: false }));
    }
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    const u = selectedUser;

    const uiRole = backendToRoleUi[u.roleName] || u.roleName;
    const chosenUi =
      uiRole === "Basic User" || uiRole === "Premium User" || uiRole === "Fleet Manager"
        ? uiRole
        : "Basic User";
    const roleName = roleUiToBackend[chosenUi] ?? "ROLE_USER";

    try {
      await api.post("/user/setRole", {
        username: u.username,
        roleName,
        keepUserBaseRole: false,
      });

      toast({ title: "Updated", description: "Role has been updated." });
      setEditOpen(false);

      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, roleName } : x)));
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
      setAddPayload({ fullName: "", username: "", email: "", phone: "" });
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

  /* =========================
    Header actions
  ========================= */
  const headerActions = (
    <div className="flex items-center gap-3 bg-white shadow-lg shadow-slate-900/10 rounded-full p-2.5">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search users by name, email, username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full min-w-[320px] bg-slate-100 shadow-none border-0 rounded-full h-11 focus-visible:ring-sky-500"
        />
      </div>

      <Select
        value={roleFilter}
        onValueChange={(v: any) => setRoleFilter(v)}
      >
        <SelectTrigger className="w-48 bg-transparent h-11 rounded-full shadow-none border-0 text-slate-700 font-medium hover:bg-slate-100">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent className="bg-white/90 backdrop-blur-md">
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="basic">Basic User</SelectItem>
          <SelectItem value="premium">Premium User</SelectItem>
          <SelectItem value="fleet">Fleet Manager</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={statusFilter}
        onValueChange={(v: any) => setStatusFilter(v)}
      >
        <SelectTrigger className="w-48 bg-transparent h-11 rounded-full shadow-none border-0 text-slate-700 font-medium hover:bg-slate-100">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="bg-white/90 backdrop-blur-md">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 h-11 rounded-full px-6">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <UserPlus className="w-5 h-5 mr-2 text-sky-600" />
              Add New Staff
            </DialogTitle>
            <DialogDescription>Tạo tài khoản nhân viên (dùng /user/add-staff)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={addPayload.fullName}
                onChange={(e) => setAddPayload((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={addPayload.username}
                onChange={(e) => setAddPayload((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={addPayload.email}
                  onChange={(e) => setAddPayload((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={addPayload.phone}
                  onChange={(e) => setAddPayload((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
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
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "blue" | "green" | "yellow" | "purple";
};

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colors = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-l-blue-500", shadow: "shadow-blue-500/10" },
    green: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-l-emerald-500", shadow: "shadow-emerald-500/10" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-l-yellow-500", shadow: "shadow-yellow-500/10" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", border: "border-l-purple-500", shadow: "shadow-purple-500/10" },
  };
  const c = colors[color];

  return (
    <motion.div variants={kpiCardVariants}>
      <Card className={`bg-white border-l-4 ${c.border} shadow-xl ${c.shadow} rounded-2xl`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className={`text-4xl font-extrabold ${c.text}`}>{value}</p>
            </div>
            <div className={`w-16 h-16 bg-gradient-to-br from-white ${c.bg} rounded-2xl flex items-center justify-center ${c.text}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminUsers;