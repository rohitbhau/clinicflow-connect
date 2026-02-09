import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Phone, Mail, Calendar, Edit, Trash2, Eye, FileText } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PatientDialog } from "@/components/dialogs/PatientDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Patient } from "@/data/mockData";

export default function PatientsPage() {
  const { appointments, reports, addPatient, updatePatient, deletePatient } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [fetchedPatients, setFetchedPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/doctors/patients');
        if (response.data.success) {
          setFetchedPatients(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch patients", error);
        toast({ title: "Failed to load patients", description: "Could not fetch patient list", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, [toast]);

  const filteredPatients = fetchedPatients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const handleAddClick = () => { setSelectedPatient(null); setDialogOpen(true); };
  const handleEditClick = (patient: Patient) => { setSelectedPatient(patient); setDialogOpen(true); };
  const handleDeleteClick = (patient: Patient) => { setSelectedPatient(patient); setDeleteDialogOpen(true); };
  const handleViewClick = (patient: Patient) => { setSelectedPatient(patient); setDetailsOpen(true); };

  const handleSave = (data: any) => {
    // Ideally this should call API, but keeping mock fallback for now + local update
    if (selectedPatient) {
       // update local state
       setFetchedPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, ...data } : p));
       updatePatient(selectedPatient.id, data);
       toast({ title: "Patient updated" });
    } else {
       // Optimistic add
       const newPatient = { ...data, id: Math.random().toString(36).substr(2, 9), doctorId: "d1", totalVisits: 0, lastVisit: "Never", status: 'active' };
       setFetchedPatients(prev => [newPatient, ...prev]);
       addPatient(newPatient); // Sync to mock store just in case
       toast({ title: "Patient added" });
    }
  };

  const handleDelete = () => {
    if (selectedPatient) {
      setFetchedPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
      deletePatient(selectedPatient.id);
      toast({ title: "Patient removed", variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  const getPatientAppointments = (id: string) => appointments.filter((a) => a.patientId === id);
  const getPatientReports = (id: string) => reports.filter((r) => r.patientId === id);

  return (
    <DashboardLayout type="doctor" title="Patients" subtitle="Patient records">
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          {!isMobile && "Add Patient"}
        </Button>
      </div>

      {/* Patients */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="space-y-2">
            {filteredPatients.map((patient, index) => (
              <div key={patient.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:shadow-card-hover animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => handleViewClick(patient)}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {patient.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-card-foreground truncate">{patient.name}</h4>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {patient.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isMobile && (
                    <span className="text-xs text-muted-foreground">{patient.totalVisits} visits</span>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${patient.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {patient.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <EmptyState icon={Users} title="No patients found" description={search ? "Try adjusting your search" : "Add your first patient"} actionLabel={!search ? "Add Patient" : undefined} onAction={!search ? handleAddClick : undefined} />
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Profile and history</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-bold text-primary text-lg">{selectedPatient.name.split(" ").map((n) => n[0]).join("")}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedPatient.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedPatient.age} yrs • {selectedPatient.gender}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDetailsOpen(false); handleEditClick(selectedPatient); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDetailsOpen(false); handleDeleteClick(selectedPatient); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium text-sm truncate">{selectedPatient.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-sm">{selectedPatient.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Visits</p><p className="font-medium text-sm">{selectedPatient.totalVisits}</p></div>
                <div><p className="text-xs text-muted-foreground">Last Visit</p><p className="font-medium text-sm">{selectedPatient.lastVisit}</p></div>
              </div>
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" />Appointments ({getPatientAppointments(selectedPatient.id).length})</h4>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {getPatientAppointments(selectedPatient.id).map((apt) => (
                    <div key={apt.id} className="flex justify-between text-xs bg-secondary/50 rounded-lg p-2">
                      <span>{apt.type}</span><span className="text-muted-foreground">{apt.date} {apt.time}</span>
                    </div>
                  ))}
                  {getPatientAppointments(selectedPatient.id).length === 0 && <p className="text-xs text-muted-foreground">No appointments</p>}
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" />Reports ({getPatientReports(selectedPatient.id).length})</h4>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {getPatientReports(selectedPatient.id).map((report) => (
                    <div key={report.id} className="flex justify-between text-xs bg-secondary/50 rounded-lg p-2">
                      <span>{report.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${report.status === "ready" ? "bg-success/10 text-success" : ""}`}>{report.status}</Badge>
                    </div>
                  ))}
                  {getPatientReports(selectedPatient.id).length === 0 && <p className="text-xs text-muted-foreground">No reports</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PatientDialog open={dialogOpen} onOpenChange={setDialogOpen} patient={selectedPatient} onSave={handleSave} />
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Remove Patient" description={`Remove "${selectedPatient?.name}"? This cannot be undone.`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}
