import { memo } from "react";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuickActionsProps {
  onNewAppointment: () => void;
}

export const QuickActions = memo(function QuickActions({ onNewAppointment }: QuickActionsProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card sm:p-6">
      <h3 className="font-display text-base font-semibold text-card-foreground mb-3 sm:text-lg sm:mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-3 hover:border-primary hover:bg-primary/5 touch-target sm:gap-2 sm:py-4"
          onClick={onNewAppointment}
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-[10px] font-medium sm:text-xs">New Appointment</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-3 hover:border-primary hover:bg-primary/5 touch-target sm:gap-2 sm:py-4"
          asChild
        >
          <Link to="/doctor/share">
            <QrCode className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium sm:text-xs">Share QR</span>
          </Link>
        </Button>
      </div>
    </div>
  );
});
