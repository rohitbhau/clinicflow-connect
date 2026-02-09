import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search, Edit, Trash2, MapPin, Phone, Users, Stethoscope } from "lucide-react";
import { useData } from "@/context/DataContext";
import { HospitalDialog } from "@/components/dialogs/HospitalDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import type { Hospital } from "@/data/mockData";

export default function AdminHospitalsPage() {
  const { hospitals, doctors, patients, addHospital, updateHospital, deleteHospital } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => { setSelectedHospital(null); setDialogOpen(true); };
  const handleEditClick = (h: Hospital) => { setSelectedHospital(h); setDialogOpen(true); };
  const handleDeleteClick = (h: Hospital) => { setSelectedHospital(h); setDeleteDialogOpen(true); };

  const handleSave = (data: any) => {
    if (selectedHospital) { updateHospital(selectedHospital.id, data); toast({ title: "Hospital updated" }); }
    else { addHospital({ ...data, doctors: 0, patients: 0, createdAt: new Date().toISOString().split("T")[0] }); toast({ title: "Hospital added" }); }
  };

  const handleDelete = () => {
    if (selectedHospital) { deleteHospital(selectedHospital.id); toast({ title: "Hospital deleted", variant: "destructive" }); setDeleteDialogOpen(false); }
  };

  const getHospitalStats = (id: string) => ({
    doctors: doctors.filter((d) => d.hospitalId === id).length,
    patients: patients.filter((p) => p.hospitalId === id).length,
  });

  return (
    <DashboardLayout type="admin" title="Hospitals" subtitle="Manage clinics">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />{!isMobile && "Add Hospital"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredHospitals.map((hospital, i) => {
          const stats = getHospitalStats(hospital.id);
          return (
            <Card key={hospital.id} className="shadow-card hover:shadow-card-hover transition-all animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${hospital.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {hospital.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{hospital.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{hospital.address}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><Phone className="h-3 w-3" />{hospital.phone}</p>
                <div className="grid grid-cols-2 gap-2 py-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-info" />
                    <div><p className="text-sm font-semibold">{stats.doctors}</p><p className="text-[10px] text-muted-foreground">Doctors</p></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-success" />
                    <div><p className="text-sm font-semibold">{stats.patients}</p><p className="text-[10px] text-muted-foreground">Patients</p></div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEditClick(hospital)}>
                    <Edit className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(hospital)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHospitals.length === 0 && <EmptyState icon={Building2} title="No hospitals found" description={search ? "Adjust your search" : "Add your first hospital"} actionLabel={!search ? "Add Hospital" : undefined} onAction={!search ? handleAddClick : undefined} />}

      <HospitalDialog open={dialogOpen} onOpenChange={setDialogOpen} hospital={selectedHospital} onSave={handleSave} />
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Hospital" description={`Delete "${selectedHospital?.name}"?`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}
