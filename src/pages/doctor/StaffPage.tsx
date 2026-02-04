import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCog, Plus, Search, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { StaffDialog } from "@/components/dialogs/StaffDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "@/data/mockData";

export default function StaffPage() {
  const { staff, addStaffMember, updateStaffMember, deleteStaffMember } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Filter for current doctor (d1)
  const doctorStaff = staff.filter((s) => s.doctorId === "d1");
  const filteredStaff = doctorStaff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEditClick = (member: StaffMember) => {
    setSelectedStaff(member);
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };

  const handleSave = (data: { name: string; email: string; phone: string; role: string; status: "active" | "on-leave" | "inactive" }) => {
    if (selectedStaff) {
      updateStaffMember(selectedStaff.id, data);
      toast({ title: "Staff updated", description: `${data.name}'s profile has been updated.` });
    } else {
      addStaffMember({
        ...data,
        doctorId: "d1",
        joinedAt: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Staff added", description: `${data.name} has been added to your team.` });
    }
  };

  const handleDelete = () => {
    if (selectedStaff) {
      deleteStaffMember(selectedStaff.id);
      toast({ title: "Staff removed", description: `${selectedStaff.name} has been removed.`, variant: "destructive" });
      setDeleteDialogOpen(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success border-success/20";
      case "on-leave": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout type="doctor" title="Staff Management" subtitle="Manage your clinic staff members">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gradient-primary gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member, index) => (
          <Card
            key={member.id}
            className="shadow-card hover:shadow-card-hover transition-all animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <UserCog className="h-7 w-7 text-primary" />
                </div>
                <Badge variant="outline" className={getStatusStyle(member.status)}>
                  {member.status === "on-leave" ? "On Leave" : member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-card-foreground">{member.name}</h3>
              <p className="text-sm text-primary mb-3">{member.role}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {member.phone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Joined: {member.joinedAt}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(member)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground">No staff found</h3>
          <p className="text-muted-foreground">
            {search ? "Try adjusting your search" : "Add your first staff member"}
          </p>
        </div>
      )}

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Staff Member"
        description={`Are you sure you want to remove "${selectedStaff?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
