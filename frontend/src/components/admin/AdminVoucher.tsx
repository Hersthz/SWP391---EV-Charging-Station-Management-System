// src/components/admin/AdminVoucher.tsx
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { useToast } from "../../hooks/use-toast";

import {
  Card, CardContent, CardHeader, CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "../../components/ui/select";

import {
  Search, Plus, Edit, Trash2, TicketPercent, CalendarDays, Gift, Loader2, AlertTriangle,
} from "lucide-react";

/** ================= Types ================= */
type Voucher = {
  id: number;
  code: string;
  discountAmount: number;   
  requiredPoints: number;
  description?: string | null;
  startDate?: string | null; // "yyyy-MM-dd"
  endDate?: string | null;   // "yyyy-MM-dd"
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | string;
};
type ApiResp<T> = { code: string; message: string; data: T };

/** =============== Helpers =============== */
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
const todayISO = () => new Date().toISOString().slice(0, 10);

// Chuẩn hoá mọi khả năng key trả về từ BE → về shape Voucher chuẩn (đặc biệt là id)
const mapVoucher = (x: any): Voucher => ({
  id: x?.id ?? x?.voucherId ?? x?.voucherID ?? x?.VoucherId ?? 0,
  code: x?.code ?? x?.voucherCode ?? "",
  discountAmount: x?.discountAmount ?? x?.discount ?? 0,
  requiredPoints: x?.requiredPoints ?? x?.points ?? 0,
  description: x?.description ?? null,
  startDate: x?.startDate ?? x?.start_date ?? null,
  endDate: x?.endDate ?? x?.end_date ?? null,
  status: x?.status ?? "ACTIVE",
});

const sanitizeForSave = (v: Partial<Voucher>) => ({
  code: (v.code ?? "").trim(),
  discountAmount: Number(v.discountAmount ?? 0),
  requiredPoints: Number(v.requiredPoints ?? 0),
  description: v.description ?? "",
  startDate: v.startDate || null,
  endDate: v.endDate || null,
  status: (v.status as string) || "ACTIVE",
});

/** =============== Component =============== */
const AdminVoucher = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [search, setSearch] = useState("");

  // Create modal state
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Voucher>>({
    code: "",
    discountAmount: 0,
    requiredPoints: 0,
    startDate: "",
    endDate: "",
    status: "ACTIVE",
    description: "",
  });

  // Edit dialog state
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  /** Load list */
  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResp<any[]>>("/api/vouchers", { withCredentials: true });
      const raw = res.data?.data ?? [];
      setVouchers(raw.map(mapVoucher)); // luôn chuẩn hoá dữ liệu
    } catch (e: any) {
      toast({
        title: "Load vouchers failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  /** Filter & summary */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vouchers;
    return vouchers.filter((v) =>
      v.code.toLowerCase().includes(q) ||
      (v.description ?? "").toLowerCase().includes(q) ||
      String(v.requiredPoints).includes(q)
    );
  }, [vouchers, search]);

  const { total, active, expired } = useMemo(() => {
    const t = vouchers.length;
    let a = 0;
    let e = 0;
    const today = todayISO();
    vouchers.forEach((v) => {
      if (String(v.status).toUpperCase() === "EXPIRED" || (!!v.endDate && v.endDate < today)) {
        e++; return;
      }
      if (String(v.status).toUpperCase() === "ACTIVE") a++;
    });
    return { total: t, active: a, expired: e };
  }, [vouchers]);

  /** Create */
  const onCreate = async () => {
    const payload = sanitizeForSave(form);

    if (!payload.code) {
      toast({ title: "Missing code", description: "Code is required.", variant: "destructive" });
      return;
    }
    

    setCreating(true);
    try {
      await api.post<ApiResp<Voucher>>("/api/vouchers", payload, { withCredentials: true });
      toast({ title: "Created", description: "Voucher created successfully." });
      setOpenCreate(false);
      setForm({ code: "", discountAmount: 0, requiredPoints: 0, startDate: "", endDate: "", description: "", status: "ACTIVE" });
      await loadVouchers();
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  /** Delete */
  const onDelete = async (v: Voucher) => {
    if (!confirm(`Delete voucher "${v.code}"?`)) return;
    try {
      await api.delete<ApiResp<void>>(`/api/vouchers/${v.id}`, { withCredentials: true });
      toast({ title: "Deleted", description: "Voucher deleted." });
      setVouchers((prev) => prev.filter((x) => x.id !== v.id));
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    }
  };

  /** Save edit */
  const onSaveEdit = async () => {
    if (!editing) return;

    // CHỐT: Không cho phép gọi PUT nếu id thiếu/invalid
    if (!editing.id || Number.isNaN(Number(editing.id))) {
      console.error("Editing object missing id:", editing);
      toast({ title: "Update failed", description: "Thiếu ID voucher (FE chưa map đúng).", variant: "destructive" });
      return;
    }

    const payload = sanitizeForSave(editing);
    if (!payload.code) {
      toast({ title: "Missing code", description: "Code is required.", variant: "destructive" });
      return;
    }

    setSavingEdit(true);
    try {
      await api.put<ApiResp<Voucher>>(`/api/vouchers/${editing.id}`, payload, { withCredentials: true });
      toast({ title: "Updated", description: "Voucher updated successfully." });
      setEditing(null);
      await loadVouchers();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  /** Header actions */
  const actions = (
    <>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search vouchers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-72"
        />
      </div>
      <Button onClick={() => setOpenCreate(true)} className="bg-success text-success-foreground hover:bg-success/90">
        <Plus className="w-4 h-4 mr-2" />
        Create Voucher
      </Button>
    </>
  );

  /** Render */
  return (
    <AdminLayout title="Voucher Management" actions={actions}>
      {/* ===== Summary cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vouchers</p>
                <p className="text-3xl font-extrabold text-primary">{total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TicketPercent className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-emerald-100/40 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-extrabold text-emerald-600">{active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-amber-100/40 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-3xl font-extrabold text-amber-600">{expired}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== List table ===== */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <TicketPercent className="w-5 h-5 mr-3 text-primary" />
            Voucher List ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Discount</TableHead>
                  <TableHead className="font-semibold">Required Points</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                      Loading…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && filtered.map((v) => {
                  const now = todayISO();
                  const isExpired = String(v.status).toUpperCase() === "EXPIRED" || (!!v.endDate && v.endDate < now);
                  const statusColor =
                    isExpired ? "bg-amber-100 text-amber-700 border-amber-200"
                    : String(v.status).toUpperCase() === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                  const mapped = mapVoucher(v); // đảm bảo chắc chắn có id khi mở Edit

                  return (
                    <TableRow key={v.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">{v.code}</TableCell>
                      <TableCell>{v.discountAmount}đ</TableCell>
                      <TableCell>{v.requiredPoints}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColor} border`}>{String(v.status).toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="truncate text-sm">{v.description ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(mapped)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => onDelete(v)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && !filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No vouchers.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Create Dialog ===== */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create voucher</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount đ</Label>
                <Input
                  type="number"
                  value={String(form.discountAmount ?? 0)}
                  onChange={(e) => setForm((f) => ({ ...f, discountAmount: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Required points</Label>
                <Input
                  type="number"
                  value={String(form.requiredPoints ?? 0)}
                  onChange={(e) => setForm((f) => ({ ...f, requiredPoints: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={(form.status as string) ?? "ACTIVE"}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Input
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center text-amber-600 gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Ensure code is unique.
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
                <Button onClick={onCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Dialog ===== */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit voucher</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="mt-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={editing.code ?? ""}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount đ</Label>
                  <Input
                    type="number"
                    value={String(editing.discountAmount ?? 0)}
                    onChange={(e) => setEditing({ ...editing, discountAmount: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required points</Label>
                  <Input
                    type="number"
                    value={String(editing.requiredPoints ?? 0)}
                    onChange={(e) => setEditing({ ...editing, requiredPoints: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={(editing.status as string) ?? "ACTIVE"}
                    onValueChange={(v) => setEditing({ ...editing, status: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={editing.startDate ?? ""}
                    onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={editing.endDate ?? ""}
                    onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center text-amber-600 gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Keep a reasonable date range.
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={onSaveEdit} disabled={savingEdit}>
                    {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVoucher;
