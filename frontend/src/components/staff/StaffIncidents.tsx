// src/pages/staff/StaffIncidents.tsx
import { useEffect, useMemo, useState } from "react";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";

/* =========================
   Types
========================= */
type PillarSimple = { id: number; name: string };
type StationDto = {
  id: number;
  name: string;
  address?: string;
  pillars: PillarSimple[];
};

type IncidentItem = {
  id: number;
  title: string;
  description?: string;
  priority: string; // LOW | MEDIUM | HIGH | CRITICAL (BE sending any-case strings)
  status: string; // Open/In Progress/Resolved...
  stationId: number;
  stationName: string;
  pillarId?: number | null;
  reportedBy?: string;
  reportedById?: number;
  reportedTime?: string;
};

/* =========================
   Helpers
========================= */
const PriorityBadge = ({ p }: { p?: string }) => {
  const x = String(p || "").toUpperCase();
  const map: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700 border-slate-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    HIGH: "bg-red-100 text-red-700 border-red-200",
    CRITICAL: "bg-red-200 text-red-800 border-red-300",
  };
  // Trả về Badge với class tương ứng theo mức ưu tiên.
  // Nếu không có trong map thì dùng màu xám mặc định.
  // Nội dung hiển thị là x, nếu x rỗng thì hiển thị "LOW"
  return <Badge className={map[x] || "bg-slate-100 text-slate-700 border-slate-200"}>{x || "LOW"}</Badge>;
};

