// src/components/admin/AdminSubscriptions.tsx
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
import {
  Label
} from "../../components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "../../components/ui/select";
import {
  Search, Plus, Edit, Trash2, DollarSign, Package, Loader2,
} from "lucide-react";

type Plan = {
  planId: number;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly" | string;
  includedKwh: number;
  description?: string | null;
  discountRate?: number;
  freeBooking?: boolean;
  createdAt?: string;
};

const AdminSubscriptions = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");

  // Create modal
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Plan>>({
    name: "",
    price: 0,
    billingCycle: "monthly",
    includedKwh: 0,
    description: "",
  });

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ code: string; message: string; data: Plan[] }>(
        "/subs-plan",
        { withCredentials: true }
      );
      setPlans(res.data?.data ?? []);
    } catch (e: any) {
      toast({
        title: "Load plans failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [plans, search]);

  const onCreate = async () => {
    if (!form.name || !form.price || !form.billingCycle || !form.includedKwh) {
      toast({ title: "Missing fields", description: "Vui lòng điền đầy đủ.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        billingCycle: String(form.billingCycle).toLowerCase(),
        includedKwh: Number(form.includedKwh),
        description: form.description ?? "",
      };
      const res = await api.post("/subs-plan", payload, { withCredentials: true });
      toast({ title: "Created", description: "Subscription plan created." });
      setOpenCreate(false);
      setForm({ name: "", price: 0, billingCycle: "monthly", includedKwh: 0, description: "" });
      // refresh
      await loadPlans();
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

  const onDelete = async (plan: Plan) => {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      await api.delete(`/subs-plan/${plan.planId}`, { withCredentials: true });
      toast({ title: "Deleted", description: "Subscription plan deleted." });
      setPlans((prev) => prev.filter((p) => p.planId !== plan.planId));
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    }
  };

  const actions = (
    <>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-72"
        />
      </div>

      <Button onClick={() => setOpenCreate(true)} className="bg-success text-success-foreground hover:bg-success/90">
        <Plus className="w-4 h-4 mr-2" />
        Create Package
      </Button>
    </>
  );

  return (
    <AdminLayout title="Subscription Management" actions={actions}>
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Packages</p>
                <p className="text-2xl font-bold text-primary">{plans.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-warning">
                  {/* Không có API tổng doanh thu, hiển thị “—” để trung thực */}
                  — 
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Packages</p>
                <p className="text-2xl font-bold text-secondary">
                  {plans.length /* hiện tại BE chưa có cờ active/inactive */}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Badge className="bg-secondary/10 text-secondary border-secondary/20">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-3 text-primary" />
            Subscription Packages ({filtered.length} packages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Package Details</TableHead>
                  <TableHead className="font-semibold">Pricing</TableHead>
                  <TableHead className="font-semibold">Included kWh</TableHead>
                  <TableHead className="font-semibold">Billing</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.map((p) => (
                  <TableRow key={p.planId} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.description && (
                          <div className="text-sm text-muted-foreground">{p.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground">ID: {p.planId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg text-primary">
                        {p.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{p.includedKwh} kWh</TableCell>
                    <TableCell className="capitalize">{p.billingCycle}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button disabled variant="outline" size="sm" className="opacity-50 cursor-not-allowed">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => onDelete(p)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !filtered.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No packages.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create subscription plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Name</Label>
              <Input
                className="col-span-3"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Price (USD)</Label>
              <Input
                type="number"
                className="col-span-3"
                value={String(form.price ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Billing</Label>
              <div className="col-span-3">
                <Select
                  value={(form.billingCycle as string) ?? "monthly"}
                  onValueChange={(v) => setForm((f) => ({ ...f, billingCycle: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="monthly/yearly" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">monthly</SelectItem>
                    <SelectItem value="yearly">yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Included kWh</Label>
              <Input
                type="number"
                className="col-span-3"
                value={String(form.includedKwh ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, includedKwh: Number(e.target.value) }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Description</Label>
              <Input
                className="col-span-3"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={onCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
