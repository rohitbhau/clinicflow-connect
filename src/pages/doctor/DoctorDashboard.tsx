import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, DollarSign, Clock, CheckCircle, Play, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentDialog } from "@/components/dialogs/AppointmentDialog";
import api from "@/lib/api";

export default function DoctorDashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/doctors/dashboard-stats');
      setDashboardData(response.data.data);
    } catch (error) {
      //   console.error("Failed to fetch dashboard stats", error);
      // Silent fail during polling to avoid spamming console
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Use fetched appointments or fallback to empty array
  const todayAppointments = dashboardData?.appointments || [];
  const stats = dashboardData?.stats || {
    todayAppointments: 0,
    todayRevenue: 0,
    pendingAppointments: 0,
    totalPatients: 0
  };

  // Filter appointments based on search query
  const filteredAppointments = todayAppointments.filter((app: any) =>
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (id: string, status: "in-progress" | "completed" | "cancelled") => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast({ title: `Appointment marked as ${status}` });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Status update failed", error);
      toast({
        title: "Update failed",
        description: "Could not update status",
        variant: "destructive"
      });
    }
  };

  const handleSaveAppointment = async (data: any) => {
    // Create only for dashboard quick action
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
        email: "" // Optional
      };
      await api.post('/appointments/book', payload);
      toast({ title: "Appointment scheduled", description: `Appointment for ${data.patientName} has been created.` });
      setDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to create appointment", error);
      toast({ title: "Error", description: "Failed to schedule", variant: "destructive" });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

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
      title={`Welcome back, ${user.name || "Doctor"}`}
      subtitle="Here's what's happening with your clinic today"
      onSearch={setSearchQuery}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          change={`${stats.pendingAppointments} remaining`}
          changeType="positive"
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          change="Total registered"
          changeType="positive"
          icon={Users}
          iconColor="success"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingAppointments}
          change={todayAppointments.some((a: any) => a.status === "in-progress") ? "1 in progress" : "None active"}
          changeType="neutral"
          icon={Clock}
          iconColor="warning"
        />
        {/* Commented out Revenue as requested
        <StatsCard
          title="Revenue (Today)"
          value={`$${stats.todayRevenue.toLocaleString()}`}
          change="Estimated"
          changeType="positive"
          icon={DollarSign}
          iconColor="info"
        />
        */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Appointments
              </CardTitle>
              <Link to="/doctor/appointments">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
              <Link to={`/queue/${user.id}`} target="_blank">
                <Button variant="default" size="sm" className="ml-2">Live Queue</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Upcoming ({filteredAppointments.filter((a: any) => a.status === "scheduled" || a.status === "in-progress").length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed ({filteredAppointments.filter((a: any) => a.status === "completed").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-3 mt-0">
                  {filteredAppointments
                    .filter((a: any) => a.status === "scheduled" || a.status === "in-progress")
                    .slice(0, 5)
                    .map((appointment: any, index: number) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${appointment.status === "in-progress" ? "bg-warning/10" : "bg-info/10"
                            }`}>
                            <Clock className={`h-5 w-5 ${appointment.status === "in-progress" ? "text-warning" : "text-info"
                              }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">{appointment.patientName}</h4>
                            <p className="text-sm text-muted-foreground">{appointment.type} • {appointment.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusStyle(appointment.status)}>
                            {appointment.status === "in-progress" ? "In Progress" : "Scheduled"}
                          </Badge>
                          {appointment.status === "scheduled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-warning hover:bg-warning/10"
                              onClick={() => handleStatusChange(appointment.id, "in-progress")}
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
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleStatusChange(appointment.id, "cancelled")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {filteredAppointments.filter((a: any) => a.status === "scheduled" || a.status === "in-progress").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>All appointments completed!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-3 mt-0">
                  {filteredAppointments
                    .filter((a: any) => a.status === "completed")
                    .map((appointment: any, index: number) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                            <CheckCircle className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">{appointment.patientName}</h4>
                            <p className="text-sm text-muted-foreground">{appointment.type} • {appointment.time}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Completed
                        </Badge>
                      </div>
                    ))}
                  {filteredAppointments.filter((a: any) => a.status === "completed").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No completed appointments yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
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
