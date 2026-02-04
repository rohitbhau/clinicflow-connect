import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Phone, Mail, Calendar, Edit, Trash2, Eye, FileText } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PatientDialog } from "@/components/dialogs/PatientDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Patient } from "@/data/mockData";

export default function PatientsPage() {
  const { patients, appointments, reports, addPatient, updatePatient, deletePatient } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filter for current doctor (d1)
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");
  const filteredPatients = doctorPatients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedPatient(null);
    setDialogOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleSave = (data: { name: string; email: string; phone: string; age: number; gender: "male" | "female" | "other"; status: "active" | "inactive" }) => {
    if (selectedPatient) {
      updatePatient(selectedPatient.id, data);
      toast({ title: "Patient updated", description: `${data.name}'s record has been updated.` });
    } else {
      addPatient({
        ...data,
        doctorId: "d1",
        doctorName: "Dr. John Smith",
        hospitalId: "h1",
        lastVisit: "Never",
        totalVisits: 0,
      });
      toast({ title: "Patient added", description: `${data.name} has been registered.` });
    }
  };

  const handleDelete = () => {
    if (selectedPatient) {
      deletePatient(selectedPatient.id);
      toast({ title: "Patient removed", description: `${selectedPatient.name} has been removed.`, variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  const getPatientAppointments = (patientId: string) =>
    appointments.filter((a) => a.patientId === patientId);

  const getPatientReports = (patientId: string) =>
    reports.filter((r) => r.patientId === patientId);

  return (
    <DashboardLayout type="doctor" title="Patients" subtitle="Manage your patient records">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Patients List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Patients ({filteredPatients.length})
          </CardTitle>
          <CardDescription>Your registered patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-semibold text-primary">
                      {patient.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{patient.name}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-card-foreground">{patient.totalVisits} visits</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      Last: {patient.lastVisit}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={patient.status === "active"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {patient.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewClick(patient)}>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(patient)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(patient)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No patients found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search" : "Add your first patient to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Complete patient profile and history</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-bold text-primary text-xl">
                    {selectedPatient.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.age} years • {selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPatient.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPatient.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Visits</p>
                  <p className="font-medium">{selectedPatient.totalVisits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Visit</p>
                  <p className="font-medium">{selectedPatient.lastVisit}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Appointments ({getPatientAppointments(selectedPatient.id).length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {getPatientAppointments(selectedPatient.id).map((apt) => (
                    <div key={apt.id} className="flex justify-between text-sm bg-secondary/50 rounded p-2">
                      <span>{apt.type}</span>
                      <span className="text-muted-foreground">{apt.date} {apt.time}</span>
                    </div>
                  ))}
                  {getPatientAppointments(selectedPatient.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No appointments</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Reports ({getPatientReports(selectedPatient.id).length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {getPatientReports(selectedPatient.id).map((report) => (
                    <div key={report.id} className="flex justify-between text-sm bg-secondary/50 rounded p-2">
                      <span>{report.title}</span>
                      <Badge variant="outline" className={report.status === "ready" ? "bg-success/10 text-success" : ""}>
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                  {getPatientReports(selectedPatient.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No reports</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={selectedPatient}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Patient"
        description={`Are you sure you want to remove "${selectedPatient?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
