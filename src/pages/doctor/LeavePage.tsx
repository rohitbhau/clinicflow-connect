import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
    CalendarOff,
    Plus,
    Trash2,
    Clock,
    CalendarX2,
    AlertCircle,
    X,
    CalendarDays,
} from "lucide-react";

const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

interface LeaveEntry {
    _id: string;
    date: string;
    type: "full-day" | "slot";
    blockedSlots: string[];
    reason: string;
}

export default function LeavePage() {
    const { toast } = useToast();
    const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveType, setLeaveType] = useState<"full-day" | "slot">("full-day");
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [reason, setReason] = useState("");

    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/leaves");
            if (res.data.success) {
                setLeaves(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch leaves", error);
            toast({ title: "Error", description: "Failed to fetch leaves", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const toggleSlot = (slot: string) => {
        setSelectedSlots((prev) =>
            prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
        );
    };

    const handleAddLeave = async () => {
        if (!leaveDate) {
            toast({ title: "Please select a date", variant: "destructive" });
            return;
        }
        if (leaveType === "slot" && selectedSlots.length === 0) {
            toast({ title: "Please select at least one slot to block", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.post("/leaves", {
                date: leaveDate,
                type: leaveType,
                blockedSlots: leaveType === "slot" ? selectedSlots : [],
                reason,
            });
            toast({ title: "Leave added", description: "Availability updated successfully." });
            setLeaveDate("");
            setLeaveType("full-day");
            setSelectedSlots([]);
            setReason("");
            fetchLeaves();
        } catch (error: any) {
            toast({
                title: "Failed to add leave",
                description: error.response?.data?.error?.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLeave = async (id: string) => {
        try {
            await api.delete(`/leaves/${id}`);
            toast({ title: "Leave removed", description: "Availability restored." });
            fetchLeaves();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete leave", variant: "destructive" });
        }
    };

    const handleRemoveSlot = async (leaveId: string, slot: string) => {
        try {
            await api.patch(`/leaves/${leaveId}/remove-slot`, { slot });
            toast({ title: "Slot unblocked", description: `Removed block for ${slot}` });
            fetchLeaves();
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove slot", variant: "destructive" });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const today = new Date().toISOString().split("T")[0];

    // Group leaves: upcoming vs past
    const upcomingLeaves = leaves.filter((l) => new Date(l.date) >= new Date(today));
    const pastLeaves = leaves.filter((l) => new Date(l.date) < new Date(today));

    return (
        <DashboardLayout type="doctor" title="Leave & Availability" subtitle="Manage Blocked Days">
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Add Leave Card */}
                <Card className="border-primary/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Block Date / Slot
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Date + Type row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Date
                                </Label>
                                <Input
                                    type="date"
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    min={today}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Block Type</Label>
                                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as "full-day" | "slot")}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-day">
                                            <span className="flex items-center gap-2">
                                                <CalendarX2 className="h-4 w-4 text-destructive" />
                                                Full Day Off
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="slot">
                                            <span className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                Specific Slots
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Slot Selection (only for slot type) */}
                        {leaveType === "slot" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Select Slots to Block</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {timeSlots.map((slot) => {
                                        const isSelected = selectedSlots.includes(slot);
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => toggleSlot(slot)}
                                                className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${isSelected
                                                        ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                                                        : "border-border bg-background text-foreground hover:bg-secondary/50 hover:border-primary/30"
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedSlots.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {selectedSlots.length} slot(s) selected
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Reason (Optional)</Label>
                            <Textarea
                                placeholder="e.g., Personal leave, Conference, Emergency..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleAddLeave}
                            disabled={saving}
                            className="w-full h-11 gradient-primary font-semibold"
                        >
                            {saving ? "Saving..." : "Block Date"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Upcoming Leaves */}
                <div className="space-y-3">
                    <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <CalendarOff className="h-4 w-4 text-primary" />
                        Upcoming Blocked Dates
                        {upcomingLeaves.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {upcomingLeaves.length}
                            </span>
                        )}
                    </h2>

                    {loading ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground animate-pulse">
                                Loading...
                            </CardContent>
                        </Card>
                    ) : upcomingLeaves.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <CalendarOff className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">No upcoming blocked dates</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    All slots are available for booking
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {upcomingLeaves.map((leave) => (
                                <Card key={leave._id} className="group hover:shadow-md transition-shadow">
                                    <CardContent className="py-4 flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{formatDate(leave.date)}</span>
                                                {leave.type === "full-day" ? (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                                        Full Day Off
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                                        Slots Blocked
                                                    </span>
                                                )}
                                            </div>

                                            {leave.reason && (
                                                <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                    {leave.reason}
                                                </p>
                                            )}

                                            {/* Blocked slots chips */}
                                            {leave.type === "slot" && leave.blockedSlots.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {leave.blockedSlots.map((slot) => (
                                                        <span
                                                            key={slot}
                                                            className="inline-flex items-center gap-1 text-[11px] bg-destructive/5 border border-destructive/20 text-destructive rounded-md px-2 py-1"
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            {slot}
                                                            <button
                                                                onClick={() => handleRemoveSlot(leave._id, slot)}
                                                                className="hover:bg-destructive/20 rounded-full p-0.5 ml-0.5 transition-colors"
                                                                title="Unblock this slot"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteLeave(leave._id)}
                                            className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                            title="Delete leave"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Leaves (collapsed) */}
                {pastLeaves.length > 0 && (
                    <details className="group">
                        <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors py-2">
                            <CalendarX2 className="h-4 w-4" />
                            Past Blocked Dates ({pastLeaves.length})
                        </summary>
                        <div className="space-y-2 mt-2">
                            {pastLeaves.map((leave) => (
                                <Card key={leave._id} className="opacity-60">
                                    <CardContent className="py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{formatDate(leave.date)}</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                {leave.type === "full-day" ? "Full Day" : `${leave.blockedSlots.length} slot(s)`}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteLeave(leave._id)}
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </DashboardLayout>
    );
}
