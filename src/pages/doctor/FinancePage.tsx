import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, CreditCard, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";

const transactions = [
  { id: 1, patient: "Sarah Johnson", type: "Consultation", amount: 150, status: "completed", date: "Today" },
  { id: 2, patient: "Michael Chen", type: "Lab Test", amount: 85, status: "completed", date: "Today" },
  { id: 3, patient: "Emily Davis", type: "Follow-up", amount: 75, status: "pending", date: "Yesterday" },
  { id: 4, patient: "Robert Wilson", type: "ECG Test", amount: 120, status: "completed", date: "Yesterday" },
  { id: 5, patient: "Lisa Brown", type: "General Checkup", amount: 100, status: "refunded", date: "2 days ago" },
];

export default function FinancePage() {
  return (
    <DashboardLayout
      type="doctor"
      title="Finance"
      subtitle="Track your clinic's financial performance"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Revenue"
          value="$2,450"
          change="+18% vs yesterday"
          changeType="positive"
          icon={DollarSign}
          iconColor="success"
        />
        <StatsCard
          title="Monthly Revenue"
          value="$48,250"
          change="+12% vs last month"
          changeType="positive"
          icon={TrendingUp}
          iconColor="info"
        />
        <StatsCard
          title="Pending Payments"
          value="$1,250"
          change="8 invoices"
          changeType="neutral"
          icon={CreditCard}
          iconColor="warning"
        />
        <StatsCard
          title="Total Transactions"
          value="156"
          change="This month"
          changeType="neutral"
          icon={Receipt}
          iconColor="primary"
        />
      </div>

      {/* Transactions Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest payment activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    tx.status === "completed" ? "bg-success/10" : 
                    tx.status === "pending" ? "bg-warning/10" : "bg-destructive/10"
                  }`}>
                    {tx.status === "completed" ? (
                      <ArrowUpRight className="h-5 w-5 text-success" />
                    ) : tx.status === "refunded" ? (
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">{tx.patient}</h4>
                    <p className="text-sm text-muted-foreground">{tx.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{tx.date}</span>
                  <span className={`font-semibold ${
                    tx.status === "refunded" ? "text-destructive" : "text-card-foreground"
                  }`}>
                    {tx.status === "refunded" ? "-" : "+"}${tx.amount}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      tx.status === "completed" ? "bg-success/10 text-success border-success/20" :
                      tx.status === "pending" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
