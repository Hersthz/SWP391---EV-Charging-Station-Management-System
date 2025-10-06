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
  Wrench,
  AlertCircle,
  Eye
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import StaffLayout from "./StaffLayout";

const StaffIncidents = () => {
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const incidents = [
    {
      id: "#INC-001",
      title: "Connector Not Releasing",
      station: "Downtown Station #1",
      connector: "Connector A2",
      priority: "High",
      status: "In Progress",
      reportedBy: "John Anderson",
      reportedTime: "2024-01-15 14:30",
      description: "Customer reports that connector A2 is stuck and will not release from vehicle after charging session completed.",
      estimatedFix: "30 min"
    },
    {
      id: "#INC-002",
      title: "Display Screen Flickering",
      station: "Mall Station #2",
      connector: null,
      priority: "Medium",
      status: "Open",
      reportedBy: "Sarah Chen",
      reportedTime: "2024-01-15 13:45", 
      description: "Main display screen shows intermittent flickering and occasional blue screen errors.",
      estimatedFix: "2 hours"
    },
    {
      id: "#INC-003",
      title: "Routine Maintenance Due",
      station: "Airport Station #3",
      connector: "Connector C1",
      priority: "Low",
      status: "Open",
      reportedBy: "Mike Rodriguez",
      reportedTime: "2024-01-15 12:20",
      description: "Connector C1 is due for scheduled maintenance check and cleaning.",
      estimatedFix: "1 hour"
    }
  ];

  const handleReportIncident = () => {
    toast({
      title: "Incident Reported",
      description: "Your incident report has been submitted successfully",
      variant: "default"
    });
    setIsReportDialogOpen(false);
  };

  const handleUpdateStatus = (incidentId: string, newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Incident ${incidentId} status updated to ${newStatus}`,
      variant: "default"
    });
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      "High": { className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Medium": { className: "bg-warning/10 text-warning border-warning/20" },
      "Low": { className: "bg-muted/10 text-muted-foreground border-muted/20" }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge className={config.className}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Open": { className: "bg-destructive/10 text-destructive border-destructive/20" },
      "In Progress": { className: "bg-warning/10 text-warning border-warning/20" },
      "Resolved": { className: "bg-success/10 text-success border-success/20" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config.className}>
        {status}
      </Badge>
    );
  };

  const incidentActions = (
    <>
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dt-001">Downtown Station #1</SelectItem>
                  <SelectItem value="ml-002">Mall Station #2</SelectItem>
                  <SelectItem value="ap-003">Airport Station #3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input placeholder="Brief description of the issue" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                placeholder="Detailed description of the issue..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportIncident}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <StaffLayout title="Incident Reporting" actions={incidentActions}>
      {/* Summary Cards */}
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

      {/* Recent Incidents */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <AlertTriangle className="w-5 h-5 mr-3 text-primary" />
            Recent Incidents ({incidents.length} issues)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Issues and maintenance requests for your assigned stations</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Incident</TableHead>
                  <TableHead className="font-semibold">Station</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Reported</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{incident.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{incident.id}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {incident.connector || "General"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary truncate max-w-40">{incident.station}</div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(incident.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(incident.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">{incident.reportedBy}</div>
                        <div className="text-xs text-muted-foreground">{incident.reportedTime}</div>
                        {incident.estimatedFix && (
                          <div className="text-xs text-success">Est: {incident.estimatedFix}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary/20 text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {incident.status !== "Resolved" && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(incident.id, "Resolved")}
                            className="bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Update Status
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </StaffLayout>
  );
};

export default StaffIncidents;