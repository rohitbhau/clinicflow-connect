import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  Building2,
  Activity,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const doctorNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/doctor" },
  { label: "Appointments", icon: Calendar, href: "/doctor/appointments" },
  { label: "QR & Link", icon: QrCode, href: "/doctor/share" },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Hospitals", icon: Building2, href: "/admin/hospitals" },
  { label: "Doctors", icon: Stethoscope, href: "/admin/doctors" },
  { label: "Patients", icon: Users, href: "/admin/patients" },
  { label: "Activity", icon: Activity, href: "/admin/activity" },
];

interface DashboardSidebarProps {
  type: "doctor" | "admin";
}

export const DashboardSidebar = memo(function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const navItems = type === "doctor" ? doctorNavItems : adminNavItems;

  // Get user from localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
    return null;
  };

  const user = getUserFromStorage();
  const userName = user?.name || (type === "doctor" ? "Dr. John Smith" : "Admin User");
  const userRole = type === "doctor" ? user?.hospitalName || "Doctor" : "Super Admin";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar border-r border-sidebar-border hidden md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-accent-foreground">
              ClinicMG
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              {type === "doctor" ? "Doctor Portal" : "Admin Panel"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/20 flex-shrink-0">
              <Users className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {userRole}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
});
