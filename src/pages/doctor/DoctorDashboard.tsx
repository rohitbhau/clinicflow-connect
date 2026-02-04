import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, DollarSign, Clock, CheckCircle, Play, Check, X, Phone } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function DoctorDashboard() {
  const { appointments, patients, transactions, updateAppointment } = useData();
  const { toast } = useToast();

  // Filter for current doctor (d1)
  const doctorAppointments = appointments.filter((a) => a.doctorId === "d1");
  const todayAppointments = doctorAppointments.filter((a) => a.date === "2026-02-04");
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");
  const doctorTransactions = transactions.filter((t) => t.doctorId === "d1");

  const todayRevenue = doctorTransactions
    .filter((t) => t.date === "Today" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAppointments = todayAppointments.filter((a) => a.status === "scheduled" || a.status === "in-progress");

  const handleStatusChange = (id: string, status: "in-progress" | "completed" | "cancelled") => {
    updateAppointment(id, { status });
    const statusMessages = {
      "in-progress": "Appointment started",
      "completed": "Appointment completed",
      "cancelled": "Appointment cancelled",
    };
    toast({ title: statusMessages[status] });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

  return (
    <DashboardLayout
      type="doctor"
      title="Welcome back, Dr. Smith"
      subtitle="Here's what's happening with your clinic today"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Appointments"
          value={todayAppointments.length}
          change={`${pendingAppointments.length} remaining`}
          changeType="positive"
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="Total Patients"
          value={doctorPatients.length}
          change={`+${Math.floor(doctorPatients.length * 0.05)} this month`}
          changeType="positive"
          icon={Users}
          iconColor="success"
        />
        <StatsCard
          title="Pending"
          value={pendingAppointments.length}
          change={todayAppointments.filter((a) => a.status === "in-progress").length > 0 ? "1 in progress" : "None active"}
          changeType="neutral"
          icon={Clock}
          iconColor="warning"
        />
        <StatsCard
          title="Revenue (Today)"
          value={`$${todayRevenue.toLocaleString()}`}
          change="+18% vs avg"
          changeType="positive"
          icon={DollarSign}
          iconColor="info"
        />
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
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Upcoming ({todayAppointments.filter((a) => a.status === "scheduled" || a.status === "in-progress").length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed ({todayAppointments.filter((a) => a.status === "completed").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-3 mt-0">
                  {todayAppointments
                    .filter((a) => a.status === "scheduled" || a.status === "in-progress")
                    .slice(0, 5)
                    .map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            appointment.status === "in-progress" ? "bg-warning/10" : "bg-info/10"
                          }`}>
                            <Clock className={`h-5 w-5 ${
                              appointment.status === "in-progress" ? "text-warning" : "text-info"
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
                  {todayAppointments.filter((a) => a.status === "scheduled" || a.status === "in-progress").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>All appointments completed!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-3 mt-0">
                  {todayAppointments
                    .filter((a) => a.status === "completed")
                    .map((appointment, index) => (
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
                  {todayAppointments.filter((a) => a.status === "completed").length === 0 && (
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
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
}
