import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, UserPlus, Stethoscope, Building2, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Schema for Step 1: Hospital & Doctors
const step1Schema = z.object({
  hospitalName: z.string().min(2, "Hospital name is required"),
  hospitalEmail: z.string().email("Invalid email"),
  hospitalPhone: z.string().min(10, "Phone number required"),
  doctors: z.array(z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Invalid email"),
    specialization: z.string().min(2, "Specialization required"),
    qualification: z.string().min(2, "Qualification required"),
  })).min(1, "At least one doctor is required"),
});

// Schema for Step 2: Staff
const step2Schema = z.object({
  staff: z.array(z.object({
    name: z.string().min(2, "Name required"),
    email: z.string().email("Invalid email"),
    role: z.string().min(2, "Role required"),
  })).optional(),
});

// Schema for Step 3: Password
const step3Schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<any[] | null>(null);

  // Forms for each step
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      doctors: [{ name: "", email: "", specialization: "", qualification: "" }]
    }
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      staff: []
    }
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  // Field Arrays
  const { fields: doctorFields, append: appendDoctor, remove: removeDoctor } = useFieldArray({
    control: form1.control,
    name: "doctors"
  });

  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: form2.control,
    name: "staff"
  });

  const onStep1Submit = (data: Step1Data) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const onStep2Submit = (data: Step2Data) => {
    setFormData({ ...formData, ...data });
    setStep(3);
  };

  const onFinalSubmit = async (data: Step3Data) => {
    setIsLoading(true);
    try {
      const finalPayload = {
        role: 'admin', // Registering as Hospital Admin
        name: formData.hospitalName + " Admin",
        email: formData.hospitalEmail,
        password: data.password,
        hospitalName: formData.hospitalName,
        hospitalPhone: formData.hospitalPhone,
        doctors: formData.doctors,
        staff: formData.staff,
      };

      const response = await api.post("/auth/register", finalPayload);

      if (response.data?.data?.generatedCredentials) {
        setGeneratedCredentials(response.data.data.generatedCredentials);
        toast.success("Registration Successful!");
      } else {
        toast.success("Registration Successful!");
        navigate("/login");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedCredentials) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-success flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Registration Complete!
            </CardTitle>
            <CardDescription>
              Please save these auto-generated credentials for your team. You won't see them again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <strong>Important:</strong> Copy these credentials and share them with your team securely.
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Doctors</h3>
              {generatedCredentials.filter(c => c.role === 'doctor').map((cred, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                  <div>
                    <p className="font-medium">{cred.name}</p>
                    <p className="text-xs text-muted-foreground">{cred.email}</p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded font-mono text-sm select-all">
                    {cred.password}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Staff</h3>
              {generatedCredentials.filter(c => c.role === 'staff').map((cred, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                  <div>
                    <p className="font-medium">{cred.name}</p>
                    <p className="text-xs text-muted-foreground">{cred.email}</p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded font-mono text-sm select-all">
                    {cred.password}
                  </div>
                </div>
              ))}
              {generatedCredentials.filter(c => c.role === 'staff').length === 0 && (
                <p className="text-sm text-muted-foreground italic">No staff accounts created.</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4 safe-area-inset">
      <div className="mb-5 flex flex-col items-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Clinic Registration</h1>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-8 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-xl border-0 shadow-xl md:border md:shadow-lg">
        <CardHeader className="pb-3 text-center">
          <CardTitle className="text-lg">
            {step === 1 && "Hospital Details & Doctors"}
            {step === 2 && "Add Staff Details"}
            {step === 3 && "Setup Admin Password"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter clinic info and add your doctors"}
            {step === 2 && "Add nurses, receptionists, or other staff"}
            {step === 3 && "Create a secure password for the main account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">

          {step === 1 && (
            <form id="step1-form" onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-3">
                <Label>Hospital Info</Label>
                <Input placeholder="Hospital/Clinic Name" {...form1.register("hospitalName")} />
                {form1.formState.errors.hospitalName && <p className="text-xs text-destructive">{form1.formState.errors.hospitalName.message}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Official Email" {...form1.register("hospitalEmail")} />
                  <Input placeholder="Phone Number" {...form1.register("hospitalPhone")} />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Doctors List</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendDoctor({ name: "", email: "", specialization: "", qualification: "" })}>
                    <UserPlus className="h-3 w-3 mr-1" /> Add Doctor
                  </Button>
                </div>
                <div className="space-y-3">
                  {doctorFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/10 relative">
                      {index > 0 && (
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive" onClick={() => removeDoctor(index)}>
                          <ArrowLeft className="h-3 w-3 rotate-45" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Doctor Name" {...form1.register(`doctors.${index}.name`)} />
                        <Input placeholder="Email" {...form1.register(`doctors.${index}.email`)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Specialization" {...form1.register(`doctors.${index}.specialization`)} />
                        <Input placeholder="Qualification" {...form1.register(`doctors.${index}.qualification`)} />
                      </div>
                    </div>
                  ))}
                  {form1.formState.errors.doctors?.root && <p className="text-xs text-destructive">{form1.formState.errors.doctors.root.message}</p>}
                </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <form id="step2-form" onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Staff Members</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendStaff({ name: "", email: "", role: "Nurse" })}>
                  <UserPlus className="h-3 w-3 mr-1" /> Add Staff
                </Button>
              </div>

              {staffFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  No staff members added. You can skip this step if not needed.
                </div>
              )}

              <div className="space-y-3">
                {staffFields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-md flex gap-2 items-start bg-muted/10">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <Input placeholder="Name" {...form2.register(`staff.${index}.name`)} />
                      <Input placeholder="Email" {...form2.register(`staff.${index}.email`)} />
                      <Input placeholder="Role (e.g. Nurse)" {...form2.register(`staff.${index}.role`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeStaff(index)}>
                      <ArrowLeft className="h-4 w-4 rotate-45" />
                    </Button>
                  </div>
                ))}
              </div>
            </form>
          )}

          {step === 3 && (
            <form id="step3-form" onSubmit={form3.handleSubmit(onFinalSubmit)} className="space-y-4">
              <div className="space-y-3">
                <Label>Set Admin Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...form3.register("password")} className="pr-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form3.formState.errors.password && <p className="text-xs text-destructive">{form3.formState.errors.password.message}</p>}

                <Label>Confirm Password</Label>
                <Input type="password" placeholder="••••••••" {...form3.register("confirmPassword")} />
                {form3.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form3.formState.errors.confirmPassword.message}</p>}

                <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md">
                  This password will be used to log in to the <strong>Hospital Admin Dashboard</strong> using the email <strong>{formData.hospitalEmail}</strong>.
                </div>
              </div>
            </form>
          )}

        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {step === 1 ? (
            <Link to="/login">
              <Button variant="ghost">Cancel</Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          )}

          {step === 1 && (
            <Button type="submit" form="step1-form">Next: Staff <ArrowRight className="ml-2 h-4 w-4" /></Button>
          )}
          {step === 2 && (
            <Button type="submit" form="step2-form">Next: Password <ArrowRight className="ml-2 h-4 w-4" /></Button>
          )}
          {step === 3 && (
            <Button type="submit" form="step3-form" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Complete Registration"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
