import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const appointmentSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  appointmentType: z.string().min(1, "Please select appointment type"),
  notes: z.string().max(500).optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

const appointmentTypes = [
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up Visit" },
  { value: "checkup", label: "General Checkup" },
  { value: "emergency", label: "Emergency" },
];

export default function BookAppointment() {
  const { hospitalSlug } = useParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospital, setHospital] = useState<any>(null);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const { toast } = useToast();
  const [hospitalName, setHospitalName] = useState("");

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientName: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      appointmentType: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Use hospitalSlug (name-based) for the API call
        const response = await api.get(`/hospitals/${hospitalSlug}/doctors`);
        setDoctors(response.data.data.doctors);
        setHospital(response.data.data.hospital);
        setHospitalName(response.data.data.hospital.name);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        toast({
          title: "Error",
          description: "Could not load hospital details.",
          variant: "destructive",
        });
      } finally {
        setFetchingDoctors(false);
      }
    };
    if (hospitalSlug) {
      fetchDoctors();
    }
  }, [hospitalSlug, toast]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // ... (schema update if needed, but not strictly required if we pass doctorId separately)
  // Actually we should add doctorId to schema OR handle it manually. Manual is fine for now.

  const onSubmit = async (data: AppointmentFormData) => {
    if (!selectedDoctorId) {
      toast({ title: "Please select a doctor", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/appointments/book', {
        ...data,
        doctorId: selectedDoctorId,
      });

      setTokenDetails(response.data.data);
      setIsSubmitted(true);
      toast({
        title: "Appointment Booked!",
        description: "You will receive a confirmation shortly.",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.response?.data?.error?.message || "Could not book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-card animate-scale-in">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-card-foreground mb-2">
              Appointment Confirmed!
            </h2>

            <div className="my-6 p-6 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Your Token Number</p>
              <div className="text-4xl md:text-6xl font-black text-primary animate-pulse break-all">
                #{tokenDetails?.tokenNumber || "0"}
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Please present this token number at the reception.
            </p>
            <div className="rounded-lg bg-secondary/50 p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{form.getValues("date")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{form.getValues("time")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{form.getValues("appointmentType")}</span>
              </div>
            </div>
            <Button className="mt-6 gradient-primary" onClick={() => setIsSubmitted(false)}>
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-4">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Book an Appointment
          </h1>
          <p className="text-muted-foreground">
            Schedule your visit with {hospitalName ? `at ${hospitalName}` : "a doctor"}
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle>{hospital?.name || "Book Appointment"}</CardTitle>
            <CardDescription>
              {hospital?.address?.city
                ? `${hospital.address.city}, ${hospital.address.state}`
                : "Fill in the details below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingDoctors ? (
              <div className="flex justify-center p-4">
                <span className="animate-pulse">Loading hospital details...</span>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Doctor Selection */}
                  <div className="space-y-2">
                    <FormLabel>Select Doctor</FormLabel>
                    <Select onValueChange={setSelectedDoctorId} value={selectedDoctorId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doc: any) => (
                          <SelectItem key={doc._id} value={doc._id}>
                            Dr. {doc.firstName} {doc.lastName} - {doc.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedDoctorId && <p className="text-sm text-muted-foreground">Please select a doctor to proceed</p>}
                  </div>

                  {/* Patient Name */}
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 234-567-8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Preferred Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Preferred Time
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Appointment Type */}
                  <FormField
                    control={form.control}
                    name="appointmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select appointment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appointmentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Additional Notes (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any specific concerns or medical conditions..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full gradient-primary h-12 text-base font-semibold">
                    Book Appointment
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
