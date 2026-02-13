import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Clock, TrendingUp, Calendar } from "lucide-react";
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
  const recentActivity = stats?.loginActivity || [];
  const todayAppointments = stats?.appointments || 0;
  const todayLogins = recentActivity.length;
  const hospitalName = stats?.hospital?.name || "Hospital";

  return (
    <DashboardLayout type="admin" title="Activity" subtitle="Monitor daily activity">
      {/* Stats Grid - Scrollable on mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {[
            { title: "Online", value: onlineUsers, change: "Active now", type: "positive" as const, icon: Activity, color: "success" as const },
            { title: "Logins", value: todayLogins, change: "Last 5", type: "neutral" as const, icon: Users, color: "primary" as const },
            { title: "Appointments", value: todayAppointments, change: "Scheduled", type: "neutral" as const, icon: Calendar, color: "info" as const },
            { title: "Status", value: "Online" as any, change: "Stable", type: "positive" as const, icon: Clock, color: "warning" as const },
          ].map((s) => (
            <div key={s.title} className="flex-shrink-0 w-[150px] sm:w-auto">
              <StatsCard title={s.title} value={s.value} change={s.change} changeType={s.type} icon={s.icon} iconColor={s.color} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
        {/* Live Activity Feed */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live Activity Feed
            </CardTitle>
            {loading && <CardDescription>Loading...</CardDescription>}
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 sm:py-8">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity: any, index: number) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary sm:h-10 sm:w-10">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${activity.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-card-foreground truncate sm:text-sm">{activity.userName}</p>
                        <p className="text-[10px] text-muted-foreground truncate sm:text-xs">
                          {(activity.role || 'user').charAt(0).toUpperCase() + (activity.role || 'user').slice(1)} • {hospitalName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 sm:gap-2">
                      <span className="text-[10px] text-muted-foreground sm:text-xs">{activity.loginTime}</span>
                      <Badge variant="outline" className={`text-[10px] ${activity.status === "online" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg bg-primary/5 p-3 text-center sm:p-4">
                  <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stats?.doctors || 0}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Doctors</p>
                </div>
                <div className="rounded-lg bg-success/5 p-3 text-center sm:p-4">
                  <p className="font-display text-2xl font-bold text-success sm:text-3xl">{stats?.patients || 0}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Patients</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-card-foreground mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  {[
                    { time: "09:00 AM", event: "System Start", count: "Auto" },
                    { time: "Now", event: "Real-time monitoring", count: "Active" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm sm:gap-3">
                      <span className="text-muted-foreground w-16 text-xs flex-shrink-0 sm:w-20 sm:text-sm">{item.time}</span>
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-card-foreground text-xs flex-1 truncate sm:text-sm">{item.event}</span>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 sm:text-xs">{item.count}</Badge>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground italic mt-2">Detailed timeline coming soon</div>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3 sm:p-4">
                <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
                  <div>
                    <p className="font-display text-lg font-bold text-info sm:text-xl">99.9%</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">Uptime</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-warning sm:text-xl">Active</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">Status</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-success sm:text-xl">0</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">Errors</p>
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