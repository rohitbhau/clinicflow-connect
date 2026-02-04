import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Stethoscope, Plus, Search, Edit, Trash2, Mail, Phone, Building2, Users } from "lucide-react";
import { useData } from "@/context/DataContext";
import { DoctorDialog } from "@/components/dialogs/DoctorDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import type { Doctor } from "@/data/mockData";

export default function AdminDoctorsPage() {
  const { doctors, hospitals, patients, addDoctor, updateDoctor, deleteDoctor } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.hospitalName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedDoctor(null);
    setDialogOpen(true);
  };

  const handleEditClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleSave = (data: { name: string; email: string; phone: string; specialization: string; hospitalId: string; hospitalName: string; status: "active" | "on-leave" | "inactive" }) => {
    if (selectedDoctor) {
      updateDoctor(selectedDoctor.id, data);
      toast({ title: "Doctor updated", description: `${data.name}'s profile has been updated.` });
    } else {
      addDoctor({
        ...data,
        patients: 0,
        joinedAt: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Doctor added", description: `${data.name} has been registered successfully.` });
    }
  };

  const handleDelete = () => {
    if (selectedDoctor) {
      deleteDoctor(selectedDoctor.id);
      toast({ title: "Doctor removed", description: `${selectedDoctor.name} has been removed.`, variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  const getDoctorPatients = (doctorId: string) =>
    patients.filter((p) => p.doctorId === doctorId).length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "on-leave":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout type="admin" title="Doctors" subtitle="Manage all registered doctors">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {/* Doctors Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            All Doctors ({filteredDoctors.length})
          </CardTitle>
          <CardDescription>Complete list of registered doctors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{doctor.name}</h4>
                    <p className="text-sm text-primary">{doctor.specialization}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {doctor.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {doctor.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {doctor.hospitalName}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {getDoctorPatients(doctor.id)} Patients
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusStyle(doctor.status)}>
                    {doctor.status === "on-leave" ? "On Leave" : doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(doctor)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(doctor)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No doctors found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search" : "Add your first doctor to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DoctorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        doctor={selectedDoctor}
        hospitals={hospitals}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Doctor"
        description={`Are you sure you want to remove "${selectedDoctor?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
