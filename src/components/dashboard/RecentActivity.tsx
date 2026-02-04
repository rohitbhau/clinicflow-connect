import { Activity, UserPlus, Calendar, FileText, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "appointment" | "patient" | "report" | "payment";
  message: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "appointment",
    message: "New appointment booked by Sarah Johnson",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "patient",
    message: "New patient registration: Michael Chen",
    time: "15 min ago",
  },
  {
    id: "3",
    type: "payment",
    message: "Payment received from Emily Davis",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "report",
    message: "Lab report uploaded for Robert Wilson",
    time: "2 hours ago",
  },
];

const iconMap = {
  appointment: Calendar,
  patient: UserPlus,
  report: FileText,
  payment: CreditCard,
};

const colorMap = {
  appointment: "bg-info/10 text-info",
  patient: "bg-success/10 text-success",
  report: "bg-warning/10 text-warning",
  payment: "bg-primary/10 text-primary",
};

export function RecentActivity() {
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
