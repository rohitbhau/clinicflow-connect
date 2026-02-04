import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Stethoscope, Activity, TrendingUp, MoreVertical, Eye } from "lucide-react";

const hospitals = [
  { id: 1, name: "City General Hospital", doctors: 24, patients: 1250, status: "active" },
  { id: 2, name: "Metro Health Clinic", doctors: 12, patients: 680, status: "active" },
  { id: 3, name: "Sunrise Medical Center", doctors: 18, patients: 920, status: "active" },
];

const recentLogins = [
  { id: 1, name: "Dr. John Smith", role: "Doctor", hospital: "City General", time: "2 min ago", status: "online" },
  { id: 2, name: "Dr. Sarah Johnson", role: "Doctor", hospital: "Metro Health", time: "15 min ago", status: "online" },
  { id: 3, name: "Mike Wilson", role: "Staff", hospital: "City General", time: "1 hour ago", status: "offline" },
  { id: 4, name: "Dr. Emily Davis", role: "Doctor", hospital: "Sunrise Medical", time: "2 hours ago", status: "offline" },
];

export default function AdminDashboard() {
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
          value={12}
          change="+2 this month"
          changeType="positive"
          icon={Building2}
          iconColor="primary"
        />
        <StatsCard
          title="Total Doctors"
          value={156}
          change="+8 this week"
          changeType="positive"
          icon={Stethoscope}
          iconColor="info"
        />
        <StatsCard
          title="Total Patients"
          value="4,892"
          change="+124 today"
          changeType="positive"
          icon={Users}
          iconColor="success"
        />
        <StatsCard
          title="Active Sessions"
          value={48}
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
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hospitals.map((hospital, index) => (
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
                        <span>{hospital.doctors} Doctors</span>
                        <span>{hospital.patients} Patients</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Active
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
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
              {recentLogins.map((login, index) => (
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
                      <p className="text-sm font-medium text-card-foreground">{login.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {login.role} • {login.hospital}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{login.time}</span>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-success">32</p>
                <p className="text-xs text-muted-foreground">Online Today</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-info">156</p>
                <p className="text-xs text-muted-foreground">Total Logins</p>
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
          <div className="flex h-64 items-center justify-center rounded-lg bg-secondary/30 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Analytics charts will appear here</p>
              <p className="text-sm">Connect to backend to enable real-time data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
