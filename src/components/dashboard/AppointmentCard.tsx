import { Clock, User, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  time: string;
  type: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}

interface AppointmentCardProps {
  appointment: Appointment;
  index?: number;
}

const statusStyles = {
  scheduled: "bg-info/10 text-info border-info/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function AppointmentCard({ appointment, index = 0 }: AppointmentCardProps) {
  return (
    <div 
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:shadow-card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-card-foreground">
            {appointment.patientName}
          </h4>
          <p className="text-sm text-muted-foreground">{appointment.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {appointment.time}
          </div>
          <p className="text-xs text-muted-foreground">{appointment.patientPhone}</p>
        </div>
        <Badge
          variant="outline"
          className={cn("font-medium", statusStyles[appointment.status])}
        >
          {statusLabels[appointment.status]}
        </Badge>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
