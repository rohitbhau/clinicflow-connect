import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const reports = [
  { id: 1, title: "Blood Test Report", patient: "Sarah Johnson", date: "Feb 4, 2026", type: "Lab Report", status: "ready" },
  { id: 2, title: "ECG Analysis", patient: "Michael Chen", date: "Feb 3, 2026", type: "Diagnostic", status: "ready" },
  { id: 3, title: "X-Ray Report", patient: "Emily Davis", date: "Feb 3, 2026", type: "Imaging", status: "pending" },
  { id: 4, title: "Complete Health Checkup", patient: "Robert Wilson", date: "Feb 2, 2026", type: "General", status: "ready" },
  { id: 5, title: "Thyroid Panel", patient: "Lisa Brown", date: "Feb 1, 2026", type: "Lab Report", status: "ready" },
];

export default function ReportsPage() {
  return (
    <DashboardLayout
      type="doctor"
      title="Reports"
      subtitle="View and manage patient medical reports"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search reports..." className="pl-9 bg-card" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
        <Button className="gradient-primary gap-2">
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Reports List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            All Reports
          </CardTitle>
          <CardDescription>Patient medical reports and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, index) => (
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
                      {report.patient} • {report.date}
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
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
