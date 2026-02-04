import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, UserCog, Building2, ArrowRight, Calendar, Users, Shield, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">ClinicMG</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/doctor">
              <Button variant="ghost">Doctor Login</Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost">Admin Login</Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
            <Zap className="h-4 w-4" />
            Modern Clinic Management
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
            Streamline Your
            <span className="text-primary"> Healthcare</span>
            <br />Practice
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            Complete clinic management solution with real-time appointments, 
            patient records, staff management, and powerful analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Link to="/doctor">
              <Button size="lg" className="gradient-primary gap-2 h-12 px-8 text-base font-semibold">
                Doctor Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base font-semibold">
                Admin Panel
                <Building2 className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful features designed for modern healthcare practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="shadow-card hover:shadow-card-hover transition-all animate-slide-up group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}/10 mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of healthcare providers already using ClinicMG
          </p>
          <Link to="/doctor">
            <Button size="lg" className="gradient-primary gap-2 h-12 px-8 text-base font-semibold">
              Access Doctor Portal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">ClinicMG</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 ClinicMG. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
