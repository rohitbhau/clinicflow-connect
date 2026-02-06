import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, XCircle, Plus, Play, Check, X, Phone, Loader2 } from "lucide-react";
import { AppointmentDialog } from "@/components/dialogs/AppointmentDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Appointment = {
  id: string;
  patientName: string;
  patientPhone: string;
  time: string;
  type: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  date: string;
  reason?: string;
};

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/doctors/dashboard-stats');
      if (response.data && response.data.data && response.data.data.appointments) {
        setAppointments(response.data.data.appointments);
      }
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      toast({
        title: "Error",
        description: "Could not load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((app: Appointment) =>
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = filteredAppointments;
  const inProgress = filteredAppointments.filter((a) => a.status === "in-progress");
  const scheduled = filteredAppointments.filter((a) => a.status === "scheduled");
  const completed = filteredAppointments.filter((a) => a.status === "completed");
  const cancelled = filteredAppointments.filter((a) => a.status === "cancelled");

  const handleAddClick = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };
  // ... existing handlers ...

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: Appointment["status"]) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast({ title: `Appointment marked as ${status}` });
      fetchAppointments();
    } catch (error) {
      console.error("Status update failed", error);
      toast({
        title: "Update failed",
        description: "Could not update status",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (data: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Ensure doctorId is passed. Book API expects doctorId.
    // If user is doctor, use user.id (which backend maps to Doctor).
    const doctorId = user.id;

    try {
      if (selectedAppointment) {
        // Update
        await api.put(`/appointments/${selectedAppointment.id}`, {
          ...data,
          appointmentType: data.type // Map type to expected field name if necessary
        });
        toast({ title: "Appointment updated", description: "Changes saved successfully." });
      } else {
        // Create
        if (!doctorId) {
          toast({ title: "Error", description: "Could not identify doctor", variant: "destructive" });
          return;
        }
        // Map dialog data to book API payload
        const payload = {
          doctorId,
          patientName: data.patientName,
          phone: data.patientPhone,
          date: data.date,
          time: data.time,
          appointmentType: data.type,
          notes: data.notes,
          email: "" // Optional
        };
        await api.post('/appointments/book', payload);
        toast({ title: "Appointment scheduled", description: `Appointment for ${data.patientName} has been created.` });
      }
      setDialogOpen(false);
      fetchAppointments(); // Refresh list
    } catch (error) {
      console.error("Save failed", error);
      toast({ title: "Error", description: "Failed to save appointment", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    // Mock for now
    toast({ title: "Note", description: "Delete functionality coming soon to API" });
    setDeleteDialogOpen(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

  const renderAppointmentCard = (appointment: Appointment, index: number) => (
    <div
      key={appointment.id}
      className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${appointment.status === "in-progress" ? "bg-warning/10" :
          appointment.status === "completed" ? "bg-success/10" :
            appointment.status === "cancelled" ? "bg-destructive/10" : "bg-info/10"
          }`}>
          <Clock className={`h-5 w-5 ${appointment.status === "in-progress" ? "text-warning" :
            appointment.status === "completed" ? "text-success" :
              appointment.status === "cancelled" ? "text-destructive" : "text-info"
            }`} />
        </div>
        <div>
          <h4 className="font-semibold text-card-foreground">{appointment.patientName}</h4>
          <p className="text-sm text-muted-foreground">{appointment.type} {appointment.reason ? `- ${appointment.reason}` : ''}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {appointment.time}
            {appointment.patientPhone && (
              <>
                <Phone className="h-3 w-3 ml-2" />
                {appointment.patientPhone}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={getStatusStyle(appointment.status)}>
          {appointment.status === "in-progress" ? "In Progress" : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </Badge>
        <div className="flex gap-1">
          {appointment.status === "scheduled" && (
            <Button
              variant="ghost"
              size="icon"
              className="text-warning hover:bg-warning/10"
              onClick={() => handleStatusChange(appointment.id, "in-progress")}
              title="Start"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {appointment.status === "in-progress" && (
            <Button
              variant="ghost"
              size="icon"
              className="text-success hover:bg-success/10"
              onClick={() => handleStatusChange(appointment.id, "completed")}
              title="Complete"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {(appointment.status === "scheduled" || appointment.status === "in-progress") && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleStatusChange(appointment.id, "cancelled")}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleEditClick(appointment)}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout type="doctor" title="Appointments" subtitle="Loading...">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="doctor"
      title="Appointments"
      subtitle="Manage all your patient appointments"
      onSearch={setSearchQuery}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Appointments"
          value={todayAppointments.length}
          change={`${scheduled.length} remaining`}
          changeType="neutral"
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="In Progress"
          value={inProgress.length}
          change={inProgress.length > 0 ? "Active now" : "None active"}
          changeType="neutral"
          icon={Clock}
          iconColor="warning"
        />
        <StatsCard
          title="Completed"
          value={completed.length}
          change="Today"
          changeType="positive"
          icon={CheckCircle}
          iconColor="success"
        />
        <StatsCard
          title="Cancelled"
          value={cancelled.length}
          change={cancelled.length === 0 ? "No cancellations" : "Today"}
          changeType={cancelled.length === 0 ? "positive" : "neutral"}
          icon={XCircle}
          iconColor="info"
        />
      </div>

      {/* Appointments Card */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointments
          </CardTitle>
          <Button className="gradient-primary gap-2" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({todayAppointments.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgress.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-0">
              {todayAppointments.map((a, i) => renderAppointmentCard(a, i))}
            </TabsContent>
            <TabsContent value="scheduled" className="space-y-3 mt-0">
              {scheduled.map((a, i) => renderAppointmentCard(a, i))}
            </TabsContent>
            <TabsContent value="in-progress" className="space-y-3 mt-0">
              {inProgress.map((a, i) => renderAppointmentCard(a, i))}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3 mt-0">
              {completed.map((a, i) => renderAppointmentCard(a, i))}
            </TabsContent>
          </Tabs>

          {todayAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No appointments today</h3>
              <p className="text-muted-foreground">Schedule a new appointment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        onSave={handleSave}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Cancel Appointment"
        description={`Are you sure you want to delete this appointment for ${selectedAppointment?.patientName}?`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
