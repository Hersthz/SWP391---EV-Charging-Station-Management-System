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
  const [roleFilter, setRoleFilter] = useState<"all"|"basic"|"premium">("all");

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<UserResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<UserResponse[]>("/user/getAll");
        if (!mounted) return;
        const raw = (res.data || [])
          // chỉ user + premium
          .filter(u => {
            const ui = backendToRoleUi[u.roleName] || u.roleName;
            return ui === "Basic User" || ui === "Premium User";
          })
          .sort((a,b) => (b.id??0)-(a.id??0));
        setUsers(raw);

        // đếm sessions
        raw.forEach(async (u) => {
          try {
            const page = await api.get<PageResp<any>>(`/session/user/${u.id}`, { params: { page:0, size:1 } });
            const total = page.data?.data?.totalElements ?? 0;
            setSessionsMap(m => ({...m,[u.id]: total}));
          } catch {}
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
      await api.post("/user/setRole", { username: selected.username, roleName: be, keepUserBaseRole: false });
      setUsers(list => list.map(x => x.id===selected.id ? {...x, roleName: be} : x));
      toast({ title: "Role updated" });
      setEditOpen(false);
    } catch (e:any) {
      toast({ title:"Update role failed", description:e?.response?.data?.message, variant:"destructive" });
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
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveRole} className="bg-sky-500 text-white">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
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
