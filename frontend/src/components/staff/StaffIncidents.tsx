import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from  "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
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
import api from "../../api/axios"; // (đã có)

const StaffIncidents = () => {
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // NEW: demo data (thay bằng API thật nếu có)
  const stations = [
    { id: 1, name: "Downtown Station #1" },
    { id: 2, name: "Mall Station #2" },
    { id: 3, name: "Airport Station #3" },
  ];
  // NEW: pillars theo station (demo)
  const pillarsByStation: Record<number, { id: number; name: string }[]> = {
    1: [{ id: 101, name: "Pillar A1" }, { id: 102, name: "Pillar A2" }],
    2: [{ id: 201, name: "Pillar B1" }, { id: 202, name: "Pillar B2" }],
    3: [{ id: 301, name: "Pillar C1" }],
  };

  // CHANGED: form tách stationId & pillarId, title, description, priority, reportedById
  const [form, setForm] = useState({
    stationId: "",   // NEW
    pillarId: "",
    title: "",
    priority: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const incidents = [
    { id: "#INC-001", title: "Connector Not Releasing", station: "Downtown Station #1", connector: "Connector A2", priority: "High", status: "In Progress", reportedBy: "John Anderson", reportedTime: "2024-01-15 14:30", description: "…", estimatedFix: "30 min" },
    { id: "#INC-002", title: "Display Screen Flickering", station: "Mall Station #2", connector: null, priority: "Medium", status: "Open", reportedBy: "Sarah Chen", reportedTime: "2024-01-15 13:45", description: "…", estimatedFix: "2 hours" },
    { id: "#INC-003", title: "Routine Maintenance Due", station: "Airport Station #3", connector: "Connector C1", priority: "Low", status: "Open", reportedBy: "Mike Rodriguez", reportedTime: "2024-01-15 12:20", description: "…", estimatedFix: "1 hour" },
  ];

  // CHANGED: submit gửi đủ 6 field mà backend yêu cầu
  const handleReportIncident = async () => {
    const { stationId, pillarId, title, priority, description } = form;

    if (!stationId || !pillarId || !title || !priority || !description) {
      toast({ title: "Missing information", description: "Please fill in Station, Pillar, Title, Priority and Description.", variant: "destructive" });
      return;
    }

    // lấy reportedById từ localStorage (tuỳ bạn set khi login)
    const reportedByIdStr = localStorage.getItem("userId") || localStorage.getItem("reportedById");
    const reportedById = reportedByIdStr ? Number(reportedByIdStr) : undefined;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority: priority.toUpperCase(), // nếu BE nhận String tự do thì vẫn OK
      stationId: Number(stationId),
      pillarId: Number(pillarId),
      reportedById, // có thể null/undefined nếu BE tự lấy từ JWT
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
      // TODO: refetch incidents list nếu đã nối BE
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to submit incident.";
      toast({ title: "Submit failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (incidentId: string, newStatus: string) => {
    toast({ title: "Status Updated", description: `Incident ${incidentId} status updated to ${newStatus}` });
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Open": { className: "bg-destructive/10 text-destructive border-destructive/20" },
      "In Progress": { className: "bg-warning/10 text-warning border-warning/20" },
      "Resolved": { className: "bg-success/10 text-success border-success/20" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { className: "bg-muted/10 text-muted-foreground border-muted/20" };
    return <Badge className={config.className}>{status}</Badge>;
  };

  const incidentActions = (
    <>
      <Dialog
        open={isReportDialogOpen}
        onOpenChange={(open) => {
          setIsReportDialogOpen(open);
          if (!open) setForm({ stationId: "", pillarId: "", title: "", priority: "", description: "" }); // NEW
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
          onInteractOutside={(e) => submitting && e.preventDefault()} // NEW: chặn đóng khi submit
          onEscapeKeyDown={(e) => submitting && e.preventDefault()}   // NEW
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
                  // khi đổi station -> reset pillar
                  setForm((f) => ({ ...f, stationId: v, pillarId: "" })); // CHANGED
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pillar (phụ thuộc station) */}
            <div className="space-y-2">
              <Label htmlFor="pillar">Pillar</Label>
              <Select
                disabled={!form.stationId}
                value={form.pillarId}
                onValueChange={(v) => setForm((f) => ({ ...f, pillarId: v }))} // NEW
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.stationId ? "Select pillar" : "Select station first"} />
                </SelectTrigger>
                <SelectContent>
                  {(pillarsByStation[Number(form.stationId)] || []).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
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
      {/* ...phần bảng và summary giữ nguyên... */}
      {/* (Bạn có thể giữ như hiện có, không ảnh hưởng logic submit) */}
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
          {/* bảng incidents demo như cũ */}
          {/* ... */}
        </CardContent>
      </Card>
    </StaffLayout>
  );
};

export default StaffIncidents;
