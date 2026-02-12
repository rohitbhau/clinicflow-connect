import { memo, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Stethoscope, Activity, TrendingUp, Eye, Clock, Play, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const HospitalCard = memo(function HospitalCard({
  hospital,
  doctorCount,
  patientCount,
  index
}: {
  hospital: any;
  doctorCount: number;
  patientCount: number;
  index: number;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-all hover:shadow-card-hover animate-slide-up sm:flex-row sm:items-center sm:justify-between sm:p-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
          <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-card-foreground text-sm truncate sm:text-base">{hospital.name}</h4>
          <div className="flex gap-3 text-xs text-muted-foreground sm:text-sm sm:gap-4">
            <span>{doctorCount} Doctors</span>
            <span>{patientCount} Patients</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <Badge variant="outline" className={`text-xs ${hospital.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
          {hospital.status === "active" ? "Active" : "Inactive"}
        </Badge>
        <Link to="/admin/hospitals">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
      </div>
    </div>
  );
});

// Component to display all doctors queue for hospital admin
const HospitalQueues = memo(function HospitalQueues({ hospitalId }: { hospitalId: string }) {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = async () => {
    try {
      const response = await api.get(`/appointments/queue/hospital/${hospitalId}`);
      if (response.data.success) {
        setQueues(response.data.data.queues || []);
      }
    } catch (error) {
      console.error("Failed to fetch queues", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 300000); // 5 minutes polling
    return () => clearInterval(interval);
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No queues available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {queues.map((queue) => (
        <Card key={queue.doctor.id} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                {queue.doctor.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {queue.queueCount} waiting
              </Badge>
            </div>
            <CardDescription className="text-xs">{queue.doctor.specialization}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Current Serving */}
            <div className="mb-3 rounded-lg bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Play className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground">Now Serving</span>
              </div>
              {queue.current ? (
                <div>
                  <p className="font-bold text-primary">#{queue.current.tokenNumber}</p>
                  <p className="text-sm truncate">{queue.current.patientName}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting...</p>
              )}
            </div>
            {/* Waiting Queue */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Up Next</span>
              {queue.queue.slice(0, 3).map((item: any, idx: number) => (
                <div key={item._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{item.patientName}</span>
                  <Badge variant="secondary" className="text-xs">#{item.tokenNumber}</Badge>
                </div>
              ))}
              {queue.queue.length > 3 && (
                <p className="text-xs text-muted-foreground">+{queue.queue.length - 3} more</p>
              )}
              {queue.queue.length === 0 && !queue.current && (
                <p className="text-sm text-muted-foreground">No patients waiting</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default function AdminDashboard() {
  const { hospitals: mockHospitals, doctors: mockDoctors, patients: mockPatients, loginActivity: mockLoginActivity, appointments: mockAppointments } = useData();
  const isMobile = useIsMobile();
  const [realStats, setRealStats] = useState<any>(null);
  const [hospitalId, setHospitalId] = useState<string>("");

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isHospitalAdmin = user.role === 'admin' && !!user.hospitalName;

  useEffect(() => {
    if (isHospitalAdmin) {
      const fetchStats = async () => {
        try {
          const res = await api.get('/hospitals/stats');
          if (res.data.success) {
            setRealStats(res.data.data);
            setHospitalId(res.data.data.hospital?._id || res.data.data.hospital?.id || "");
          }
        } catch (error) {
          console.error("Failed to fetch stats", error);
        }
      };
      fetchStats();
    }
  }, [isHospitalAdmin]);

  const activeHospitals = isHospitalAdmin ? 1 : mockHospitals.filter((h) => h.status === "active").length;
  const activeDoctors = realStats ? realStats.doctors : mockDoctors.filter((d) => d.status === "active").length;
  const onlineUsers = realStats ? realStats.online : mockLoginActivity.filter((l) => l.status === "online").length;
  const todayAppointments = realStats ? realStats.appointments : mockAppointments.filter((a) => a.date === "2026-02-04").length;

  const totalHospitals = isHospitalAdmin ? 1 : mockHospitals.length;
  const totalDoctors = realStats ? realStats.doctors : mockDoctors.length;
  const totalPatients = realStats ? realStats.patients : mockPatients.length;
  const totalAppointments = realStats ? realStats.appointments : mockAppointments.length; // realStats.appointments is 'today' appointments count

  const loginActivity = realStats ? realStats.loginActivity : mockLoginActivity;

  return (
    <DashboardLayout
      type="admin"
      title={isMobile ? "Dashboard" : "Admin Dashboard"}
      subtitle={!isMobile ? "Overview of all hospitals, doctors, and patients" : undefined}
    >
      {/* Stats Grid - Scrollable on mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Hospitals"
              value={totalHospitals}
              change={`${activeHospitals} active`}
              changeType="positive"
              icon={Building2}
              iconColor="primary"
            />
          </div>
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Doctors"
              value={totalDoctors}
              change={realStats ? "Total registered" : `${activeDoctors} active`}
              changeType="positive"
              icon={Stethoscope}
              iconColor="info"
            />
          </div>
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Patients"
              value={totalPatients}
              change={realStats ? "Total registered" : `+${Math.floor(mockPatients.length * 0.1)} today`}
              changeType="positive"
              icon={Users}
              iconColor="success"
            />
          </div>
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Online"
              value={onlineUsers}
              change="Active now"
              changeType="neutral"
              icon={Activity}
              iconColor="warning"
            />
          </div>
        </div>
      </div>

      {/* Hospital Queues - Only for Hospital Admin */}
      {isHospitalAdmin && hospitalId && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Live Queues
            </h2>
            <Link to={`/live-queue/${hospitalId}`} target="_blank">
              <Button variant="outline" size="sm" className="h-8">
                <Monitor className="h-4 w-4 mr-2" />
                Display Board
              </Button>
            </Link>
          </div>
          <HospitalQueues hospitalId={hospitalId} />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">
        {/* Hospitals List - Hide for Hospital Admin per preference or show limited. Showing mock for now if not hospital admin */}
        {!isHospitalAdmin && (
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Hospitals Overview
                </CardTitle>
                {!isMobile && (
                  <CardDescription>All registered hospitals and clinics</CardDescription>
                )}
              </div>
              <Link to="/admin/hospitals">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="space-y-2 sm:space-y-4">
                {mockHospitals.slice(0, 3).map((hospital, index) => {
                  const hospitalDoctors = mockDoctors.filter((d) => d.hospitalId === hospital.id).length;
                  const hospitalPatients = mockPatients.filter((p) => p.hospitalId === hospital.id).length;
                  return (
                    <HospitalCard
                      key={hospital.id}
                      hospital={hospital}
                      doctorCount={hospitalDoctors}
                      patientCount={hospitalPatients}
                      index={index}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Hospital - Show for Hospital Admin */}
        {isHospitalAdmin && realStats?.hospital && (
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  My Hospital
                </CardTitle>
                <CardDescription>Hospital details and status</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <HospitalCard
                hospital={realStats.hospital}
                doctorCount={realStats.doctors}
                patientCount={realStats.patients}
                index={0}
              />
            </CardContent>
          </Card>
        )}

        {/* Daily Login Report */}
        <Card className={`shadow-card ${isHospitalAdmin ? 'lg:col-span-3' : ''}`}>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Login Activity
            </CardTitle>
            {!isMobile && <CardDescription>Recent login activity</CardDescription>}
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {loginActivity.slice(0, 4).map((login: any, index: number) => (
                <div
                  key={login.id}
                  className="flex items-center justify-between animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary sm:h-10 sm:w-10">
                        <Users className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card sm:h-3 sm:w-3 ${login.status === "online" ? "bg-success" : "bg-muted-foreground"
                          }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-card-foreground truncate sm:text-sm">{login.userName}</p>
                      <p className="text-[10px] text-muted-foreground truncate sm:text-xs">
                        {(login.role || 'user').charAt(0).toUpperCase() + (login.role || 'user').slice(1)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2 sm:text-xs">{login.loginTime}</span>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3 sm:mt-6 sm:gap-4 sm:p-4">
              <div className="text-center">
                <p className="font-display text-xl font-bold text-success sm:text-2xl">{onlineUsers}</p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">Online</p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-bold text-info sm:text-2xl">{todayAppointments}</p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <Card className="mt-4 shadow-card sm:mt-6">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Platform Analytics
          </CardTitle>
          {!isMobile && <CardDescription>Appointments and registrations overview</CardDescription>}
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-primary/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-primary sm:text-3xl">{totalHospitals}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Hospitals</p>
            </div>
            <div className="rounded-lg bg-info/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-info sm:text-3xl">{totalDoctors}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Doctors</p>
            </div>
            <div className="rounded-lg bg-success/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-success sm:text-3xl">{totalPatients}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Patients</p>
            </div>
            <div className="rounded-lg bg-warning/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-warning sm:text-3xl">{totalAppointments}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Appointments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