const StatusBadge = ({ s }: { s?: string }) => {
  const x = String(s || "").toUpperCase();
  const map: Record<string, string> = {
    OPEN: "bg-rose-100 text-rose-700 border-rose-200",
    "IN PROGRESS": "bg-amber-100 text-amber-700 border-amber-200",
    RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return <Badge className={map[x] || "bg-slate-100 text-slate-700 border-slate-200"}>{x || "OPEN"}</Badge>;
};
// Trả về component Badge với class tương ứng
// Nếu trạng thái không nằm trong map thì dùng set màu xám (mặc định)
// Nội dung hiển thị là trạng thái x, nếu x rỗng thì hiển thị "OPEN"
const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

/* =========================
   Component
========================= */
const StaffIncidents = () => {
  const { toast } = useToast();

  // layout header actions (refresh + report)
  const [refreshing, setRefreshing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // data
  const [stations, setStations] = useState<StationDto[]>([]);
  const [pillarsByStation, setPillarsByStation] = useState<Record<number, PillarSimple[]>>({});
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);

  // ui/filter
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [filterStationId, setFilterStationId] = useState<string>("");

  // report form
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({
    stationId: "",
    pillarId: "",
    title: "",
    priority: "",
    description: "",
  });

  const currentPillars: PillarSimple[] = useMemo(() => {
    const sid = Number(form.stationId || filterStationId);
    return pillarsByStation[sid] || [];
  }, [form.stationId, filterStationId, pillarsByStation]);

  /* =========================
     Load stations assigned & incidents
  ========================= */
  const loadStationsAndDefault = async (signal?: AbortSignal) => {
    // /auth/me to get userId
    const meRes = await api.get<any>("/auth/me", { withCredentials: true, signal });
    const me = meRes.data;
    let userId = me?.user_id ?? me?.id ?? me?.userId ?? Number(localStorage.getItem("userId"));
    if (!userId) throw new Error("Không tìm thấy userId từ /auth/me");

    // /station-managers/{userId}
    const stRes = await api.get<any>(`/station-managers/${userId}`, { withCredentials: true, signal });
    const payload = stRes.data;

    const mapStations = new Map<number, StationDto>();
    const mapPillars: Record<number, PillarSimple[]> = {};

    const normalizeOne = (raw: any) => {
      // lấy dữ liệu station từ nhiều kiểu cấu trúc khác nhau
      const node = raw?.station ?? raw?.stationDto ?? raw ?? {};
      const id = Number(node.id ?? node.stationId ?? node.station_id);
      if (!id) return;
      const pillarsRaw = Array.isArray(node.pillars)
        ? node.pillars
        : Array.isArray(node.pillarDtos)
        ? node.pillarDtos
        : [];
      const pillars: PillarSimple[] = pillarsRaw.map((p: any) => ({
        id: Number(p.id ?? p.pillarId ?? 0),
        name: p.code ?? p.name ?? `P${p.id ?? ""}`,
      }));
      // lưu station đã chuẩn hóa vào mapStations
      mapStations.set(id, {
        id,
        name: node.name ?? node.stationName ?? `Station ${id}`,
        address: node.address ?? "",
        pillars,
      });
      // lưu pillars theo stationId
      mapPillars[id] = pillars;
    };

    if (Array.isArray(payload)) payload.forEach(normalizeOne);
    else if (payload?.stations || payload?.data || payload?.items) {
      (payload.stations ?? payload.data ?? payload.items).forEach(normalizeOne);
    } else normalizeOne(payload);

    const list = Array.from(mapStations.values());
    setStations(list);
    setPillarsByStation(mapPillars);

    const firstId = list[0]?.id ? String(list[0].id) : "";
    setFilterStationId((prev) => prev || firstId);
    setForm((f) => ({ ...f, stationId: f.stationId || firstId, pillarId: "" }));
  };

  const loadIncidents = async (signal?: AbortSignal) => {
    // /incidents/getAll (BE already returns list)
    const res = await api.get<any>("/incidents/getAll", { withCredentials: true, signal });
    const data = res.data?.data ?? res.data ?? [];
    const items: IncidentItem[] = Array.isArray(data) ? data : [];
    setIncidents(items);
  };

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        await loadStationsAndDefault(controller.signal);
        await loadIncidents(controller.signal);
      } catch (e: any) {
        if (e?.code !== "ERR_CANCELED") {
          setErrMsg(e?.message || "Failed to load incidents.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tải lại danh sách incidents, hiển thị trạng thái loading, thông báo toast khi thành công,
  // và hiện toast lỗi nếu có trừ trường hợp request bị hủy (ERR_CANCELED)
  const handleRefresh = async () => {
    const controller = new AbortController();
    try {
      setRefreshing(true);
      await loadIncidents(controller.signal);
      toast({ title: "Refreshed" });
    } catch (e: any) {
      if (e?.code !== "ERR_CANCELED") {
        toast({ title: "Refresh failed", description: e?.message || "Cannot refresh.", variant: "destructive" });
      }
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================
     Submit incident
  ========================= */
  const handleSubmit = async () => {
    const { stationId, pillarId, title, priority, description } = form;
    if (!stationId || !title.trim() || !priority) {
      toast({
        title: "Thiếu thông tin",
        description: "Cần Station, Title và Priority.",
        variant: "destructive",
      });
      return;
    }

    // who reports?
    let reportedById: number | undefined = undefined;
    try {
      const meRes = await api.get<any>("/auth/me", { withCredentials: true });
      reportedById = meRes.data?.user_id ?? meRes.data?.id ?? undefined;
    } catch {
      // ignore
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority: String(priority).toUpperCase(),
      stationId: Number(stationId),
      pillarId: pillarId ? Number(pillarId) : null,
      reportedById: reportedById ?? null,
    };

    try {
      setSubmitLoading(true);
      await api.post("/incidents", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      toast({ title: "Incident reported" });
      setReportOpen(false);
      setForm({ stationId: stationId, pillarId: "", title: "", priority: "", description: "" });
      await handleRefresh();
    } catch (e: any) {
      toast({
        title: "Submit failed",
        description: e?.response?.data?.message || e?.message || "Cannot submit incident.",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  /* =========================
     Derived stats (by filter)
  ========================= */
  const filtered = useMemo(() => {
    const sid = Number(filterStationId);
    return sid ? incidents.filter((i) => i.stationId === sid) : incidents;
  }, [incidents, filterStationId]);

  const stats = useMemo(() => {
    let open = 0,
      progress = 0,
      resolved = 0,
      critical = 0;
    for (const i of filtered) {
      const s = String(i.status || "").toUpperCase();
      if (s === "OPEN") open++;
      else if (s === "IN PROGRESS") progress++;
      else if (s === "RESOLVED") resolved++;
      if (String(i.priority || "").toUpperCase() === "CRITICAL") critical++;
    }
    return { open, progress, resolved, critical, total: filtered.length };
  }, [filtered]);

  /* =========================
     Actions node for header
  ========================= */
  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
        Refresh
      </Button>

      <Dialog open={reportOpen} onOpenChange={(o) => setReportOpen(o)}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Station */}
            <div className="space-y-2">
              <Label>Station</Label>
              <Select
                value={form.stationId}
                onValueChange={(v) => setForm((f) => ({ ...f, stationId: v, pillarId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.length === 0 ? (
                    <SelectItem value="__no_station__" disabled>
                      No stations assigned
                    </SelectItem>
                  ) : (
                    stations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Pillar */}
            <div className="space-y-2">
              <Label>Pillar</Label>
              <Select
                disabled={!form.stationId || currentPillars.length === 0}
                value={form.pillarId}
                onValueChange={(v) => setForm((f) => ({ ...f, pillarId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!form.stationId ? "Select station first" : "Select pillar"} />
                </SelectTrigger>
                <SelectContent>
                  {!form.stationId ? (
                    <SelectItem value="__pick_station__" disabled>
                      Select station first
                    </SelectItem>
                  ) : currentPillars.length === 0 ? (
                    <SelectItem value="__no_pillar__" disabled>
                      No pillars
                    </SelectItem>
                  ) : (
                    currentPillars.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Issue Title</Label>
              <Input
                placeholder="Brief description of the issue"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Detailed description of the issue…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)} disabled={submitLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {submitLoading ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* =========================
     Render
  ========================= */
  if (loading) {
    return (
      <StaffLayout title="Incident Reporting" actions={actions}>
        <div className="p-6 text-sm text-muted-foreground flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading incidents…
        </div>
      </StaffLayout>
    );
  }

  if (errMsg) {
    return (
      <StaffLayout title="Incident Reporting" actions={actions}>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-red-700 flex items-center">
              <TriangleAlert className="w-4 h-4 mr-2" />
              {errMsg}
            </CardContent>
          </Card>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Incident Reporting" actions={actions}>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">Filter</span>
        </div>
        <Select value={filterStationId} onValueChange={setFilterStationId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select station" />
          </SelectTrigger>
          <SelectContent>
            {stations.length === 0 ? (
              <SelectItem value="__no_station__" disabled>
                No stations assigned
              </SelectItem>
            ) : (
              stations.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-rose-50 to-rose-100/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-700/80">Open Incidents</p>
                <p className="text-2xl font-bold text-rose-600">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-rose-200/60 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700/80">In Progress</p>
                <p className="text-2xl font-bold text-amber-600">{stats.progress}</p>
              </div>
              <div className="w-12 h-12 bg-amber-200/60 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700/80">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-200/60 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-red-50 to-red-100/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700/80">Critical Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="w-12 h-12 bg-red-200/60 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-card border border-white/60 bg-white/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
            Recent Incidents ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No incidents found for this station.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">ID</th>
                    <th className="text-left py-2 pr-3">Title</th>
                    <th className="text-left py-2 pr-3">Priority</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2 pr-3">Pillar</th>
                    <th className="text-left py-2 pr-3">Reported By</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-slate-50/70">
                      <td className="py-2 pr-3 font-medium text-slate-900">#{i.id}</td>
                      <td className="py-2 pr-3">{i.title}</td>
                      <td className="py-2 pr-3"><PriorityBadge p={i.priority} /></td>
                      <td className="py-2 pr-3"><StatusBadge s={i.status} /></td>
                      <td className="py-2 pr-3">{i.pillarId ? `P${i.pillarId}` : "—"}</td>
                      <td className="py-2 pr-3">{i.reportedBy || "—"}</td>
                      <td className="py-2">{fmt(i.reportedTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </StaffLayout>
  );
};

export default StaffIncidents;
