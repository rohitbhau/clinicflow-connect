import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, UserPlus, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["patient", "doctor", "admin", "staff"], { required_error: "Please select a role" }),
  hospitalName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role !== "patient" && !data.hospitalName) return false;
  return true;
}, {
  message: "Please enter hospital name",
  path: ["hospitalName"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: "patient" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await api.post("/auth/register", registerData);
      toast.success("Registration successful", { description: "Your account has been created. Please log in." });
      navigate("/login");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || "Something went wrong. Please try again.";
      toast.error("Registration failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4 safe-area-inset">
      <div className="mb-5 flex flex-col items-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <Stethoscope className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Create Account</h1>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl md:max-w-md md:border md:shadow-lg">
        <CardHeader className="pb-3 pt-5 text-center">
          <CardTitle className="text-lg">Sign Up</CardTitle>
          <CardDescription className="text-sm">Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register("name")}
                className={`h-11 text-base ${errors.name ? "border-destructive" : ""}`}
                autoComplete="name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...register("email")}
                className={`h-11 text-base ${errors.email ? "border-destructive" : ""}`}
                autoComplete="email" inputMode="email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">I am a</Label>
              <Select onValueChange={(v) => { setValue("role", v as any); if (v === "patient") setValue("hospitalName", ""); }} defaultValue={selectedRole}>
                <SelectTrigger className={`h-11 ${errors.role ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            {selectedRole !== "patient" && (
              <div className="space-y-1.5">
                <Label htmlFor="hospitalName" className="text-sm">Hospital Name</Label>
                <Input id="hospitalName" placeholder="Enter hospital/clinic name" {...register("hospitalName")}
                  className={`h-11 text-base ${errors.hospitalName ? "border-destructive" : ""}`} />
                {errors.hospitalName && <p className="text-xs text-destructive">{errors.hospitalName.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  {...register("password")}
                  className={`h-11 pr-11 text-base ${errors.password ? "border-destructive" : ""}`}
                  autoComplete="new-password" />
                <Button type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1 h-9 w-9"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")}
                className={`h-11 text-base ${errors.confirmPassword ? "border-destructive" : ""}`}
                autoComplete="new-password" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button className="h-12 w-full text-base font-semibold" type="submit" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating account...</>
              ) : (
                <><UserPlus className="mr-2 h-5 w-5" />Create Account</>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-5 text-center text-sm">
          <div className="w-full text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
