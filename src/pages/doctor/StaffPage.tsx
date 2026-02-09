import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCog, Plus, Search, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { StaffDialog } from "@/components/dialogs/StaffDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import type { StaffMember } from "@/data/mockData";

export default function StaffPage() {
  const { staff, addStaffMember, updateStaffMember, deleteStaffMember } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const doctorStaff = staff.filter((s) => s.doctorId === "d1");
  const filteredStaff = doctorStaff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => { setSelectedStaff(null); setDialogOpen(true); };
  const handleEditClick = (m: StaffMember) => { setSelectedStaff(m); setDialogOpen(true); };
  const handleDeleteClick = (m: StaffMember) => { setSelectedStaff(m); setDeleteDialogOpen(true); };

  const handleSave = (data: any) => {
    if (selectedStaff) { updateStaffMember(selectedStaff.id, data); toast({ title: "Staff updated" }); }
    else { addStaffMember({ ...data, doctorId: "d1", joinedAt: new Date().toISOString().split("T")[0] }); toast({ title: "Staff added" }); }
  };

  const handleDelete = () => {
    if (selectedStaff) { deleteStaffMember(selectedStaff.id); toast({ title: "Staff removed", variant: "destructive" }); setDeleteDialogOpen(false); }
  };

  const getStatusStyle = (s: string) => s === "active" ? "bg-success/10 text-success border-success/20" : s === "on-leave" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground";

  return (
    <DashboardLayout type="doctor" title="Staff" subtitle="Team management">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9 h-11 bg-card text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="gradient-primary gap-1.5 h-11 flex-shrink-0" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />{!isMobile && "Add Staff"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStaff.map((member, i) => (
          <Card key={member.id} className="shadow-card hover:shadow-card-hover transition-all animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <UserCog className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className={`text-[10px] ${getStatusStyle(member.status)}`}>
                  {member.status === "on-leave" ? "On Leave" : member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm">{member.name}</h3>
              <p className="text-xs text-primary mb-2">{member.role}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" />{member.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{member.phone}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Since {member.joinedAt}</span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(member)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteClick(member)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && <EmptyState icon={UserCog} title="No staff found" description={search ? "Try adjusting your search" : "Add your first team member"} actionLabel={!search ? "Add Staff" : undefined} onAction={!search ? handleAddClick : undefined} />}

      <StaffDialog open={dialogOpen} onOpenChange={setDialogOpen} staff={selectedStaff} onSave={handleSave} />
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Remove Staff" description={`Remove "${selectedStaff?.name}"?`} onConfirm={handleDelete} />
    </DashboardLayout>
  );
}
