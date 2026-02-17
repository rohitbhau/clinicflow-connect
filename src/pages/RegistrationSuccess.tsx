import { memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Stethoscope, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const RegistrationSuccess = memo(function RegistrationSuccess() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "doctor";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4 safe-area-inset">
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <Stethoscope className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">ClinicMG</h1>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl md:max-w-md md:border md:shadow-lg">
        <CardHeader className="pt-8 pb-2 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Registration Successful! 🎉</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has been created successfully. You can now sign in to access your dashboard.
          </p>
        </CardHeader>
        <CardContent className="pb-8 pt-4 space-y-4">
          <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">What's next?</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {role === "doctor" ? (
                <>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Set up your clinic profile</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Configure appointment slots</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Share your booking link with patients</li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Add your hospital details</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Onboard doctors to your hospital</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />Start managing appointments</li>
                </>
              )}
            </ul>
          </div>

          <Link to="/login" className="block">
            <Button className="h-12 w-full text-base font-semibold gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground/60">Version 1.0.0</p>
    </div>
  );
});

export default RegistrationSuccess;
