import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Phone, Mail, Calendar, MoreVertical } from "lucide-react";

const patients = [
  { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1 234-567-8901", lastVisit: "Today", status: "active", appointments: 8 },
  { id: 2, name: "Michael Chen", email: "michael@email.com", phone: "+1 234-567-8902", lastVisit: "Yesterday", status: "active", appointments: 5 },
  { id: 3, name: "Emily Davis", email: "emily@email.com", phone: "+1 234-567-8903", lastVisit: "3 days ago", status: "active", appointments: 12 },
  { id: 4, name: "Robert Wilson", email: "robert@email.com", phone: "+1 234-567-8904", lastVisit: "1 week ago", status: "inactive", appointments: 3 },
  { id: 5, name: "Lisa Brown", email: "lisa@email.com", phone: "+1 234-567-8905", lastVisit: "2 weeks ago", status: "active", appointments: 6 },
];

export default function PatientsPage() {
  return (
    <DashboardLayout
      type="doctor"
      title="Patients"
      subtitle="Manage your patient records"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients..." className="pl-9 bg-card" />
        </div>
        <Button className="gradient-primary gap-2">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Patients List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Patients
          </CardTitle>
          <CardDescription>Your registered patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((patient, index) => (
              <div
                key={patient.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-semibold text-primary">
                      {patient.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{patient.name}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
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
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-card-foreground">{patient.appointments} visits</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      Last: {patient.lastVisit}
                    </p>
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
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
