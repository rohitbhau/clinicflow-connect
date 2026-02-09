import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, CreditCard, Receipt, ArrowUpRight, ArrowDownRight, Plus, Filter } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";

export default function FinancePage() {
  const { transactions, patients, addTransaction, updateTransaction } = useData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");

  const doctorTransactions = transactions.filter((t) => t.doctorId === "d1");
  const doctorPatients = patients.filter((p) => p.doctorId === "d1");
  const filteredTransactions = filter === "all" ? doctorTransactions : doctorTransactions.filter((t) => t.status === filter);

  const totalRevenue = doctorTransactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingAmount = doctorTransactions.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
  const refundedAmount = doctorTransactions.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = doctorPatients.find((p) => p.id === patientId);
    if (patient) {
      addTransaction({ patientId, patientName: patient.name, doctorId: "d1", type, amount: parseFloat(amount), status: "completed", date: "Today" });
      toast({ title: "Payment recorded" });
      setDialogOpen(false); setPatientId(""); setType(""); setAmount("");
    }
  };

  return (
    <DashboardLayout type="doctor" title="Finance" subtitle="Revenue tracking">
      {/* Stats */}
      <div className="mb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {[
            { title: "Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "All time", type: "positive" as const, icon: DollarSign, color: "success" as const },
            { title: "This Month", value: `$${Math.floor(totalRevenue * 0.3).toLocaleString()}`, change: "+12%", type: "positive" as const, icon: TrendingUp, color: "info" as const },
            { title: "Pending", value: `$${pendingAmount.toLocaleString()}`, change: `${doctorTransactions.filter(t => t.status === "pending").length} invoices`, type: "neutral" as const, icon: CreditCard, color: "warning" as const },
            { title: "Refunded", value: `$${refundedAmount.toLocaleString()}`, change: "Total", type: "neutral" as const, icon: Receipt, color: "primary" as const },
          ].map((s) => (
            <div key={s.title} className="flex-shrink-0 w-[155px] sm:w-auto">
              <StatsCard title={s.title} value={s.value} change={s.change} changeType={s.type} icon={s.icon} iconColor={s.color} />
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-primary" />
            Transactions
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-28 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gradient-primary gap-1.5 h-9 text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {!isMobile && "Add"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="space-y-2">
            {filteredTransactions.map((tx, i) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-border p-3 animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  tx.status === "completed" ? "bg-success/10" : tx.status === "pending" ? "bg-warning/10" : "bg-destructive/10"
                }`}>
                  {tx.status === "completed" ? <ArrowUpRight className="h-4 w-4 text-success" /> :
                   tx.status === "refunded" ? <ArrowDownRight className="h-4 w-4 text-destructive" /> :
                   <CreditCard className="h-4 w-4 text-warning" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium truncate">{tx.patientName}</h4>
                  <p className="text-xs text-muted-foreground">{tx.type} • {tx.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-semibold ${tx.status === "refunded" ? "text-destructive" : "text-foreground"}`}>
                    {tx.status === "refunded" ? "-" : "+"}${tx.amount}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${
                    tx.status === "completed" ? "bg-success/10 text-success border-success/20" :
                    tx.status === "pending" ? "bg-warning/10 text-warning border-warning/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {filteredTransactions.length === 0 && (
            <EmptyState icon={Receipt} title="No transactions" description={filter !== "all" ? "Try adjusting your filter" : "Add your first payment"} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Add a new transaction</DialogDescription></DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{doctorPatients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Service</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {["Consultation", "Follow-up", "Lab Test", "ECG Test", "General Checkup"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Amount ($)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150" min="0" step="0.01" required className="h-11 text-base" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary">Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
