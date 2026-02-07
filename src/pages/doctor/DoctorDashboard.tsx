import { useState, useEffect, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, CheckCircle, Play, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppointmentDialog } from "@/components/dialogs/AppointmentDialog";
import api from "@/lib/api";

const AppointmentItem = memo(function AppointmentItem({ 
  appointment, 
  index, 
  onStatusChange,
  isMobile 
}: { 
  appointment: any; 
  index: number; 
  onStatusChange: (id: string, status: string) => void;
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
      className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-all hover:shadow-card-hover animate-slide-up sm:flex-row sm:items-center sm:justify-between sm:p-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${
          appointment.status === "in-progress" ? "bg-warning/10" : "bg-info/10"
        }`}>
          <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${
            appointment.status === "in-progress" ? "text-warning" : "text-info"
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-card-foreground text-sm truncate sm:text-base">{appointment.patientName}</h4>
          <p className="text-xs text-muted-foreground truncate">{appointment.type} • {appointment.time}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Badge variant="outline" className={`text-xs ${getStatusStyle(appointment.status)}`}>
          {appointment.status === "in-progress" ? "In Progress" : "Scheduled"}
        </Badge>
        <div className="flex gap-1">
          {appointment.status === "scheduled" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-warning hover:bg-warning/10"
              onClick={() => onStatusChange(appointment.id, "in-progress")}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {appointment.status === "in-progress" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:bg-success/10"
              onClick={() => onStatusChange(appointment.id, "completed")}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => onStatusChange(appointment.id, "cancelled")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default function DoctorDashboard() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/doctors/dashboard-stats');
      setDashboardData(response.data.data);
    } catch (error) {
      // Silent fail during polling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const todayAppointments = dashboardData?.appointments || [];
  const stats = dashboardData?.stats || {
    todayAppointments: 0,
    todayRevenue: 0,
    pendingAppointments: 0,
    totalPatients: 0
  };

  const filteredAppointments = todayAppointments.filter((app: any) =>
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = useCallback(async (id: string, status: "in-progress" | "completed" | "cancelled") => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast({ title: `Appointment marked as ${status}` });
      fetchDashboardData();
    } catch (error) {
      console.error("Status update failed", error);
      toast({
        title: "Update failed",
        description: "Could not update status",
        variant: "destructive"
      });
    }
  }, [fetchDashboardData, toast]);

  const handleSaveAppointment = useCallback(async (data: any) => {
    const doctorId = user.id;
    if (!doctorId) {
      toast({ title: "Error", description: "Could not identify doctor", variant: "destructive" });
      return;
    }
    try {
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
      setDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to create appointment", error);
      toast({ title: "Error", description: "Failed to schedule", variant: "destructive" });
    }
  }, [user.id, fetchDashboardData, toast]);

  if (loading) {
    return (
      <DashboardLayout type="doctor" title="Dashboard" subtitle="Loading...">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="doctor"
      title={isMobile ? "Dashboard" : `Welcome back, ${user.name || "Doctor"}`}
      subtitle={!isMobile ? "Here's what's happening with your clinic today" : undefined}
      onSearch={setSearchQuery}
    >
      {/* Stats Grid - Horizontally scrollable on mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Today's Appointments"
              value={stats.todayAppointments}
              change={`${stats.pendingAppointments} remaining`}
              changeType="positive"
              icon={Calendar}
              iconColor="primary"
            />
          </div>
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Total Patients"
              value={stats.totalPatients}
              change="Total registered"
              changeType="positive"
              icon={Users}
              iconColor="success"
            />
          </div>
          <div className="flex-shrink-0 w-[160px] sm:w-auto">
            <StatsCard
              title="Pending"
              value={stats.pendingAppointments}
              change={todayAppointments.some((a: any) => a.status === "in-progress") ? "1 in progress" : "None active"}
              changeType="neutral"
              icon={Clock}
              iconColor="warning"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Appointments
              </CardTitle>
              <div className="flex gap-2">
                <Link to="/doctor/appointments">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">View All</Button>
                </Link>
                <Link to={`/queue/${user.id}`} target="_blank">
                  <Button variant="default" size="sm" className="text-xs sm:text-sm">Live Queue</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-3 w-full sm:mb-4 sm:w-auto">
                  <TabsTrigger value="upcoming" className="flex-1 gap-1 text-xs sm:flex-none sm:gap-2 sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    Upcoming ({filteredAppointments.filter((a: any) => a.status === "scheduled" || a.status === "in-progress").length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1 gap-1 text-xs sm:flex-none sm:gap-2 sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Done ({filteredAppointments.filter((a: any) => a.status === "completed").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-2 mt-0 sm:space-y-3">
                  {filteredAppointments
                    .filter((a: any) => a.status === "scheduled" || a.status === "in-progress")
                    .slice(0, 5)
                    .map((appointment: any, index: number) => (
                      <AppointmentItem
                        key={appointment.id}
                        appointment={appointment}
                        index={index}
                        onStatusChange={handleStatusChange}
                        isMobile={isMobile}
                      />
                    ))}
                  {filteredAppointments.filter((a: any) => a.status === "scheduled" || a.status === "in-progress").length === 0 && (
                    <div className="text-center py-6 text-muted-foreground sm:py-8">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50 sm:h-12 sm:w-12" />
                      <p className="text-sm">All appointments completed!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-2 mt-0 sm:space-y-3">
                  {filteredAppointments
                    .filter((a: any) => a.status === "completed")
                    .map((appointment: any, index: number) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3 animate-fade-in sm:p-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 sm:h-10 sm:w-10">
                            <CheckCircle className="h-4 w-4 text-success sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-card-foreground text-sm truncate sm:text-base">{appointment.patientName}</h4>
                            <p className="text-xs text-muted-foreground truncate">{appointment.type} • {appointment.time}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                          Done
                        </Badge>
                      </div>
                    ))}
                  {filteredAppointments.filter((a: any) => a.status === "completed").length === 0 && (
                    <div className="text-center py-6 text-muted-foreground sm:py-8">
                      <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50 sm:h-12 sm:w-12" />
                      <p className="text-sm">No completed appointments yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <QuickActions onNewAppointment={() => setDialogOpen(true)} />
          <RecentActivity appointments={todayAppointments} />
        </div>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveAppointment}
        appointment={null}
      />
    </DashboardLayout>
  );
}
