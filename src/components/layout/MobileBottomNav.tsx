import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Building2,
  Stethoscope,
  Users,
  Activity,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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

interface MobileBottomNavProps {
  type: "doctor" | "admin";
}

export function MobileBottomNav({ type }: MobileBottomNavProps) {
  const location = useLocation();
  const allNavItems = type === "doctor" ? doctorNavItems : adminNavItems;
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Show max 4 items in bottom nav, rest in "more" menu
  const visibleItems = allNavItems.slice(0, 3);
  const moreItems = allNavItems.slice(3);
  const showMore = moreItems.length > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 px-3 transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
        
        {showMore && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 px-3 transition-all duration-200",
                  moreItems.some(item => location.pathname === item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8 rounded-t-3xl">
              <div className="grid grid-cols-3 gap-4 pt-4">
                {moreItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl p-4 transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
