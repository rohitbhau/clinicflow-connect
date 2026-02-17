import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Mail, Stethoscope, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

const ForgotPassword = memo(function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      setEmailSent(true);
      toast.success("Reset link sent", {
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || "Something went wrong. Please try again.";
      toast.error("Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4 safe-area-inset">
      <div className="mb-6 flex flex-col items-center md:mb-8">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg md:h-16 md:w-16">
          <Stethoscope className="h-7 w-7 text-primary-foreground md:h-8 md:w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">ClinicMG</h1>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl md:max-w-md md:border md:shadow-lg">
        {emailSent ? (
          <>
            <CardHeader className="space-y-1 pb-4 pt-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Check your email</CardTitle>
              <CardDescription className="text-sm">
                We've sent a password reset link to{" "}
                <span className="font-medium text-foreground">{getValues("email")}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-center text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button variant="outline" className="h-11 w-full" onClick={() => setEmailSent(false)}>
                Try another email
              </Button>
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
                Back to Login
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-4 pt-6 text-center">
              <CardTitle className="text-xl font-bold">Forgot password?</CardTitle>
              <CardDescription className="text-sm">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                    className={`h-12 text-base ${errors.email ? "border-destructive" : ""}`}
                    autoComplete="email"
                    inputMode="email"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button className="h-12 w-full text-base font-semibold" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </>
        )}
      </Card>

      <p className="mt-6 text-xs text-muted-foreground/60">Version 1.0.0</p>
    </div>
  );
});

export default ForgotPassword;
