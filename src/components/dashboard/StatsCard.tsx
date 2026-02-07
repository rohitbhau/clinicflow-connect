import { memo } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: "primary" | "accent" | "success" | "warning" | "info";
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export const StatsCard = memo(function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "primary",
}: StatsCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-in sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate sm:text-sm">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-card-foreground sm:mt-2 sm:text-3xl">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "mt-0.5 text-xs font-medium truncate sm:mt-1 sm:text-sm",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2 flex-shrink-0 sm:p-3", iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
});
