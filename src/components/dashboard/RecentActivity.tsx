import { Activity, UserPlus, Calendar, FileText, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "appointment" | "patient" | "report" | "payment";
  message: string;
  time: string;
}

interface RecentActivityProps {
  appointments?: any[];
}

const colorMap = {
  appointment: "bg-info/10 text-info",
  patient: "bg-success/10 text-success",
  report: "bg-warning/10 text-warning",
  payment: "bg-primary/10 text-primary",
};

const iconMap = {
  appointment: Calendar,
  patient: UserPlus,
  report: FileText,
  payment: CreditCard,
};

export function RecentActivity({ appointments = [] }: RecentActivityProps) {
  // Map appointments to activities
  // Sort by time (assuming they are today)
  const activities: ActivityItem[] = appointments.slice(0, 5).map(app => ({
    id: app.id,
    type: 'appointment',
    message: `Appointment with ${app.patientName}`,
    time: app.time
  }));

  if (activities.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity today.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold text-card-foreground">
          Recent Activity
        </h3>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("rounded-lg p-2", colorMap[activity.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-card-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
