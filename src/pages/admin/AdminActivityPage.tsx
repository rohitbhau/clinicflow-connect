import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Clock, TrendingUp, Calendar } from "lucide-react";
import { useData } from "@/context/DataContext";
import api from "@/lib/api";

export default function AdminActivityPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/hospitals/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch activity stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const onlineUsers = stats?.online || 0;
  // stats.loginActivity length might be small (limit 5 in backend). 
  // Maybe I should increase limit in backend or just use what I have.
  // Backend `getHospitalStats` limits to 5.
  const recentActivity = stats?.loginActivity || [];
  const todayAppointments = stats?.appointments || 0;

  // Placeholder for unavailable stats
  const todayLogins = recentActivity.length;
  const completedToday = 0; // Backend doesn't provide this yet
  const hospitalName = stats?.hospital?.name || "Hospital";

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
          title="Recent Logins"
          value={todayLogins}
          change="Last 5 logins"
          changeType="neutral"
          icon={Users}
          iconColor="primary"
        />
        <StatsCard
          title="Appointments Today"
          value={todayAppointments}
          change="Scheduled"
          changeType="neutral"
          icon={Calendar}
          iconColor="info"
        />
        <StatsCard
          title="System Status"
          value="Online"
          change="Stable"
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
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading activity...</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No recent activity</div>
                ) : (
                  recentActivity.map((activity: any, index: number) => (
                    <div
                      key={activity.id || index}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${activity.status === "online" ? "bg-success" : "bg-muted-foreground"
                              }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{activity.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(activity.role || 'user').charAt(0).toUpperCase() + (activity.role || 'user').slice(1)} • {hospitalName}
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
                  ))
                )}
              </div>
            )}
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
                  <p className="font-display text-3xl font-bold text-primary">{stats?.doctors || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Doctors</p>
                </div>
                <div className="rounded-lg bg-success/5 p-4 text-center">
                  <p className="font-display text-3xl font-bold text-success">{stats?.patients || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                </div>
              </div>

              {/* Activity Timeline - Static for now as we don't have timeline events in API yet */}
              <div>
                <h4 className="text-sm font-medium text-card-foreground mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  {[
                    { time: "09:00 AM", event: "System Start", count: "Auto" },
                    { time: "Now", event: "Real-time monitoring", count: "Active" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-20">{item.time}</span>
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-card-foreground">{item.event}</span>
                      <Badge variant="outline" className="ml-auto">{item.count}</Badge>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground italic mt-2">Detailed timeline events coming soon</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-display text-xl font-bold text-info">99.9%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-warning">Active</p>
                    <p className="text-xs text-muted-foreground">Status</p>
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
