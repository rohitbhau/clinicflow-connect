import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Search, Plus, Trash2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@/data/mockData";

export default function ReportsPage() {
  const { reports, patients, addReport, updateReport, deleteReport } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("");

  // Filter for current doctor (d1)
  const doctorReports = reports.filter((r) => r.doctorId === "d1");
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");
  const filteredReports = doctorReports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setTitle("");
    setPatientId("");
    setType("");
    setDialogOpen(true);
  };

  const handleDeleteClick = (report: Report) => {
    setSelectedReport(report);
    setDeleteDialogOpen(true);
  };

  const handleMarkReady = (id: string) => {
    updateReport(id, { status: "ready" });
    toast({ title: "Report ready", description: "Report has been marked as ready." });
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = doctorPatients.find((p) => p.id === patientId);
    if (patient) {
      addReport({
        title,
        patientId,
        patientName: patient.name,
        doctorId: "d1",
        type,
        status: "pending",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      });
      toast({ title: "Report created", description: `${title} has been created.` });
      setDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedReport) {
      deleteReport(selectedReport.id);
      toast({ title: "Report deleted", variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  return (
    <DashboardLayout type="doctor" title="Reports" subtitle="View and manage patient medical reports">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{doctorReports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-success">{doctorReports.filter((r) => r.status === "ready").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{doctorReports.filter((r) => r.status === "pending").length}</p>
              </div>
              <FileText className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            All Reports ({filteredReports.length})
          </CardTitle>
          <CardDescription>Patient medical reports and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report, index) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.patientName} • {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-secondary">
                    {report.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={report.status === "ready"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20"
                    }
                  >
                    {report.status === "ready" ? "Ready" : "Pending"}
                  </Badge>
                  <div className="flex gap-1">
                    {report.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkReady(report.id)}>
                        Mark Ready
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(report)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No reports found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search" : "Create your first report"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>Create a new medical report</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddReport} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blood Test Report"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {doctorPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Report Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lab Report">Lab Report</SelectItem>
                  <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="Imaging">Imaging</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary">
                Create Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Report"
        description={`Are you sure you want to delete "${selectedReport?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
