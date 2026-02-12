import { useState, memo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, LogIn, Stethoscope } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = memo(function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);

      const { token, user } = response.data.data;

      // Store auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Login successful", {
        description: `Welcome back!`,
      });

      // Redirect based on role
      if (user.role === "superadmin") {
        navigate("/superadmin");
      } else if (user.role === "doctor" || user.role === "staff") {
        navigate("/doctor");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error?.message || "Something went wrong. Please try again.";
      toast.error("Login failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4 safe-area-inset">
      {/* Mobile App Header */}
      <div className="mb-6 flex flex-col items-center md:mb-8">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg md:h-16 md:w-16">
          <Stethoscope className="h-7 w-7 text-primary-foreground md:h-8 md:w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">ClinicMG</h1>
        <p className="text-sm text-muted-foreground">Healthcare Management</p>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl md:max-w-md md:border md:shadow-lg">
        <CardHeader className="space-y-1 pb-4 pt-6 text-center md:pb-6">
          <CardTitle className="text-xl font-bold md:text-2xl">
            {role === "doctor" ? "Doctor Login" : role === "admin" ? "Admin Login" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-sm">
            {role === "doctor"
              ? "Sign in to access your dashboard"
              : role === "admin"
                ? "Sign in to access admin panel"
                : "Enter your credentials to continue"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                {...register("email")}
                className={`h-12 text-base ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`h-12 pr-12 text-base ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button
              className="h-12 w-full text-base font-semibold"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-6 text-center text-sm">
          <div className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>

      {/* App Version / Footer */}
      <p className="mt-6 text-xs text-muted-foreground/60">Version 1.0.0</p>
    </div>
  );
});

export default Login;
