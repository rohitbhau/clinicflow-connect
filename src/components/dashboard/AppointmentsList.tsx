import { AppointmentCard, Appointment } from "./AppointmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle } from "lucide-react";

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    patientPhone: "+1 234-567-8901",
    time: "09:00 AM",
    type: "General Checkup",
    status: "in-progress",
  },
  {
    id: "2",
    patientName: "Michael Chen",
    patientPhone: "+1 234-567-8902",
    time: "09:30 AM",
    type: "Follow-up Visit",
    status: "scheduled",
  },
  {
    id: "3",
    patientName: "Emily Davis",
    patientPhone: "+1 234-567-8903",
    time: "10:00 AM",
    type: "Consultation",
    status: "scheduled",
  },
  {
    id: "4",
    patientName: "Robert Wilson",
    patientPhone: "+1 234-567-8904",
    time: "08:30 AM",
    type: "ECG Test",
    status: "completed",
  },
  {
    id: "5",
    patientName: "Lisa Brown",
    patientPhone: "+1 234-567-8905",
    time: "08:00 AM",
    type: "Blood Pressure Check",
    status: "completed",
  },
];

export function AppointmentsList() {
  const incoming = mockAppointments.filter(
    (a) => a.status === "scheduled" || a.status === "in-progress"
  );
  const completed = mockAppointments.filter((a) => a.status === "completed");

  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <Tabs defaultValue="today" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-card-foreground">
            Appointments
          </h3>
          <TabsList className="bg-secondary">
            <TabsTrigger value="today" className="gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="incoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Incoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="space-y-3 mt-0">
          {mockAppointments.map((appointment, index) => (
            <AppointmentCard key={appointment.id} appointment={appointment} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-3 mt-0">
          {incoming.map((appointment, index) => (
            <AppointmentCard key={appointment.id} appointment={appointment} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-0">
          {completed.map((appointment, index) => (
            <AppointmentCard key={appointment.id} appointment={appointment} index={index} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
