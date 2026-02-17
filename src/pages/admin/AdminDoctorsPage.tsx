import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Stethoscope, Plus, Search, Edit, Trash2, Mail, Phone, Building2, Users, Clock, CalendarCheck, Copy } from "lucide-react";
import { useData } from "@/context/DataContext";
import { DoctorDialog } from "@/components/dialogs/DoctorDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Doctor } from "@/data/mockData";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminDoctorsPage() {
  const { doctors: contextDoctors, hospitals, patients, addDoctor, updateDoctor, deleteDoctor } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [hospitalUsers, setHospitalUsers] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isHospitalAdmin = user.role === 'admin' && !!user.hospitalName;

  useEffect(() => {
    if (isHospitalAdmin) {
      const fetchUsers = async () => {
        try {
          const res = await api.get('/hospitals/users');
          if (res.data.success) {
            setHospitalUsers(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch hospital users", error);
          toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
        }
      };
      fetchUsers();
    }
  }, [isHospitalAdmin, toast]);

  const doctorsList = isHospitalAdmin
    ? hospitalUsers.filter(u => u.role === 'doctor')
    : contextDoctors;

  const staffList = isHospitalAdmin
    ? hospitalUsers.filter(u => u.role === 'staff')
    : [];

  const filteredDoctors = doctorsList.filter((d) =>
    (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.hospitalName || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredStaff = staffList.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => { setSelectedDoctor(null); setDialogOpen(true); };
  const handleEditClick = (doctor: any) => { setSelectedDoctor(doctor); setDialogOpen(true); };
  const handleDeleteClick = (doctor: any) => { setSelectedDoctor(doctor); setDeleteDialogOpen(true); };

  const handleSave = async (data: any) => {
    if (isHospitalAdmin) {
      try {
        if (selectedDoctor) {
          toast({ title: "Feature Pending", description: "Editing users directly from this panel is under development." });
          return;
        }
        const res = await api.post('/hospitals/users', data);
        if (res.data.success) {
          const { user, generatedPassword } = res.data.data;
          setCreatedCredentials({ email: user.email, password: generatedPassword });
          setShowPasswordDialog(true);
          const usersRes = await api.get('/hospitals/users');
          if (usersRes.data.success) { setHospitalUsers(usersRes.data.data); }
          setDialogOpen(false);
        }
      } catch (error: any) {
        console.error("Add user error", error);
        toast({ title: "Error", description: error.response?.data?.error?.message || "Failed to add user", variant: "destructive" });
      }
      return;
    }

    if (selectedDoctor) {
      updateDoctor(selectedDoctor.id, data);
      toast({ title: "Doctor updated", description: `${data.name}'s profile has been updated.` });
    } else {
      addDoctor({ ...data, patients: 0, joinedAt: new Date().toISOString().split("T")[0] });
      toast({ title: "Doctor added", description: `${data.name} has been registered successfully.` });
    }
  };

  const handleDelete = async () => {
    if (isHospitalAdmin) {
      if (!selectedDoctor) return;
      try {
        const res = await api.delete(`/hospitals/users/${selectedDoctor.id}`);
        if (res.data.success) {
          toast({ title: "User Removed", description: "User has been successfully removed." });
          setHospitalUsers(prev => prev.filter(u => u.id !== selectedDoctor.id));
          setDeleteDialogOpen(false);
        }
      } catch (error) {
        console.error("Delete user error", error);
        toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
      }
      return;
    }

    if (selectedDoctor) {
      deleteDoctor(selectedDoctor.id);
      toast({ title: "Doctor removed", description: `${selectedDoctor?.name} has been removed.`, variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (user: any, newStatus: string) => {
    if (!isHospitalAdmin) return;
    try {
      const res = await api.patch(`/hospitals/users/${user.id}/status`, { status: newStatus });
      if (res.data.success) {
        toast({ title: "Status Updated", description: `User marked as ${newStatus}` });
        setHospitalUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      }
    } catch (error) {
      console.error("Status update error", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const getDoctorPatients = (doctorId: string) =>
    patients.filter((p) => p.doctorId === doctorId).length;

  const getStatusStyle = (status: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    switch (status.toLowerCase()) {
      case "active": return "bg-success/10 text-success border-success/20";
      case "on-leave": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const UserCard = ({ person, role }: { person: any; role: "doctor" | "staff" }) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-all hover:shadow-card-hover animate-slide-up sm:p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${role === "doctor" ? "bg-primary/10" : "bg-info/10"}`}>
          {role === "doctor" ? <Stethoscope className="h-5 w-5 text-primary sm:h-6 sm:w-6" /> : <Users className="h-5 w-5 text-info sm:h-6 sm:w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-card-foreground text-sm truncate sm:text-base">{person.name}</h4>
              <p className="text-xs text-primary capitalize">{person.specialization || person.role || "General"}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${getStatusStyle(person.status)}`}>
              {person.status === "on-leave" ? "On Leave" : (person.status || "active").charAt(0).toUpperCase() + (person.status || "active").slice(1)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
            <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 flex-shrink-0" />{person.email}</span>
            {person.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 flex-shrink-0" />{person.phone}</span>}
            {person.tempPassword && (
              <span className="flex items-center gap-1 text-destructive font-mono bg-destructive/10 px-1.5 rounded text-[10px]">
                Pwd: {person.tempPassword}
              </span>
            )}
          </div>
          {!isHospitalAdmin && !isMobile && (
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{person.hospitalName}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getDoctorPatients(person.id)} Patients</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        {isHospitalAdmin && (
          <div className="flex gap-1.5 overflow-x-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 flex-shrink-0"><Clock className="h-3 w-3" /> Hours</Button>
            {role === "staff" && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 flex-shrink-0" onClick={() => handleStatusChange(person, person.status === 'active' ? 'on-leave' : 'active')}>
                <CalendarCheck className="h-3 w-3" />
                {person.status === 'active' ? 'On-Leave' : 'Active'}
              </Button>
            )}
          </div>
        )}
        {!isHospitalAdmin && <div />}
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(person)}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(person)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout type="admin" title="Hospital Users" subtitle={isHospitalAdmin ? `Manage ${user.hospitalName} Staff & Doctors` : "Manage all registered doctors"}>
      {/* Header Actions */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          {!isMobile && "Add User"}
        </Button>
      </div>

      {/* Doctors */}
      <Card className="shadow-card mb-4 sm:mb-8">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Doctors ({filteredDoctors.length})
          </CardTitle>
          {!isMobile && <CardDescription>Medical staff with appointment schedules</CardDescription>}
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            {filteredDoctors.map((doctor, index) => (
              <UserCard key={doctor.id || index} person={doctor} role="doctor" />
            ))}
          </div>
          {filteredDoctors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Stethoscope className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-semibold text-card-foreground">No doctors found</h3>
              <p className="text-xs text-muted-foreground">{search ? "Try adjusting your search" : "Add your first doctor"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff */}
      {isHospitalAdmin && (
        <Card className="shadow-card">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-info" />
              Support Staff ({filteredStaff.length})
            </CardTitle>
            {!isMobile && <CardDescription>Nurses, Receptionists, and other staff</CardDescription>}
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {filteredStaff.map((staff, index) => (
                <UserCard key={staff.id || index} person={staff} role="staff" />
              ))}
            </div>
            {filteredStaff.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="text-base font-semibold text-card-foreground">No staff found</h3>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <DoctorDialog open={dialogOpen} onOpenChange={setDialogOpen} doctor={selectedDoctor} hospitals={hospitals} onSave={handleSave} mode={isHospitalAdmin ? "hospital_admin" : "super_admin"} />

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Credentials Created</DialogTitle>
            <DialogDescription>Copy these credentials. The password will not be shown again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <Input value={createdCredentials?.email || ''} readOnly className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Password</p>
              <div className="flex items-center gap-2">
                <Input value={createdCredentials?.password || ''} readOnly className="h-11 text-base" />
                <Button size="icon" variant="outline" className="h-11 w-11 flex-shrink-0" onClick={() => {
                  navigator.clipboard.writeText(createdCredentials?.password || '');
                  toast({ title: "Copied", description: "Password copied to clipboard" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-11 gradient-primary" onClick={() => setShowPasswordDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Remove User" description={`Remove "${selectedDoctor?.name}"? This cannot be undone.`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}