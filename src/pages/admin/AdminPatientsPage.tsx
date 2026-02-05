import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone, Calendar, Stethoscope, Eye } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Patient } from "@/data/mockData";

export default function AdminPatientsPage() {
  const { patients, doctors, hospitals } = useData();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const getHospitalName = (hospitalId: string) =>
    hospitals.find((h) => h.id === hospitalId)?.name || "Unknown";

  return (
    <DashboardLayout type="admin" title="Patients" subtitle="View all patients across hospitals">
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
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Total: {patients.length}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-success/10 text-success border-success/20">
            Active: {patients.filter((p) => p.status === "active").length}
          </Badge>
        </div>
      </div>

      {/* Patients Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Patients ({filteredPatients.length})
          </CardTitle>
          <CardDescription>Complete patient directory across all hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-semibold text-primary text-sm">
                      {patient.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{patient.name}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground">
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
                  <div className="text-right hidden lg:block">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Stethoscope className="h-3 w-3" />
                      {patient.doctorName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Last: {patient.lastVisit}
                    </div>
                  </div>
                  <div className="text-right hidden md:block lg:hidden">
                    <p className="text-sm text-card-foreground">{patient.totalVisits} visits</p>
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
                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(patient)}>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No patients found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Complete information for {selectedPatient?.name}</DialogDescription>
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
                  <Badge
                    variant="outline"
                    className={selectedPatient.status === "active"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {selectedPatient.status}
                  </Badge>
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
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedPatient.age} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{selectedPatient.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-medium">{selectedPatient.doctorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hospital</p>
                  <p className="font-medium">{getHospitalName(selectedPatient.hospitalId)}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
