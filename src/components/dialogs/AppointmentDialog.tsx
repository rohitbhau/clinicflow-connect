import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: {
    id: string;
    patientName: string;
    patientPhone: string;
    time: string;
    date: string;
    type: string;
    status: "scheduled" | "in-progress" | "completed" | "cancelled";
    notes?: string;
  } | null;
  onSave: (data: { patientName: string; patientPhone: string; time: string; date: string; type: string; status: "scheduled" | "in-progress" | "completed" | "cancelled"; notes?: string }) => void;
}

export function AppointmentDialog({ open, onOpenChange, appointment, onSave }: AppointmentDialogProps) {
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState<"scheduled" | "in-progress" | "completed" | "cancelled">("scheduled");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (appointment) {
      setPatientName(appointment.patientName);
      setPatientPhone(appointment.patientPhone);
      setTime(appointment.time);
      setDate(appointment.date);
      setType(appointment.type);
      setStatus(appointment.status);
      setNotes(appointment.notes || "");
    } else {
      setPatientName("");
      setPatientPhone("");
      setTime("");
      setDate(new Date().toISOString().split('T')[0]);
      setType("");
      setStatus("scheduled");
      setNotes("");
    }
  }, [appointment, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ patientName, patientPhone, time, date, type, status, notes: notes || undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          <DialogDescription>
            {appointment ? "Update appointment details" : "Schedule a new appointment"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="patientPhone">Phone</Label>
              <Input
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+1 234-567-8900"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="09:00 AM"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Appointment Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Checkup">General Checkup</SelectItem>
                <SelectItem value="Follow-up Visit">Follow-up Visit</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Lab Test">Lab Test</SelectItem>
                <SelectItem value="ECG Test">ECG Test</SelectItem>
                <SelectItem value="Blood Pressure Check">Blood Pressure Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "scheduled" | "in-progress" | "completed" | "cancelled")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              {appointment ? "Save Changes" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
