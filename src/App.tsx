import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplashScreen from "./pages/SplashScreen";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AppointmentsPage from "./pages/doctor/AppointmentsPage";
import PatientsPage from "./pages/doctor/PatientsPage";
import ReportsPage from "./pages/doctor/ReportsPage";
import FinancePage from "./pages/doctor/FinancePage";
import StaffPage from "./pages/doctor/StaffPage";
import SharePage from "./pages/doctor/SharePage";
import SettingsPage from "./pages/doctor/SettingsPage";
import AttendancePage from "./pages/doctor/AttendancePage";
import LeavePage from "./pages/doctor/LeavePage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHospitalsPage from "./pages/admin/AdminHospitalsPage";
import AdminDoctorsPage from "./pages/admin/AdminDoctorsPage";
import AdminPatientsPage from "./pages/admin/AdminPatientsPage";
import AdminActivityPage from "./pages/admin/AdminActivityPage";
import AdminSharePage from "./pages/admin/AdminSharePage";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminHospitalsPage from "./pages/superadmin/SuperAdminHospitalsPage";

// Public Pages
import BookAppointment from "./pages/BookAppointment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import QueueDisplay from "./pages/QueueDisplay";
import HospitalQueueDisplay from "./pages/HospitalQueueDisplay";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Restore Theme Mode
    const theme = localStorage.getItem("theme") || "light";
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Restore Theme Color
    const themeColor = localStorage.getItem("themeColor") || "default";
    root.classList.remove("theme-blue", "theme-purple", "theme-orange", "theme-red");
    if (themeColor !== "default") {
      root.classList.add(`theme-${themeColor}`);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/home" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Authenticated Routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Doctor Routes */}
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/appointments" element={<AppointmentsPage />} />
              <Route path="/doctor/patients" element={<PatientsPage />} />
              <Route path="/doctor/reports" element={<ReportsPage />} />
              <Route path="/doctor/finance" element={<FinancePage />} />
              <Route path="/doctor/staff" element={<StaffPage />} />
              <Route path="/doctor/attendance" element={<AttendancePage />} />
              <Route path="/doctor/leave" element={<LeavePage />} />
              <Route path="/doctor/share" element={<SharePage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
              <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
              <Route path="/admin/patients" element={<AdminPatientsPage />} />
              <Route path="/admin/activity" element={<AdminActivityPage />} />
              <Route path="/admin/share" element={<AdminSharePage />} />

              {/* Super Admin Routes */}
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/hospitals" element={<SuperAdminHospitalsPage />} />
              <Route path="/superadmin/users" element={<SuperAdminDashboard />} />

              {/* Public Booking */}
              <Route path="/book/:hospitalSlug" element={<BookAppointment />} />

              {/* Queue Display */}
              <Route path="/queue/:doctorId" element={<QueueDisplay />} />
              <Route path="/live-queue/:hospitalId" element={<HospitalQueueDisplay />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
