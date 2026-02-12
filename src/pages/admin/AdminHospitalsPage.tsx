import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import api from "@/lib/api";

export default function AdminHospitalsPage() {
  const { hospitals, doctors, patients, addHospital, updateHospital, deleteHospital } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [realHospital, setRealHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isHospitalAdmin = user.role === 'admin' && !!user.hospitalName;

  useEffect(() => {
    if (isHospitalAdmin) {
      const fetchHospitalData = async () => {
        try {
          // Reusing getHospitalStats which returns { hospital: ... }
          const response = await api.get('/hospitals/stats');
          if (response.data.success && response.data.data.hospital) {
            // Augment with stats
            const data = response.data.data;
            setRealHospital({
              ...data.hospital,
              doctorsCount: data.doctors,
              patientsCount: data.patients
            });
          }
        } catch (error) {
          console.error("Failed to fetch hospital data", error);
        } finally {
          setLoading(false);
        }
      };
      fetchHospitalData();
    } else {
      setLoading(false);
    }
  }, [isHospitalAdmin]);

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => { setSelectedHospital(null); setDialogOpen(true); };
  const handleEditClick = (h: Hospital) => { setSelectedHospital(h); setDialogOpen(true); };
  const handleDeleteClick = (h: Hospital) => { setSelectedHospital(h); setDeleteDialogOpen(true); };

  const handleRealEdit = () => {
    if (!realHospital) return;
    // Adopt realHospital to match HospitalDialog props
    const addressStr = typeof realHospital.address === 'object'
      ? `${realHospital.address.street || ''}${realHospital.address.city ? ', ' + realHospital.address.city : ''}`
      : (realHospital.address || '');

    setSelectedHospital({
      id: realHospital.id,
      name: realHospital.name,
      address: addressStr || '',
      phone: realHospital.phone || '',
      status: realHospital.status as "active" | "inactive",
      doctors: realHospital.doctorsCount,
      patients: realHospital.patientsCount,
      createdAt: ""
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (isHospitalAdmin) {
      try {
        const res = await api.put('/hospitals/details', {
          name: data.name,
          address: data.address,
          phone: data.phone,
          status: data.status
        });
        if (res.data.success) {
          toast({ title: "Details updated successfully" });

          // Update local state
          setRealHospital((prev: any) => ({
            ...prev,
            ...res.data.data,
            doctorsCount: prev.doctorsCount,
            patientsCount: prev.patientsCount
          }));

          // Sync User Session if name changed
          if (data.name !== user.hospitalName) {
            const newUser = { ...user, hospitalName: data.name };
            localStorage.setItem('user', JSON.stringify(newUser));
            window.location.reload();
          }
        }
      } catch (error: any) {
        console.error("Update error", error);
        toast({ title: "Update failed", description: error.response?.data?.error?.message || "Could not update details", variant: "destructive" });
      }
    } else {
      if (selectedHospital) { updateHospital(selectedHospital.id, data); toast({ title: "Hospital updated" }); }
      else { addHospital({ ...data, doctors: 0, patients: 0, createdAt: new Date().toISOString().split("T")[0] }); toast({ title: "Hospital added" }); }
    }
  };

  const handleDelete = () => {
    if (selectedHospital) { deleteHospital(selectedHospital.id); toast({ title: "Hospital deleted", variant: "destructive" }); setDeleteDialogOpen(false); }
  };

  const getHospitalStats = (id: string) => ({
    doctors: doctors.filter((d) => d.hospitalId === id).length,
    patients: patients.filter((p) => p.hospitalId === id).length,
  });

  return (
    <DashboardLayout type="admin" title={isHospitalAdmin ? "My Hospital" : "Hospitals"} subtitle={isHospitalAdmin ? "Manage your clinic details" : "Manage clinics"}>
      {!isHospitalAdmin && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />{!isMobile && "Add Hospital"}
          </Button>
        </div>
      )}

      {isHospitalAdmin ? (
        <div className="max-w-3xl">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading hospital details...</div>
          ) : realHospital ? (
            <Card className="shadow-card border-l-4 border-l-primary animate-slide-up">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{realHospital.name}</h2>
                        <Badge variant="outline" className={realHospital.status === 'active' ? "bg-success/10 text-success border-success/20" : ""}>
                          {realHospital.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-foreground/70" />
                        <span>{realHospital.address?.city || "No Address"}, {realHospital.address?.country || ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-foreground/70" />
                        <span>{realHospital.phone || "No Phone"}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <div className="rounded-lg bg-secondary/50 px-4 py-2 text-center min-w-[100px]">
                        <p className="text-sm font-medium text-muted-foreground">Doctors</p>
                        <p className="text-2xl font-bold text-primary">{realHospital.doctorsCount || 0}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 px-4 py-2 text-center min-w-[100px]">
                        <p className="text-sm font-medium text-muted-foreground">Patients</p>
                        <p className="text-2xl font-bold text-success">{realHospital.patientsCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    <Button variant="outline" onClick={handleRealEdit}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Details
                    </Button>
                    <Button variant="outline" className="text-muted-foreground" disabled>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Hospital
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={Building2} title="Hospital not found" description="Contact super admin support." />
          )}
        </div>
      ) : (
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
      )}

      {!isHospitalAdmin && filteredHospitals.length === 0 && <EmptyState icon={Building2} title="No hospitals found" description={search ? "Adjust your search" : "Add your first hospital"} actionLabel={!search ? "Add Hospital" : undefined} onAction={!search ? handleAddClick : undefined} />}

      <HospitalDialog open={dialogOpen} onOpenChange={setDialogOpen} hospital={selectedHospital} onSave={handleSave} />
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Hospital" description={`Delete "${selectedHospital?.name}"?`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}
