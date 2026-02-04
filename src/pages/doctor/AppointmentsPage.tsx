import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <DashboardLayout
      type="doctor"
      title="Appointments"
      subtitle="Manage all your patient appointments"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Appointments"
          value={12}
          change="5 remaining"
          changeType="neutral"
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="In Progress"
          value={1}
          change="Started 10 min ago"
          changeType="neutral"
          icon={Clock}
          iconColor="warning"
        />
        <StatsCard
          title="Completed"
          value={7}
          change="Today"
          changeType="positive"
          icon={CheckCircle}
          iconColor="success"
        />
        <StatsCard
          title="Cancelled"
          value={0}
          change="No cancellations"
          changeType="positive"
          icon={XCircle}
          iconColor="info"
        />
      </div>

      {/* Appointments List */}
      <AppointmentsList />
    </DashboardLayout>
  );
}
