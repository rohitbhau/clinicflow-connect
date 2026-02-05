import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  type?: "doctor" | "admin";
  onSearch?: (query: string) => void;
}

export function DashboardLayout({ children, title = "Dashboard", subtitle, type = "doctor", onSearch }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar type={type} />
      <div className="pl-64">
        <DashboardHeader title={title} subtitle={subtitle} onSearch={onSearch} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
