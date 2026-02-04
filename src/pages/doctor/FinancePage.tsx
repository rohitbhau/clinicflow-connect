import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, CreditCard, Receipt, ArrowUpRight, ArrowDownRight, Plus, Filter } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function FinancePage() {
  const { transactions, patients, addTransaction, updateTransaction } = useData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  
  // Form state
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");

  // Filter for current doctor (d1)
  const doctorTransactions = transactions.filter((t) => t.doctorId === "d1");
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");

  const filteredTransactions = filter === "all"
    ? doctorTransactions
    : doctorTransactions.filter((t) => t.status === filter);

  const totalRevenue = doctorTransactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = doctorTransactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const refundedAmount = doctorTransactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = doctorPatients.find((p) => p.id === patientId);
    if (patient) {
      addTransaction({
        patientId,
        patientName: patient.name,
        doctorId: "d1",
        type,
        amount: parseFloat(amount),
        status: "completed",
        date: "Today",
      });
      toast({ title: "Transaction added", description: `$${amount} payment recorded.` });
      setDialogOpen(false);
      setPatientId("");
      setType("");
      setAmount("");
    }
  };

  const handleMarkPending = (id: string) => {
    updateTransaction(id, { status: "completed" });
    toast({ title: "Payment completed", description: "Transaction marked as completed." });
  };

  const handleRefund = (id: string) => {
    updateTransaction(id, { status: "refunded" });
    toast({ title: "Refund processed", description: "Transaction has been refunded.", variant: "destructive" });
  };

  return (
    <DashboardLayout type="doctor" title="Finance" subtitle="Track your clinic's financial performance">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="All time"
          changeType="positive"
          icon={DollarSign}
          iconColor="success"
        />
        <StatsCard
          title="This Month"
          value={`$${Math.floor(totalRevenue * 0.3).toLocaleString()}`}
          change="+12% vs last month"
          changeType="positive"
          icon={TrendingUp}
          iconColor="info"
        />
        <StatsCard
          title="Pending"
          value={`$${pendingAmount.toLocaleString()}`}
          change={`${doctorTransactions.filter((t) => t.status === "pending").length} invoices`}
          changeType="neutral"
          icon={CreditCard}
          iconColor="warning"
        />
        <StatsCard
          title="Refunded"
          value={`$${refundedAmount.toLocaleString()}`}
          change="Total refunds"
          changeType="neutral"
          icon={Receipt}
          iconColor="primary"
        />
      </div>

      {/* Transactions Table */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Transactions
            </CardTitle>
            <CardDescription>Your payment activities</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gradient-primary gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((tx, index) => (
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
                    <h4 className="font-medium text-card-foreground">{tx.patientName}</h4>
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
                  {tx.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkPending(tx.id)}>
                      Mark Paid
                    </Button>
                  )}
                  {tx.status === "completed" && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRefund(tx.id)}>
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No transactions found</h3>
              <p className="text-muted-foreground">
                {filter !== "all" ? "Try adjusting your filter" : "Add your first payment"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Add a new payment transaction</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {doctorPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Service Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Lab Test">Lab Test</SelectItem>
                  <SelectItem value="ECG Test">ECG Test</SelectItem>
                  <SelectItem value="General Checkup">General Checkup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
