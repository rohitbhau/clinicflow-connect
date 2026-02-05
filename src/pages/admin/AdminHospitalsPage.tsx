import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search, Edit, Trash2, MapPin, Phone, Users, Stethoscope } from "lucide-react";
import { useData } from "@/context/DataContext";
import { HospitalDialog } from "@/components/dialogs/HospitalDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import type { Hospital } from "@/data/mockData";

export default function AdminHospitalsPage() {
  const { hospitals, doctors, patients, addHospital, updateHospital, deleteHospital } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedHospital(null);
    setDialogOpen(true);
  };

  const handleEditClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setDialogOpen(true);
  };

  const handleDeleteClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setDeleteDialogOpen(true);
  };

  const handleSave = (data: { name: string; address: string; phone: string; status: "active" | "inactive" }) => {
    if (selectedHospital) {
      updateHospital(selectedHospital.id, data);
      toast({ title: "Hospital updated", description: `${data.name} has been updated successfully.` });
    } else {
      addHospital({
        ...data,
        doctors: 0,
        patients: 0,
        createdAt: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Hospital added", description: `${data.name} has been added successfully.` });
    }
  };

  const handleDelete = () => {
    if (selectedHospital) {
      deleteHospital(selectedHospital.id);
      toast({ title: "Hospital deleted", description: `${selectedHospital.name} has been removed.`, variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  // Calculate real stats
  const getHospitalStats = (hospitalId: string) => {
    const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospitalId).length;
    const hospitalPatients = patients.filter((p) => p.hospitalId === hospitalId).length;
    return { doctors: hospitalDoctors, patients: hospitalPatients };
  };

  return (
    <DashboardLayout type="admin" title="Hospitals" subtitle="Manage all registered hospitals and clinics">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hospitals..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add Hospital
        </Button>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital, index) => {
          const stats = getHospitalStats(hospital.id);
          return (
            <Card
              key={hospital.id}
              className="shadow-card hover:shadow-card-hover transition-all animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <Badge
                    variant="outline"
                    className={hospital.status === "active"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {hospital.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{hospital.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {hospital.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Phone className="h-3 w-3" />
                  {hospital.phone}
                </div>
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-info" />
                    <div>
                      <p className="font-semibold text-card-foreground">{stats.doctors}</p>
                      <p className="text-xs text-muted-foreground">Doctors</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-success" />
                    <div>
                      <p className="font-semibold text-card-foreground">{stats.patients}</p>
                      <p className="text-xs text-muted-foreground">Patients</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(hospital)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(hospital)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHospitals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground">No hospitals found</h3>
          <p className="text-muted-foreground">
            {search ? "Try adjusting your search" : "Add your first hospital to get started"}
          </p>
        </div>
      )}

      <HospitalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hospital={selectedHospital}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Hospital"
        description={`Are you sure you want to delete "${selectedHospital?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
