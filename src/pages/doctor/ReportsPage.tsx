import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Search, Plus, Trash2, CheckCircle } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import type { Report } from "@/data/mockData";

export default function ReportsPage() {
  const { reports, patients, addReport, updateReport, deleteReport } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [title, setTitle] = useState("");
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("");

  const doctorReports = reports.filter((r) => r.doctorId === "d1");
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");
  const filteredReports = doctorReports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => { setTitle(""); setPatientId(""); setType(""); setDialogOpen(true); };
  const handleDeleteClick = (report: Report) => { setSelectedReport(report); setDeleteDialogOpen(true); };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = doctorPatients.find((p) => p.id === patientId);
    if (patient) {
      addReport({ title, patientId, patientName: patient.name, doctorId: "d1", type, status: "pending", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) });
      toast({ title: "Report created" });
      setDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedReport) { deleteReport(selectedReport.id); toast({ title: "Report deleted", variant: "destructive" }); setDeleteDialogOpen(false); }
  };

  return (
    <DashboardLayout type="doctor" title="Reports" subtitle="Medical reports">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />{!isMobile && "New Report"}
        </Button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Total", value: doctorReports.length, icon: FileText, cls: "text-primary" },
          { label: "Ready", value: doctorReports.filter(r => r.status === "ready").length, icon: CheckCircle, cls: "text-success" },
          { label: "Pending", value: doctorReports.filter(r => r.status === "pending").length, icon: FileText, cls: "text-warning" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-card p-3 shadow-card text-center">
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Reports ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="space-y-2">
            {filteredReports.map((report, i) => (
              <div key={report.id} className="flex items-center gap-3 rounded-lg border border-border p-3 animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold truncate">{report.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{report.patientName} • {report.date}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] ${report.status === "ready" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                    {report.status === "ready" ? "Ready" : "Pending"}
                  </Badge>
                  {!isMobile && report.status === "pending" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { updateReport(report.id, { status: "ready" }); toast({ title: "Marked ready" }); }}>
                      Ready
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick(report)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredReports.length === 0 && <EmptyState icon={FileText} title="No reports" description={search ? "Adjust your search" : "Create your first report"} actionLabel={!search ? "New Report" : undefined} onAction={!search ? handleAddClick : undefined} />}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Report</DialogTitle><DialogDescription>New medical report</DialogDescription></DialogHeader>
          <form onSubmit={handleAddReport} className="space-y-3">
            <div className="space-y-1.5"><Label className="text-sm">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blood Test Report" required className="h-11 text-base" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}><SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{doctorPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-sm">Type</Label>
              <Select value={type} onValueChange={setType}><SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{["Lab Report","Diagnostic","Imaging","General"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" className="gradient-primary">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Report" description={`Delete "${selectedReport?.title}"?`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}
