import { memo } from "react";
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

export const RecentActivity = memo(function RecentActivity({ appointments = [] }: RecentActivityProps) {
  const activities: ActivityItem[] = appointments.slice(0, 5).map(app => ({
    id: app.id,
    type: 'appointment',
    message: `Appointment with ${app.patientName}`,
    time: app.time
  }));

  if (activities.length === 0) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-card sm:p-6">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-3 sm:text-lg sm:mb-4">
          Recent Activity
        </h3>
        <p className="text-sm text-muted-foreground">No recent activity today.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-card sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Activity className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        <h3 className="font-display text-base font-semibold text-card-foreground sm:text-lg">
          Recent Activity
        </h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-2 animate-fade-in sm:gap-3"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("rounded-lg p-1.5 flex-shrink-0 sm:p-2", colorMap[activity.type])}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-card-foreground truncate sm:text-sm">{activity.message}</p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
