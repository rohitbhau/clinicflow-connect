import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Clock, TrendingUp, Calendar } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function AdminActivityPage() {
  const { loginActivity, doctors, appointments } = useData();

  const onlineUsers = loginActivity.filter((l) => l.status === "online").length;
  const todayLogins = loginActivity.length;
  const todayAppointments = appointments.filter((a) => a.date === "2026-02-04").length;
  const completedToday = appointments.filter((a) => a.date === "2026-02-04" && a.status === "completed").length;

  return (
    <DashboardLayout type="admin" title="Activity" subtitle="Monitor daily login and activity reports">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Currently Online"
          value={onlineUsers}
          change="Active now"
          changeType="positive"
          icon={Activity}
          iconColor="success"
        />
        <StatsCard
          title="Today's Logins"
          value={todayLogins}
          change="Doctors & Staff"
          changeType="neutral"
          icon={Users}
          iconColor="primary"
        />
        <StatsCard
          title="Appointments Today"
          value={todayAppointments}
          change={`${completedToday} completed`}
          changeType="positive"
          icon={Calendar}
          iconColor="info"
        />
        <StatsCard
          title="Avg Session Time"
          value="45m"
          change="+5m from avg"
          changeType="positive"
          icon={Clock}
          iconColor="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live Activity Feed */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time login and activity updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loginActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          activity.status === "online" ? "bg-success" : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{activity.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.role.charAt(0).toUpperCase() + activity.role.slice(1)} • {activity.hospitalName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{activity.loginTime}</span>
                    <Badge
                      variant="outline"
                      className={activity.status === "online"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Summary
            </CardTitle>
            <CardDescription>Today's activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-primary/5 p-4 text-center">
                  <p className="font-display text-3xl font-bold text-primary">{doctors.filter((d) => d.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">Active Doctors</p>
                </div>
                <div className="rounded-lg bg-success/5 p-4 text-center">
                  <p className="font-display text-3xl font-bold text-success">{completedToday}</p>
                  <p className="text-sm text-muted-foreground">Completed Visits</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="text-sm font-medium text-card-foreground mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  {[
                    { time: "09:00 AM", event: "Peak login activity", count: "15 logins" },
                    { time: "10:30 AM", event: "Most appointments scheduled", count: "8 appointments" },
                    { time: "12:00 PM", event: "Reports generated", count: "5 reports" },
                    { time: "02:00 PM", event: "New patient registrations", count: "3 patients" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-20">{item.time}</span>
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-card-foreground">{item.event}</span>
                      <Badge variant="outline" className="ml-auto">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-display text-xl font-bold text-info">98%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-warning">2.3s</p>
                    <p className="text-xs text-muted-foreground">Avg Load</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-success">0</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
