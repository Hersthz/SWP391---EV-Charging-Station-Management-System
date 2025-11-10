// src/pages/admin/AdminKyc.tsx
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  CheckCircle2, XCircle, ShieldCheck, Eye, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

type UserLite = { id: number; fullName?: string; email?: string; phone?: string };
type KycSubmission = {
  id: number;
  user: UserLite;
  frontImageUrl: string;
  backImageUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
type PageResp<T> = {
  code?: string; message?: string;
  data: { content: T[]; totalElements: number; totalPages: number; number: number; size: number; };
};

const fmt = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StatusBadge = ({ s }: { s: KycSubmission["status"] }) => {
  if (s === "APPROVED")
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">APPROVED</Badge>;
  if (s === "REJECTED")
    return <Badge className="bg-red-100 text-red-700 border-red-200">REJECTED</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200">PENDING</Badge>;
};

export default function AdminKyc() {
  const { toast } = useToast();

  // server paging
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // local filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");

  // dialogs
  const [imgOpen, setImgOpen] = useState<null | { url: string; label: string }>(null);
  const [actionOpen, setActionOpen] = useState<null | { row: KycSubmission; mode: "approve" | "reject" }>(null);
  const [reason, setReason] = useState("");

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await api.get<PageResp<KycSubmission>>("/kyc/get-all", {
        params: { page, size },
        withCredentials: true,
      });
      const data = res.data?.data;
      setRows(data?.content ?? []);
      setTotal(data?.totalElements ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e: any) {
      toast({
        title: "Load KYC failed",
        description: e?.response?.data?.message || e?.message || "Không tải được danh sách.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(); /* eslint-disable-next-line */ }, [page, size]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter(r => {
      const okStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && r.status === "PENDING") ||
        (statusFilter === "approved" && r.status === "APPROVED") ||
        (statusFilter === "rejected" && r.status === "REJECTED");
      const okKw =
        !kw ||
        r.user?.fullName?.toLowerCase().includes(kw) ||
        r.user?.email?.toLowerCase().includes(kw) ||
        String(r.user?.id ?? "").includes(kw);
      return okStatus && okKw;
    });
  }, [rows, statusFilter, search]);

  const approveOrReject = async () => {
    if (!actionOpen) return;
    const { row, mode } = actionOpen;
    if (mode === "reject" && !reason.trim()) {
      toast({ title: "Thiếu lý do", description: "Vui lòng nhập lý do từ chối.", variant: "destructive" });
      return;
    }
    try {
      const status = mode === "approve" ? "APPROVED" : "REJECTED";
      await api.post(`/kyc/${row.id}`, null, {
        params: { status, reason: mode === "approve" ? "" : reason.trim() },
        withCredentials: true,
      });
      toast({ title: mode === "approve" ? "Approved" : "Rejected" });
      setActionOpen(null);
      setReason("");
      // refresh current page
      fetchPage();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
    }
  };

  /* ===== Header actions ===== */
  const header = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Input
          placeholder="Search by name/email/userId…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[280px] rounded-full bg-slate-100 border-0 pl-4"
        />
      </div>
      <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
        <SelectTrigger className="w-44 rounded-full bg-slate-100 border-0">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <Select value={String(size)} onValueChange={(v) => { setPage(0); setSize(Number(v)); }}>
        <SelectTrigger className="w-28 rounded-full bg-slate-100 border-0">
          <SelectValue placeholder="Page size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 / page</SelectItem>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={() => fetchPage()}>Refresh</Button>
    </div>
  );

  /* ===== KPIs ===== */
  const kpi = (() => {
    const p = rows.filter(r => r.status === "PENDING").length;
    const a = rows.filter(r => r.status === "APPROVED").length;
    const r = rows.filter(r => r.status === "REJECTED").length;
    return { p, a, r };
  })();

  return (
    <AdminLayout title="KYC Verification" actions={header}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending (this page)</p>
              <p className="text-3xl font-extrabold text-amber-600">{kpi.p}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Approved (this page)</p>
              <p className="text-3xl font-extrabold text-emerald-600">{kpi.a}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rejected (this page)</p>
              <p className="text-3xl font-extrabold text-rose-600">{kpi.r}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-72 gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="overflow-x-auto p-6 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Front</TableHead>
                      <TableHead>Back</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted / Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const isPending = r.status === "PENDING";
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold">{r.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{r.user?.fullName || "-"}</div>
                            <div className="text-xs text-slate-500">{r.user?.email || "-"}</div>
                            <div className="text-xs text-slate-500">UID: {r.user?.id ?? "-"}</div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="text-sky-600"
                              onClick={() => setImgOpen({ url: r.frontImageUrl, label: "Front side" })}
                            >
                              <ImageIcon className="w-4 h-4 mr-1.5" /> View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="text-sky-600"
                              onClick={() => setImgOpen({ url: r.backImageUrl, label: "Back side" })}
                            >
                              <ImageIcon className="w-4 h-4 mr-1.5" /> View
                            </Button>
                          </TableCell>
                          <TableCell><StatusBadge s={r.status} /></TableCell>
                          <TableCell>
                            <div className="text-sm">{fmt(r.createdAt)}</div>
                            <div className="text-xs text-slate-500">Upd: {fmt(r.updatedAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* Only show actions when status is PENDING */}
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-600"
                                    onClick={() => setActionOpen({ row: r, mode: "approve" })}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-600"
                                    onClick={() => setActionOpen({ row: r, mode: "reject" })}
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-slate-500 py-10">
                          No submissions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-white rounded-b-2xl">
                <div className="text-sm text-slate-600">
                  Total: <span className="font-semibold">{total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <div className="text-sm">
                    Page <span className="font-semibold">{page + 1}</span> / {Math.max(1, totalPages)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image viewer dialog */}
      <Dialog open={!!imgOpen} onOpenChange={(o) => !o && setImgOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imgOpen?.label}</DialogTitle>
          </DialogHeader>
          {imgOpen && (
            <div className="w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgOpen.url} alt={imgOpen.label} className="w-full rounded-lg border" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject dialog */}
      <Dialog open={!!actionOpen} onOpenChange={(o) => { if (!o) { setActionOpen(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {actionOpen?.mode === "approve" ? "Approve KYC" : "Reject KYC"}
            </DialogTitle>
          </DialogHeader>

          {actionOpen && (
            <div className="space-y-4">
              <div className="text-sm">
                <div className="font-semibold">{actionOpen.row.user?.fullName || "-"}</div>
                <div className="text-slate-500">{actionOpen.row.user?.email || "-"}</div>
              </div>

              {actionOpen.mode === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    rows={3}
                    placeholder="Nhập lý do từ chối…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setActionOpen(null); setReason(""); }}>
                  Cancel
                </Button>
                <Button
                  className={actionOpen.mode === "approve" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}
                  onClick={approveOrReject}
                >
                  {actionOpen.mode === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
