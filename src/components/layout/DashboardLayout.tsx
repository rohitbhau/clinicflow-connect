import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  type: "doctor" | "admin" | "superadmin";
  onSearch?: (query: string) => void;
}

export function DashboardLayout({ children, title, subtitle, type, onSearch }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && <DashboardSidebar type={type} />}

      <div className={isMobile ? "pb-20" : "pl-64"}>
        <DashboardHeader title={title} subtitle={subtitle} onSearch={onSearch} isMobile={isMobile} />
        <main className={isMobile ? "p-4" : "p-6"}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav type={type} />}
    </div>
  );
}
