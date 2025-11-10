// src/pages/admin/AdminUsersPage.tsx
import { useEffect, useMemo, useState, ReactNode } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useToast } from "../../hooks/use-toast";
import {
  Search,
  UserX,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Users,
  UserCheck,
  ShieldAlert
} from "lucide-react";

/* ===== Types ===== */
type UserResponse = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: boolean;        // true = active, false = blocked
  isVerified: boolean;
  roleName: string;       // EXPECT: ROLE_USER | USER | ROLE_ADMIN | ...
  createdAt?: string | null;
};
type PageResp<T> = {
  code?: string; message?: string;
  data: { content: T[]; totalElements: number; totalPages: number; size: number; number: number; };
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// helper: chỉ giữ USER
const isBasicUser = (role?: string) => {
  const r = (role || "").toUpperCase();
  return r === "ROLE_USER" || r === "USER";
};

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [sessionsMap, setSessionsMap] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");

  // load users + session counts
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<UserResponse[]>("/user/getAll");
        if (!mounted) return;
        const rawAll = res.data || [];
        const raw = rawAll
          .filter((u) => isBasicUser(u.roleName))       // <<== CHỈ USER
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setUsers(raw);

        raw.forEach(async (u) => {
          try {
            const page = await api.get<PageResp<any>>(`/session/user/${u.id}`, { params: { page: 0, size: 1 } });
            const total = page.data?.data?.totalElements ?? 0;
            setSessionsMap((m) => ({ ...m, [u.id]: total }));
          } catch { /* ignore */ }
        });
      } catch (e: any) {
        toast({
          title: "Load users failed",
          description: e?.response?.data?.message || "Không tải được danh sách người dùng",
          variant: "destructive"
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term)
    );
  }, [users, search]);

  // Toggle block/unblock via /user/block/{id}
  const toggleBlock = async (u: UserResponse) => {
    setLoadingMap(m => ({ ...m, [u.id]: true }));
    const prev = u.status;
    // optimistic UI
    setUsers(list => list.map(x => x.id === u.id ? { ...x, status: !prev } : x));
    try {
      const res = await api.put(`/user/block/${u.id}`);
      const msg = (res.data?.message as string) || (res.data as any)?.message || "Updated";
      toast({ title: msg });
    } catch (e: any) {
      // revert
      setUsers(list => list.map(x => x.id === u.id ? { ...x, status: prev } : x));
      toast({
        title: "Update status failed",
        description: e?.response?.data?.message || "Không thể cập nhật trạng thái",
        variant: "destructive"
      });
    } finally {
      setLoadingMap(m => ({ ...m, [u.id]: false }));
    }
  };

  const header = (
    <div className="flex items-center gap-3 bg-white rounded-full p-2.5 shadow-sm ring-1 ring-slate-200/70">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9 w-[360px] rounded-full bg-slate-100/80 border-0 focus-visible:ring-2 focus-visible:ring-sky-400"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );

  const total = users.length;
  const active = users.filter(u => u.status).length;
  const blocked = users.filter(u => !u.status).length;

  return (
    <AdminLayout title="Users" actions={header}>
      <Card className="border-0 shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pb-0">
            <Kpi title="Total Users" value={total} icon={<Users className="w-6 h-6" />} tone="slate" />
            <Kpi title="Active Users" value={active} icon={<UserCheck className="w-6 h-6" />} tone="emerald" />
            <Kpi title="Blocked Users" value={blocked} icon={<ShieldAlert className="w-6 h-6" />} tone="red" />
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
                    <TableHead className="text-center">Sessions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => {
                    const sessions = sessionsMap[u.id] ?? 0;
                    return (
                      <TableRow key={u.id} className="hover:bg-slate-50/60">
                        <TableCell>
                          <div className="font-semibold">{u.fullName}</div>
                          <div className="text-xs text-slate-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {formatDate(u.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-2" /> {u.email || "-"}
                          </div>
                          <div className="text-sm text-slate-600 flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-2" /> {u.phone || "-"}
                          </div>
                        </TableCell>

                        <TableCell>
                          {/* Luôn hiển thị USER vì đã lọc */}
                          <Badge className="bg-slate-100 text-slate-800 border-slate-200">USER</Badge>
                        </TableCell>

                        <TableCell>
                          {u.status ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">Blocked</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="font-semibold">{sessions}</div>
                          <div className="text-xs text-slate-500">sessions</div>
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!!loadingMap[u.id]}
                            className={u.status ? "text-red-600" : "text-emerald-600"}
                            onClick={() => toggleBlock(u)}
                          >
                            {loadingMap[u.id] ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <UserX className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {u.status ? "Block" : "Unblock"}
                          </Button>
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

/* ===== Small KPI Card ===== */
function Kpi({
  title,
  value,
  icon,
  tone = "slate",
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  tone?: "slate" | "emerald" | "red";
}) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  } as const;

  return (
    <Card className="border-0 shadow-md rounded-2xl">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl grid place-items-center ${toneMap[tone]}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}
