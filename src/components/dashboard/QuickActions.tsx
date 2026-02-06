import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuickActionsProps {
  onNewAppointment: () => void;
}

export function QuickActions({ onNewAppointment }: QuickActionsProps) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-card-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4 hover:border-primary hover:bg-primary/5"
          onClick={onNewAppointment}
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-xs">New Appointment</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4 hover:border-primary hover:bg-primary/5"
          asChild
        >
          <Link to="/doctor/share">
            <QrCode className="h-5 w-5 text-primary" />
            <span className="text-xs">Share QR</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
