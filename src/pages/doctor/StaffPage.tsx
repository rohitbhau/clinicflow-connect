import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCog, Plus, Search, Mail, Phone, MoreVertical } from "lucide-react";

const staffMembers = [
  { id: 1, name: "Emily Wilson", role: "Nurse", email: "emily@clinic.com", phone: "+1 234-567-8901", status: "active" },
  { id: 2, name: "Michael Brown", role: "Receptionist", email: "michael@clinic.com", phone: "+1 234-567-8902", status: "active" },
  { id: 3, name: "Sarah Davis", role: "Lab Technician", email: "sarah@clinic.com", phone: "+1 234-567-8903", status: "active" },
  { id: 4, name: "James Miller", role: "Medical Assistant", email: "james@clinic.com", phone: "+1 234-567-8904", status: "on-leave" },
];

export default function StaffPage() {
  return (
    <DashboardLayout
      type="doctor"
      title="Staff Management"
      subtitle="Manage your clinic staff members"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9 bg-card" />
        </div>
        <Button className="gradient-primary gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map((staff, index) => (
          <Card
            key={staff.id}
            className="shadow-card hover:shadow-card-hover transition-all animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <UserCog className="h-7 w-7 text-primary" />
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <h3 className="font-semibold text-lg text-card-foreground">{staff.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{staff.role}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {staff.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {staff.phone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={staff.status === "active" 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-warning/10 text-warning border-warning/20"
                  }
                >
                  {staff.status === "active" ? "Active" : "On Leave"}
                </Badge>
                <Button variant="ghost" size="sm" className="text-primary">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
