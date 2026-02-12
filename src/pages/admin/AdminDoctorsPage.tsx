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
import type { Doctor } from "@/data/mockData";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminDoctorsPage() {
  const { doctors: contextDoctors, hospitals, patients, addDoctor, updateDoctor, deleteDoctor } = useData();
  const { toast } = useToast();
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

  const handleAddClick = () => {
    setSelectedDoctor(null);
    setDialogOpen(true);
  };

  const handleEditClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleDeleteClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (isHospitalAdmin) {
      try {
        if (selectedDoctor) {
          // Edit mode
          // TODO: Implement backend update for Hospital Admin
          toast({ title: "Feature Pending", description: "Editing users directly from this panel is under development." });
          return;
        }

        const res = await api.post('/hospitals/users', data);
        if (res.data.success) {
          const { user, generatedPassword } = res.data.data;

          // Show password dialog
          setCreatedCredentials({ email: user.email, password: generatedPassword });
          setShowPasswordDialog(true);

          // Refresh list
          const usersRes = await api.get('/hospitals/users');
          if (usersRes.data.success) {
            setHospitalUsers(usersRes.data.data);
          }
          setDialogOpen(false);
        }
      } catch (error: any) {
        console.error("Add user error", error);
        toast({
          title: "Error",
          description: error.response?.data?.error?.message || "Failed to add user",
          variant: "destructive"
        });
      }
      return;
    }

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
        // Update local state
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
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "on-leave":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout type="admin" title="Hospital Users" subtitle={isHospitalAdmin ? `Manage ${user.hospitalName} Staff & Doctors` : "Manage all registered doctors"}>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Doctors Table */}
      <Card className="shadow-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Doctors ({filteredDoctors.length})
          </CardTitle>
          <CardDescription>Medical staff with appointment schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor.id || index}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{doctor.name}</h4>
                    <p className="text-sm text-primary">{doctor.specialization || "General Physician"}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {doctor.email}
                      </span>
                      {doctor.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {doctor.phone}
                        </span>
                      )}
                      {doctor.tempPassword && (
                        <span className="flex items-center gap-1 text-destructive font-mono bg-destructive/10 px-1 rounded">
                          Pwd: {doctor.tempPassword}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    {isHospitalAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Clock className="h-3 w-3" /> Hours
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <CalendarCheck className="h-3 w-3" /> Attendance
                        </Button>
                      </div>
                    )}
                    {!isHospitalAdmin && (
                      <>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {doctor.hospitalName}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {getDoctorPatients(doctor.id)} Patients
                        </div>
                      </>
                    )}
                  </div>
                  <Badge variant="outline" className={getStatusStyle(doctor.status)}>
                    {doctor.status === "on-leave" ? "On Leave" : (doctor.status || "active").charAt(0).toUpperCase() + (doctor.status || "active").slice(1)}
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

      {/* Staff Table (Only for Hospital Admin) */}
      {isHospitalAdmin && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              Support Staff ({filteredStaff.length})
            </CardTitle>
            <CardDescription>Nurses, Receptionists, and other staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStaff.map((staff, index) => (
                <div
                  key={staff.id || index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                      <Users className="h-6 w-6 text-info" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground">{staff.name}</h4>
                      <p className="text-sm text-primary capitalize">{staff.role}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {staff.email}
                        </span>
                        {staff.tempPassword && (
                          <span className="flex items-center gap-1 text-destructive font-mono bg-destructive/10 px-1 rounded">
                            Pwd: {staff.tempPassword}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Clock className="h-3 w-3" /> Hours
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleStatusChange(staff, staff.status === 'active' ? 'on-leave' : 'active')}>
                          <CalendarCheck className="h-3 w-3" />
                          {staff.status === 'active' ? 'Mark On-Leave' : 'Mark Active'}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusStyle(staff.status)}>
                      {(staff.status || "Active").charAt(0).toUpperCase() + (staff.status || "active").slice(1)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(staff)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredStaff.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground">No staff found</h3>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <DoctorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        doctor={selectedDoctor}
        hospitals={hospitals}
        onSave={handleSave}
        mode={isHospitalAdmin ? "hospital_admin" : "super_admin"}
      />

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Credentials Created</DialogTitle>
            <DialogDescription>
              Please copy the following credentials. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <div className="flex items-center gap-2">
                <Input value={createdCredentials?.email || ''} readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Password</p>
              <div className="flex items-center gap-2">
                <Input value={createdCredentials?.password || ''} readOnly />
                <Button size="icon" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(createdCredentials?.password || '');
                  toast({ title: "Copied", description: "Password copied to clipboard" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove User"
        description={`Are you sure you want to remove "${selectedDoctor?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
