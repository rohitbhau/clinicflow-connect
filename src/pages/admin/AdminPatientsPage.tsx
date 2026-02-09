import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, Mail, Stethoscope, Calendar, Eye } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Patient } from "@/data/mockData";

export default function AdminPatientsPage() {
  const { patients, doctors, hospitals } = useData();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (p: Patient) => { setSelectedPatient(p); setDetailsOpen(true); };
  const getHospitalName = (id: string) => hospitals.find((h) => h.id === id)?.name || "Unknown";

  return (
    <DashboardLayout type="admin" title="Patients" subtitle="All patients">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 items-center flex-shrink-0">
          <Badge variant="outline" className="text-xs px-2 py-1">{patients.length}</Badge>
          <Badge variant="outline" className="text-xs px-2 py-1 bg-success/10 text-success border-success/20">
            {patients.filter(p => p.status === "active").length} active
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="space-y-2">
            {filteredPatients.map((patient, i) => (
              <div key={patient.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${i * 20}ms` }}
                onClick={() => handleViewDetails(patient)}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">{patient.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold truncate">{patient.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {isMobile ? patient.phone : `${patient.email} • ${patient.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isMobile && <span className="text-xs text-muted-foreground">{patient.doctorName}</span>}
                  <Badge variant="outline" className={`text-[10px] ${patient.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {patient.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {filteredPatients.length === 0 && <EmptyState icon={Users} title="No patients found" description="Try adjusting your search" />}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Patient Details</DialogTitle><DialogDescription>{selectedPatient?.name}</DialogDescription></DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-bold text-primary text-lg">{selectedPatient.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPatient.name}</h3>
                  <Badge variant="outline" className={`text-[10px] ${selectedPatient.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {selectedPatient.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l: "Email", v: selectedPatient.email },
                  { l: "Phone", v: selectedPatient.phone },
                  { l: "Age", v: `${selectedPatient.age} years` },
                  { l: "Gender", v: selectedPatient.gender },
                  { l: "Doctor", v: selectedPatient.doctorName },
                  { l: "Hospital", v: getHospitalName(selectedPatient.hospitalId) },
                  { l: "Visits", v: selectedPatient.totalVisits },
                  { l: "Last Visit", v: selectedPatient.lastVisit },
                ].map(f => (
                  <div key={f.l}><p className="text-xs text-muted-foreground">{f.l}</p><p className="text-sm font-medium capitalize truncate">{String(f.v)}</p></div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
