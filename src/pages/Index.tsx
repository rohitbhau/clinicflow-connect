import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Building2, ArrowRight, Calendar, Users, Shield, Zap, UserCog, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const FeatureCard = memo(function FeatureCard({ 
  feature, 
  index 
}: { 
  feature: { icon: any; title: string; description: string; color: string }; 
  index: number; 
}) {
  const Icon = feature.icon;
  return (
    <Card
      className="shadow-card hover:shadow-card-hover transition-all animate-slide-up group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-4 sm:pt-6">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-${feature.color}/10 mb-3 group-hover:scale-110 transition-transform sm:h-12 sm:w-12 sm:mb-4`}>
          <Icon className={`h-5 w-5 text-${feature.color} sm:h-6 sm:w-6`} />
        </div>
        <h3 className="font-display text-base font-semibold text-card-foreground mb-1 sm:text-lg sm:mb-2">
          {feature.title}
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {feature.description}
        </p>
      </CardContent>
    </Card>
  );
});

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Real-time appointment management with QR code booking",
      color: "primary",
    },
    {
      icon: Users,
      title: "Patient Records",
      description: "Comprehensive patient profiles and medical history",
      color: "success",
    },
    {
      icon: UserCog,
      title: "Staff Management",
      description: "Manage your clinic staff efficiently",
      color: "info",
    },
    {
      icon: Building2,
      title: "Multi-Clinic",
      description: "Support for multiple clinics and locations",
      color: "warning",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "HIPAA-compliant data protection",
      color: "accent",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Instant notifications and live dashboard",
      color: "primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-4 py-3 max-w-7xl mx-auto sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary sm:h-10 sm:w-10">
              <Stethoscope className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
            </div>
            <span className="font-display text-lg font-bold text-foreground sm:text-xl">ClinicMG</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden items-center gap-3 sm:flex sm:gap-4">
            <Link to="/login?role=doctor">
              <Button variant="ghost" size="sm" className="text-sm">Doctor Login</Button>
            </Link>
            <Link to="/login?role=admin">
              <Button variant="ghost" size="sm" className="text-sm">Admin Login</Button>
            </Link>
          </div>
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 pt-8">
                <Link to="/login?role=doctor" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2 h-12">
                    <Stethoscope className="h-5 w-5" />
                    Doctor Login
                  </Button>
                </Link>
                <Link to="/login?role=admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2 h-12">
                    <Building2 className="h-5 w-5" />
                    Admin Login
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 text-center sm:px-6 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4 animate-fade-in sm:px-4 sm:py-1.5 sm:text-sm sm:mb-6">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Modern Clinic Management
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4 animate-slide-up sm:text-4xl md:text-6xl sm:mb-6">
            Streamline Your
            <span className="text-primary"> Healthcare</span>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Practice
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6 animate-slide-up sm:text-lg sm:mb-10" style={{ animationDelay: "100ms" }}>
            Complete clinic management solution with real-time appointments,
            patient records, staff management, and powerful analytics.
          </p>
          <div className="flex flex-col gap-3 animate-slide-up sm:flex-row sm:items-center sm:justify-center sm:gap-4" style={{ animationDelay: "200ms" }}>
            <Link to="/login?role=doctor" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary gap-2 h-12 w-full text-base font-semibold sm:w-auto sm:px-8 touch-target">
                Doctor Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login?role=admin" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 h-12 w-full text-base font-semibold sm:w-auto sm:px-8 touch-target">
                Admin Panel
                <Building2 className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-12 px-4 sm:py-20 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2 sm:text-3xl sm:mb-4">
              Everything You Need
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto sm:text-base">
              Powerful features designed for modern healthcare practices
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-primary/5 sm:py-20 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3 sm:text-3xl sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm text-muted-foreground mb-6 sm:text-base sm:mb-8">
            Join hundreds of healthcare providers already using ClinicMG
          </p>
          <Link to="/login?role=doctor">
            <Button size="lg" className="gradient-primary gap-2 h-12 px-6 text-base font-semibold sm:px-8">
              Access Doctor Portal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:py-8 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary sm:h-8 sm:w-8">
              <Stethoscope className="h-3.5 w-3.5 text-primary-foreground sm:h-4 sm:w-4" />
            </div>
            <span className="font-display font-semibold text-foreground text-sm sm:text-base">ClinicMG</span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            © 2026 ClinicMG. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
