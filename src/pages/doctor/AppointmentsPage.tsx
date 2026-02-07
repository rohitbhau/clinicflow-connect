import { useState, useEffect, useCallback, memo } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
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

const AppointmentCard = memo(function AppointmentCard({ 
  appointment, 
  index, 
  onStatusChange, 
  onEdit,
  isMobile 
}: { 
  appointment: Appointment; 
  index: number; 
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onEdit: (appointment: Appointment) => void;
  isMobile: boolean;
}) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-all hover:shadow-card-hover animate-slide-up sm:flex-row sm:items-center sm:justify-between sm:p-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${
          appointment.status === "in-progress" ? "bg-warning/10" :
          appointment.status === "completed" ? "bg-success/10" :
          appointment.status === "cancelled" ? "bg-destructive/10" : "bg-info/10"
        }`}>
          <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${
            appointment.status === "in-progress" ? "text-warning" :
            appointment.status === "completed" ? "text-success" :
            appointment.status === "cancelled" ? "text-destructive" : "text-info"
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-card-foreground truncate">{appointment.patientName}</h4>
          <p className="text-xs text-muted-foreground truncate sm:text-sm">
            {appointment.type} {appointment.reason ? `- ${appointment.reason}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {appointment.time}
            </span>
            {appointment.patientPhone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {appointment.patientPhone}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <Badge variant="outline" className={`text-xs ${getStatusStyle(appointment.status)}`}>
          {appointment.status === "in-progress" ? "In Progress" : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </Badge>
        <div className="flex gap-1">
          {appointment.status === "scheduled" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-warning hover:bg-warning/10 touch-target"
              onClick={() => onStatusChange(appointment.id, "in-progress")}
              title="Start"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {appointment.status === "in-progress" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:bg-success/10 touch-target"
              onClick={() => onStatusChange(appointment.id, "completed")}
              title="Complete"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {(appointment.status === "scheduled" || appointment.status === "in-progress") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 touch-target"
              onClick={() => onStatusChange(appointment.id, "cancelled")}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(appointment)}>
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default function AppointmentsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAppointments = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = appointments.filter((app: Appointment) =>
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = filteredAppointments;
  const inProgress = filteredAppointments.filter((a) => a.status === "in-progress");
  const scheduled = filteredAppointments.filter((a) => a.status === "scheduled");
  const completed = filteredAppointments.filter((a) => a.status === "completed");
  const cancelled = filteredAppointments.filter((a) => a.status === "cancelled");

  const handleAddClick = useCallback(() => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: Appointment["status"]) => {
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
  }, [fetchAppointments, toast]);

  const handleSave = useCallback(async (data: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const doctorId = user.id;

    try {
      if (selectedAppointment) {
        await api.put(`/appointments/${selectedAppointment.id}`, {
          ...data,
          appointmentType: data.type
        });
        toast({ title: "Appointment updated", description: "Changes saved successfully." });
      } else {
        if (!doctorId) {
          toast({ title: "Error", description: "Could not identify doctor", variant: "destructive" });
          return;
        }
        const payload = {
          doctorId,
          patientName: data.patientName,
          phone: data.patientPhone,
          date: data.date,
          time: data.time,
          appointmentType: data.type,
          notes: data.notes,
          email: ""
        };
        await api.post('/appointments/book', payload);
        toast({ title: "Appointment scheduled", description: `Appointment for ${data.patientName} has been created.` });
      }
      setDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Save failed", error);
      toast({ title: "Error", description: "Failed to save appointment", variant: "destructive" });
    }
  }, [selectedAppointment, fetchAppointments, toast]);

  const handleDelete = useCallback(() => {
    toast({ title: "Note", description: "Delete functionality coming soon to API" });
    setDeleteDialogOpen(false);
  }, [toast]);

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
      subtitle={!isMobile ? "Manage all your patient appointments" : undefined}
      onSearch={setSearchQuery}
    >
      {/* Stats - Scrollable on mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Today"
              value={todayAppointments.length}
              change={`${scheduled.length} pending`}
              changeType="neutral"
              icon={Calendar}
              iconColor="primary"
            />
          </div>
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="In Progress"
              value={inProgress.length}
              change={inProgress.length > 0 ? "Active" : "None"}
              changeType="neutral"
              icon={Clock}
              iconColor="warning"
            />
          </div>
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Completed"
              value={completed.length}
              change="Today"
              changeType="positive"
              icon={CheckCircle}
              iconColor="success"
            />
          </div>
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Cancelled"
              value={cancelled.length}
              change={cancelled.length === 0 ? "None" : "Today"}
              changeType={cancelled.length === 0 ? "positive" : "neutral"}
              icon={XCircle}
              iconColor="info"
            />
          </div>
        </div>
      </div>

      {/* Appointments Card */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Appointments
          </CardTitle>
          <Button className="gradient-primary gap-2 w-full sm:w-auto" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="mb-3 sm:mb-4 w-max sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All ({todayAppointments.length})</TabsTrigger>
                <TabsTrigger value="scheduled" className="text-xs sm:text-sm">Pending ({scheduled.length})</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-xs sm:text-sm">Active ({inProgress.length})</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">Done ({completed.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-2 mt-0 sm:space-y-3">
              {todayAppointments.map((a, i) => (
                <AppointmentCard 
                  key={a.id} 
                  appointment={a} 
                  index={i} 
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditClick}
                  isMobile={isMobile}
                />
              ))}
            </TabsContent>
            <TabsContent value="scheduled" className="space-y-2 mt-0 sm:space-y-3">
              {scheduled.map((a, i) => (
                <AppointmentCard 
                  key={a.id} 
                  appointment={a} 
                  index={i} 
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditClick}
                  isMobile={isMobile}
                />
              ))}
            </TabsContent>
            <TabsContent value="in-progress" className="space-y-2 mt-0 sm:space-y-3">
              {inProgress.map((a, i) => (
                <AppointmentCard 
                  key={a.id} 
                  appointment={a} 
                  index={i} 
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditClick}
                  isMobile={isMobile}
                />
              ))}
            </TabsContent>
            <TabsContent value="completed" className="space-y-2 mt-0 sm:space-y-3">
              {completed.map((a, i) => (
                <AppointmentCard 
                  key={a.id} 
                  appointment={a} 
                  index={i} 
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditClick}
                  isMobile={isMobile}
                />
              ))}
            </TabsContent>
          </Tabs>

          {todayAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3 sm:h-12 sm:w-12 sm:mb-4" />
              <h3 className="text-base font-semibold text-card-foreground sm:text-lg">No appointments today</h3>
              <p className="text-sm text-muted-foreground">Schedule a new appointment to get started</p>
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
