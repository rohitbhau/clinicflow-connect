import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Stethoscope, Activity, TrendingUp, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";

export default function AdminDashboard() {
  const { hospitals, doctors, patients, loginActivity, appointments } = useData();

  const activeHospitals = hospitals.filter((h) => h.status === "active").length;
  const activeDoctors = doctors.filter((d) => d.status === "active").length;
  const onlineUsers = loginActivity.filter((l) => l.status === "online").length;
  const todayAppointments = appointments.filter((a) => a.date === "2026-02-04").length;

  return (
    <DashboardLayout
      type="admin"
      title="Admin Dashboard"
      subtitle="Overview of all hospitals, doctors, and patients"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Hospitals"
          value={hospitals.length}
          change={`${activeHospitals} active`}
          changeType="positive"
          icon={Building2}
          iconColor="primary"
        />
        <StatsCard
          title="Total Doctors"
          value={doctors.length}
          change={`${activeDoctors} active`}
          changeType="positive"
          icon={Stethoscope}
          iconColor="info"
        />
        <StatsCard
          title="Total Patients"
          value={patients.length}
          change={`+${Math.floor(patients.length * 0.1)} today`}
          changeType="positive"
          icon={Users}
          iconColor="success"
        />
        <StatsCard
          title="Active Sessions"
          value={onlineUsers}
          change="Online now"
          changeType="neutral"
          icon={Activity}
          iconColor="warning"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hospitals List */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Hospitals Overview
              </CardTitle>
              <CardDescription>All registered hospitals and clinics</CardDescription>
            </div>
            <Link to="/admin/hospitals">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hospitals.slice(0, 3).map((hospital, index) => {
                const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospital.id).length;
                const hospitalPatients = patients.filter((p) => p.hospitalId === hospital.id).length;
                return (
                  <div
                    key={hospital.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-card-foreground">{hospital.name}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{hospitalDoctors} Doctors</span>
                          <span>{hospitalPatients} Patients</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={hospital.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                        {hospital.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                      <Link to="/admin/hospitals">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Login Report */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Daily Login Report
            </CardTitle>
            <CardDescription>Recent login activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loginActivity.slice(0, 4).map((login, index) => (
                <div
                  key={login.id}
                  className="flex items-center justify-between animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          login.status === "online" ? "bg-success" : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{login.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {login.role.charAt(0).toUpperCase() + login.role.slice(1)} • {login.hospitalName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{login.loginTime}</span>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-success">{onlineUsers}</p>
                <p className="text-xs text-muted-foreground">Online Now</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-info">{todayAppointments}</p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart Placeholder */}
      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Platform Analytics
          </CardTitle>
          <CardDescription>Appointments and registrations overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="font-display text-3xl font-bold text-primary">{hospitals.length}</p>
              <p className="text-sm text-muted-foreground">Hospitals</p>
            </div>
            <div className="rounded-lg bg-info/5 p-4 text-center">
              <p className="font-display text-3xl font-bold text-info">{doctors.length}</p>
              <p className="text-sm text-muted-foreground">Doctors</p>
            </div>
            <div className="rounded-lg bg-success/5 p-4 text-center">
              <p className="font-display text-3xl font-bold text-success">{patients.length}</p>
              <p className="text-sm text-muted-foreground">Patients</p>
            </div>
            <div className="rounded-lg bg-warning/5 p-4 text-center">
              <p className="font-display text-3xl font-bold text-warning">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
