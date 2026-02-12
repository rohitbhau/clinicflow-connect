import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Building2,
  Stethoscope,
  Users,
  Activity,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const doctorNavItems: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, href: "/doctor" },
  { label: "Appointments", icon: Calendar, href: "/doctor/appointments" },
  { label: "Share", icon: QrCode, href: "/doctor/share" },
  { label: "Patients", icon: Users, href: "/doctor/patients" },
  { label: "Profile", icon: User, href: "/profile" },
];

const adminNavItems: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, href: "/admin" },
  { label: "Hospitals", icon: Building2, href: "/admin/hospitals" },
  { label: "Doctors", icon: Stethoscope, href: "/admin/doctors" },
  { label: "Patients", icon: Users, href: "/admin/patients" },
  { label: "Activity", icon: Activity, href: "/admin/activity" },
];

const superAdminNavItems: NavItem[] = [
  { label: "Home", icon: LayoutDashboard, href: "/superadmin" },
  { label: "Hospitals", icon: Building2, href: "/superadmin/hospitals" },
  { label: "Users", icon: Users, href: "/superadmin/users" },
];

interface MobileBottomNavProps {
  type: "doctor" | "admin" | "superadmin";
}

export const MobileBottomNav = memo(function MobileBottomNav({ type }: MobileBottomNavProps) {
  const location = useLocation();
  const navItems = type === "doctor" ? doctorNavItems : type === "admin" ? adminNavItems : superAdminNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/98 backdrop-blur-lg md:hidden">
      <div className="flex items-stretch safe-area-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/doctor" && item.href !== "/admin" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-primary" />
              )}
              <item.icon className={cn("h-5 w-5", isActive && "scale-105")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
