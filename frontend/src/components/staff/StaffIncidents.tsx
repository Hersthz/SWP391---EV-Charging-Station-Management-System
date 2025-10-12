// src/pages/staff/StaffIncidents.tsx
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  Zap,
  AlertCircle,
  Eye
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";

type StationDto = {
  id: number;
  name: string;
  address?: string;
  pillars?: Array<{ id: number; code?: string; name?: string }>;
};

const StaffIncidents = () => {
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // dynamic stations/pillars loaded from backend
  const [stations, setStations] = useState<StationDto[]>([]);
  const [pillarsByStation, setPillarsByStation] = useState<Record<number, { id: number; name: string }[]>>({});

  // form state
  const [form, setForm] = useState({
    stationId: "",   // store as string for Select value
    pillarId: "",
    title: "",
    priority: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingStations, setLoadingStations] = useState(true);

  // demo incidents (UI-only)
  const incidents = [
    { id: "#INC-001", title: "Connector Not Releasing", station: "Downtown Station #1", connector: "Connector A2", priority: "High", status: "In Progress", reportedBy: "John Anderson", reportedTime: "2024-01-15 14:30", description: "…", estimatedFix: "30 min" },
    { id: "#INC-002", title: "Display Screen Flickering", station: "Mall Station #2", connector: null, priority: "Medium", status: "Open", reportedBy: "Sarah Chen", reportedTime: "2024-01-15 13:45", description: "…", estimatedFix: "2 hours" },
    { id: "#INC-003", title: "Routine Maintenance Due", station: "Airport Station #3", connector: "Connector C1", priority: "Low", status: "Open", reportedBy: "Mike Rodriguez", reportedTime: "2024-01-15 12:20", description: "…", estimatedFix: "1 hour" },
  ];

  // fetch stations managed by current user and build pillars map
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingStations(true);
        // get current user id from /auth/me
        const meRes = await api.get<any>("/auth/me", { withCredentials: true, signal: controller.signal });
        const me = meRes.data;
        console.log("DEBUG /auth/me (StaffIncidents):", me);

        const userId = me.user_id ?? me.id ?? me.userId;
        if (!userId) {
          // fallback: try localStorage
          const fromStorage = Number(localStorage.getItem("userId"));
          if (fromStorage) {
            // use it
          } else {
            toast({ title: "Không xác định user", description: "Không thể lấy userId để tải trạm.", variant: "destructive" });
            setLoadingStations(false);
            return;
          }
        }

        const uid = userId ?? Number(localStorage.getItem("userId"));

        // call station-managers endpoint
        const res = await api.get<any[]>(`/station-managers/${uid}`, { withCredentials: true, signal: controller.signal });
        const list = res.data ?? [];
        console.log("DEBUG /station-managers result:", list);

        // extract stations and pillars
        const stationsMap = new Map<number, StationDto>();
        const pillarsMap: Record<number, { id: number; name: string }[]> = {};

        for (const sm of list) {
          const st = sm.station ?? sm; // backend might return station nested under 'station'
          if (!st || !st.id) continue;
          // normalise station dto
          const stationDto: StationDto = {
            id: st.id,
            name: st.name ?? st.stationName ?? "Unnamed",
            address: st.address ?? "",
            pillars: Array.isArray(st.pillars) ? st.pillars.map((p: any) => ({ id: p.id, code: p.code, name: p.name })) : [],
          };
          stationsMap.set(stationDto.id, stationDto);
          pillarsMap[stationDto.id] = stationDto.pillars?.map((p) => ({ id: p.id, name: p.code ?? p.name ?? String(p.id) })) ?? [];
        }

        const stationsList = Array.from(stationsMap.values());
        setStations(stationsList);
        setPillarsByStation(pillarsMap);

        // default select first station if any
        if (stationsList.length > 0) {
          setForm((f) => ({ ...f, stationId: String(stationsList[0].id), pillarId: "" }));
        }
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
          return;
        }
        console.error("StaffIncidents load error:", err);
        toast({ title: "Lỗi tải trạm", description: err?.message || "Không thể tải trạm được.", variant: "destructive" });
      } finally {
        setLoadingStations(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReportIncident = async () => {
    const { stationId, pillarId, title, priority, description } = form;

    if (!stationId || !pillarId || !title || !priority || !description) {
      toast({ title: "Missing information", description: "Please fill in Station, Pillar, Title, Priority and Description.", variant: "destructive" });
      return;
    }

    // reportedById: lấy từ /auth/me cache hoặc localStorage
    let reportedById: number | undefined;
    try {
      const meRes = await api.get<any>("/auth/me", { withCredentials: true });
      reportedById = meRes.data.user_id ?? meRes.data.id ?? undefined;
    } catch {
      const fromStorage = Number(localStorage.getItem("userId"));
      if (fromStorage) reportedById = fromStorage;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority: String(priority).toUpperCase(),
      stationId: Number(stationId),
      pillarId: Number(pillarId),
      reportedById: reportedById ?? null
    };

    try {
      setSubmitting(true);
      await api.post("/incidents", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      toast({ title: "Incident Reported", description: "Your incident report has been submitted successfully." });
      setForm({ stationId: "", pillarId: "", title: "", priority: "", description: "" });
      setIsReportDialogOpen(false);
      // TODO: refetch incidents list if connected to backend
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to submit incident.";
      toast({ title: "Submit failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      High: { className: "bg-destructive/10 text-destructive border-destructive/20" },
      Medium: { className: "bg-warning/10 text-warning border-warning/20" },
      Low: { className: "bg-muted/10 text-muted-foreground border-muted/20" }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { className: "bg-muted/10 text-muted-foreground border-muted/20" };
    return <Badge className={config.className}>{priority}</Badge>;
  };

  const incidentActions = (
    <>
      <Dialog
        open={isReportDialogOpen}
        onOpenChange={(open) => {
          setIsReportDialogOpen(open);
          if (!open) setForm({ stationId: "", pillarId: "", title: "", priority: "", description: "" });
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        </DialogTrigger>

        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => submitting && e.preventDefault()}
          onEscapeKeyDown={(e) => submitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Station */}
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <Select
                value={form.stationId}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, stationId: v, pillarId: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingStations ? "Loading stations…" : "Select station"} />
                </SelectTrigger>
                <SelectContent>
                  {stations.length === 0 ? (
                    <SelectItem value="">No stations assigned</SelectItem>
                  ) : (
                    stations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Pillar */}
            <div className="space-y-2">
              <Label htmlFor="pillar">Pillar</Label>
              <Select
                disabled={!form.stationId}
                value={form.pillarId}
                onValueChange={(v) => setForm((f) => ({ ...f, pillarId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!form.stationId ? "Select station first" : "Select pillar"} />
                </SelectTrigger>
                <SelectContent>
                  {(pillarsByStation[Number(form.stationId)] || []).length === 0 ? (
                    <SelectItem value="">No pillars</SelectItem>
                  ) : (
                    (pillarsByStation[Number(form.stationId)] || []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleReportIncident} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <StaffLayout title="Incident Reporting" actions={incidentActions}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-warning">1</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-destructive">1</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-success">1</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <AlertTriangle className="w-5 h-5 mr-3 text-primary" />
            Recent Incidents ({incidents.length} issues)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Issues and maintenance requests for your assigned stations</p>
        </CardHeader>
        <CardContent>
          {/* giữ bảng demo như trước (nếu muốn có list thực tế thì refetch từ BE) */}
        </CardContent>
      </Card>
    </StaffLayout>
  );
};

export default StaffIncidents;
