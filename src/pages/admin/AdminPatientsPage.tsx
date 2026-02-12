
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  hospitalName: string;
  hospitalId: string;
  doctorName: string;
  lastVisit: string;
  gender: string;
  age: number;
  totalVisits: number;
}

export default function AdminPatientsPage() {
  const isMobile = useIsMobile();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        if (response.data.success) {
          setPatients(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch patients", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const handleViewDetails = (p: Patient) => { setSelectedPatient(p); setDetailsOpen(true); };

  if (loading) {
    return (
      <DashboardLayout type="admin" title="Patients" subtitle="Loading...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin" title="Patients" subtitle="All registered patients">
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
                  {!isMobile && <span className="text-xs text-muted-foreground">{patient.hospitalName}</span>}
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
                  { l: "Hospital", v: selectedPatient.hospitalName },
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
