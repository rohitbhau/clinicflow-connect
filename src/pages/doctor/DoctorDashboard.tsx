import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";

export default function DoctorDashboard() {
  return (
    <DashboardLayout
      type="doctor"
      title="Welcome back, Dr. Smith"
      subtitle="Here's what's happening with your clinic today"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Appointments"
          value={12}
          change="+3 from yesterday"
          changeType="positive"
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="Total Patients"
          value={248}
          change="+12 this month"
          changeType="positive"
          icon={Users}
          iconColor="success"
        />
        <StatsCard
          title="Pending"
          value={5}
          change="2 urgent"
          changeType="neutral"
          icon={Clock}
          iconColor="warning"
        />
        <StatsCard
          title="Revenue (Today)"
          value="$2,450"
          change="+18% vs avg"
          changeType="positive"
          icon={DollarSign}
          iconColor="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsList />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
}
