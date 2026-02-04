import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AppointmentsPage from "./pages/doctor/AppointmentsPage";
import PatientsPage from "./pages/doctor/PatientsPage";
import ReportsPage from "./pages/doctor/ReportsPage";
import FinancePage from "./pages/doctor/FinancePage";
import StaffPage from "./pages/doctor/StaffPage";
import SharePage from "./pages/doctor/SharePage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHospitalsPage from "./pages/admin/AdminHospitalsPage";
import AdminDoctorsPage from "./pages/admin/AdminDoctorsPage";
import AdminPatientsPage from "./pages/admin/AdminPatientsPage";
import AdminActivityPage from "./pages/admin/AdminActivityPage";

// Public Pages
import BookAppointment from "./pages/BookAppointment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<AppointmentsPage />} />
            <Route path="/doctor/patients" element={<PatientsPage />} />
            <Route path="/doctor/reports" element={<ReportsPage />} />
            <Route path="/doctor/finance" element={<FinancePage />} />
            <Route path="/doctor/staff" element={<StaffPage />} />
            <Route path="/doctor/share" element={<SharePage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
            <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            <Route path="/admin/patients" element={<AdminPatientsPage />} />
            <Route path="/admin/activity" element={<AdminActivityPage />} />
            
            {/* Public Booking */}
            <Route path="/book/:doctorId" element={<BookAppointment />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
