import { memo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Stethoscope, Activity, TrendingUp, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function AdminDashboard() {
  const { hospitals, doctors, patients, loginActivity, appointments } = useData();
  const isMobile = useIsMobile();

  const activeHospitals = hospitals.filter((h) => h.status === "active").length;
  const activeDoctors = doctors.filter((d) => d.status === "active").length;
  const onlineUsers = loginActivity.filter((l) => l.status === "online").length;
  const todayAppointments = appointments.filter((a) => a.date === "2026-02-04").length;

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
              value={hospitals.length}
              change={`${activeHospitals} active`}
              changeType="positive"
              icon={Building2}
              iconColor="primary"
            />
          </div>
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Doctors"
              value={doctors.length}
              change={`${activeDoctors} active`}
              changeType="positive"
              icon={Stethoscope}
              iconColor="info"
            />
          </div>
          <div className="flex-shrink-0 w-[150px] sm:w-auto">
            <StatsCard
              title="Patients"
              value={patients.length}
              change={`+${Math.floor(patients.length * 0.1)} today`}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">
        {/* Hospitals List */}
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
              {hospitals.slice(0, 3).map((hospital, index) => {
                const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospital.id).length;
                const hospitalPatients = patients.filter((p) => p.hospitalId === hospital.id).length;
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

        {/* Daily Login Report */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Login Activity
            </CardTitle>
            {!isMobile && <CardDescription>Recent login activity</CardDescription>}
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {loginActivity.slice(0, 4).map((login, index) => (
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
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card sm:h-3 sm:w-3 ${
                          login.status === "online" ? "bg-success" : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-card-foreground truncate sm:text-sm">{login.userName}</p>
                      <p className="text-[10px] text-muted-foreground truncate sm:text-xs">
                        {login.role.charAt(0).toUpperCase() + login.role.slice(1)}
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
              <p className="font-display text-xl font-bold text-primary sm:text-3xl">{hospitals.length}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Hospitals</p>
            </div>
            <div className="rounded-lg bg-info/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-info sm:text-3xl">{doctors.length}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Doctors</p>
            </div>
            <div className="rounded-lg bg-success/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-success sm:text-3xl">{patients.length}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Patients</p>
            </div>
            <div className="rounded-lg bg-warning/5 p-3 text-center sm:p-4">
              <p className="font-display text-xl font-bold text-warning sm:text-3xl">{appointments.length}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Appointments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
