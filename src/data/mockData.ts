// Centralized mock data store for the application
// This simulates a database and allows real-time updates across components

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  doctors: number;
  patients: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hospitalId: string;
  hospitalName: string;
  patients: number;
  status: "active" | "on-leave" | "inactive";
  joinedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: "male" | "female" | "other";
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  lastVisit: string;
  totalVisits: number;
  status: "active" | "inactive";
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  time: string;
  date: string;
  type: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  doctorId: string;
  status: "active" | "on-leave" | "inactive";
  joinedAt: string;
}

export interface Transaction {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  type: string;
  amount: number;
  status: "completed" | "pending" | "refunded";
  date: string;
}

export interface Report {
  id: string;
  title: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  type: string;
  status: "ready" | "pending";
  date: string;
  fileUrl?: string;
}

export interface LoginActivity {
  id: string;
  userId: string;
  userName: string;
  role: "doctor" | "staff" | "admin";
  hospitalName: string;
  loginTime: string;
  status: "online" | "offline";
}

// Initial mock data
export const initialHospitals: Hospital[] = [
  { id: "h1", name: "City General Hospital", address: "123 Main St, Downtown", phone: "+1 234-567-8900", doctors: 24, patients: 1250, status: "active", createdAt: "2024-01-15" },
  { id: "h2", name: "Metro Health Clinic", address: "456 Oak Ave, Midtown", phone: "+1 234-567-8901", doctors: 12, patients: 680, status: "active", createdAt: "2024-03-20" },
  { id: "h3", name: "Sunrise Medical Center", address: "789 Pine Rd, Uptown", phone: "+1 234-567-8902", doctors: 18, patients: 920, status: "active", createdAt: "2024-06-10" },
  { id: "h4", name: "Valley Care Hospital", address: "321 Elm Blvd, Valley", phone: "+1 234-567-8903", doctors: 15, patients: 750, status: "inactive", createdAt: "2023-09-05" },
];

export const initialDoctors: Doctor[] = [
  { id: "d1", name: "Dr. John Smith", email: "john.smith@clinic.com", phone: "+1 234-567-8910", specialization: "Cardiologist", hospitalId: "h1", hospitalName: "City General Hospital", patients: 248, status: "active", joinedAt: "2023-01-15" },
  { id: "d2", name: "Dr. Sarah Johnson", email: "sarah.johnson@clinic.com", phone: "+1 234-567-8911", specialization: "Dermatologist", hospitalId: "h1", hospitalName: "City General Hospital", patients: 180, status: "active", joinedAt: "2023-05-20" },
  { id: "d3", name: "Dr. Emily Davis", email: "emily.davis@clinic.com", phone: "+1 234-567-8912", specialization: "Pediatrician", hospitalId: "h2", hospitalName: "Metro Health Clinic", patients: 320, status: "active", joinedAt: "2022-11-10" },
  { id: "d4", name: "Dr. Michael Chen", email: "michael.chen@clinic.com", phone: "+1 234-567-8913", specialization: "Orthopedic", hospitalId: "h2", hospitalName: "Metro Health Clinic", patients: 156, status: "on-leave", joinedAt: "2024-02-01" },
  { id: "d5", name: "Dr. Lisa Brown", email: "lisa.brown@clinic.com", phone: "+1 234-567-8914", specialization: "Neurologist", hospitalId: "h3", hospitalName: "Sunrise Medical Center", patients: 210, status: "active", joinedAt: "2023-08-15" },
];

export const initialPatients: Patient[] = [
  { id: "p1", name: "Sarah Johnson", email: "sarah@email.com", phone: "+1 234-567-8901", age: 32, gender: "female", doctorId: "d1", doctorName: "Dr. John Smith", hospitalId: "h1", lastVisit: "Today", totalVisits: 8, status: "active" },
  { id: "p2", name: "Michael Chen", email: "michael@email.com", phone: "+1 234-567-8902", age: 45, gender: "male", doctorId: "d1", doctorName: "Dr. John Smith", hospitalId: "h1", lastVisit: "Yesterday", totalVisits: 5, status: "active" },
  { id: "p3", name: "Emily Davis", email: "emily@email.com", phone: "+1 234-567-8903", age: 28, gender: "female", doctorId: "d1", doctorName: "Dr. John Smith", hospitalId: "h1", lastVisit: "3 days ago", totalVisits: 12, status: "active" },
  { id: "p4", name: "Robert Wilson", email: "robert@email.com", phone: "+1 234-567-8904", age: 56, gender: "male", doctorId: "d1", doctorName: "Dr. John Smith", hospitalId: "h1", lastVisit: "1 week ago", totalVisits: 3, status: "inactive" },
  { id: "p5", name: "Lisa Brown", email: "lisa@email.com", phone: "+1 234-567-8905", age: 38, gender: "female", doctorId: "d1", doctorName: "Dr. John Smith", hospitalId: "h1", lastVisit: "2 weeks ago", totalVisits: 6, status: "active" },
  { id: "p6", name: "James Miller", email: "james@email.com", phone: "+1 234-567-8906", age: 62, gender: "male", doctorId: "d2", doctorName: "Dr. Sarah Johnson", hospitalId: "h1", lastVisit: "Today", totalVisits: 4, status: "active" },
  { id: "p7", name: "Amanda White", email: "amanda@email.com", phone: "+1 234-567-8907", age: 25, gender: "female", doctorId: "d3", doctorName: "Dr. Emily Davis", hospitalId: "h2", lastVisit: "Yesterday", totalVisits: 10, status: "active" },
];

export const initialAppointments: Appointment[] = [
  { id: "a1", patientId: "p1", patientName: "Sarah Johnson", patientPhone: "+1 234-567-8901", doctorId: "d1", time: "09:00 AM", date: "2026-02-04", type: "General Checkup", status: "in-progress" },
  { id: "a2", patientId: "p2", patientName: "Michael Chen", patientPhone: "+1 234-567-8902", doctorId: "d1", time: "09:30 AM", date: "2026-02-04", type: "Follow-up Visit", status: "scheduled" },
  { id: "a3", patientId: "p3", patientName: "Emily Davis", patientPhone: "+1 234-567-8903", doctorId: "d1", time: "10:00 AM", date: "2026-02-04", type: "Consultation", status: "scheduled" },
  { id: "a4", patientId: "p4", patientName: "Robert Wilson", patientPhone: "+1 234-567-8904", doctorId: "d1", time: "08:30 AM", date: "2026-02-04", type: "ECG Test", status: "completed" },
  { id: "a5", patientId: "p5", patientName: "Lisa Brown", patientPhone: "+1 234-567-8905", doctorId: "d1", time: "08:00 AM", date: "2026-02-04", type: "Blood Pressure Check", status: "completed" },
  { id: "a6", patientId: "p1", patientName: "Sarah Johnson", patientPhone: "+1 234-567-8901", doctorId: "d1", time: "10:30 AM", date: "2026-02-04", type: "Lab Results Review", status: "scheduled" },
  { id: "a7", patientId: "p6", patientName: "James Miller", patientPhone: "+1 234-567-8906", doctorId: "d2", time: "11:00 AM", date: "2026-02-04", type: "Skin Examination", status: "scheduled" },
];

export const initialStaff: StaffMember[] = [
  { id: "s1", name: "Emily Wilson", email: "emily@clinic.com", phone: "+1 234-567-8920", role: "Nurse", doctorId: "d1", status: "active", joinedAt: "2023-06-15" },
  { id: "s2", name: "Michael Brown", email: "michael.b@clinic.com", phone: "+1 234-567-8921", role: "Receptionist", doctorId: "d1", status: "active", joinedAt: "2023-08-20" },
  { id: "s3", name: "Sarah Davis", email: "sarah.d@clinic.com", phone: "+1 234-567-8922", role: "Lab Technician", doctorId: "d1", status: "active", joinedAt: "2024-01-10" },
  { id: "s4", name: "James Miller", email: "james.m@clinic.com", phone: "+1 234-567-8923", role: "Medical Assistant", doctorId: "d1", status: "on-leave", joinedAt: "2023-03-05" },
];

export const initialTransactions: Transaction[] = [
  { id: "t1", patientId: "p1", patientName: "Sarah Johnson", doctorId: "d1", type: "Consultation", amount: 150, status: "completed", date: "Today" },
  { id: "t2", patientId: "p2", patientName: "Michael Chen", doctorId: "d1", type: "Lab Test", amount: 85, status: "completed", date: "Today" },
  { id: "t3", patientId: "p3", patientName: "Emily Davis", doctorId: "d1", type: "Follow-up", amount: 75, status: "pending", date: "Yesterday" },
  { id: "t4", patientId: "p4", patientName: "Robert Wilson", doctorId: "d1", type: "ECG Test", amount: 120, status: "completed", date: "Yesterday" },
  { id: "t5", patientId: "p5", patientName: "Lisa Brown", doctorId: "d1", type: "General Checkup", amount: 100, status: "refunded", date: "2 days ago" },
];

export const initialReports: Report[] = [
  { id: "r1", title: "Blood Test Report", patientId: "p1", patientName: "Sarah Johnson", doctorId: "d1", type: "Lab Report", status: "ready", date: "Feb 4, 2026" },
  { id: "r2", title: "ECG Analysis", patientId: "p2", patientName: "Michael Chen", doctorId: "d1", type: "Diagnostic", status: "ready", date: "Feb 3, 2026" },
  { id: "r3", title: "X-Ray Report", patientId: "p3", patientName: "Emily Davis", doctorId: "d1", type: "Imaging", status: "pending", date: "Feb 3, 2026" },
  { id: "r4", title: "Complete Health Checkup", patientId: "p4", patientName: "Robert Wilson", doctorId: "d1", type: "General", status: "ready", date: "Feb 2, 2026" },
  { id: "r5", title: "Thyroid Panel", patientId: "p5", patientName: "Lisa Brown", doctorId: "d1", type: "Lab Report", status: "ready", date: "Feb 1, 2026" },
];

export const initialLoginActivity: LoginActivity[] = [
  { id: "l1", userId: "d1", userName: "Dr. John Smith", role: "doctor", hospitalName: "City General", loginTime: "2 min ago", status: "online" },
  { id: "l2", userId: "d2", userName: "Dr. Sarah Johnson", role: "doctor", hospitalName: "Metro Health", loginTime: "15 min ago", status: "online" },
  { id: "l3", userId: "s1", userName: "Mike Wilson", role: "staff", hospitalName: "City General", loginTime: "1 hour ago", status: "offline" },
  { id: "l4", userId: "d5", userName: "Dr. Emily Davis", role: "doctor", hospitalName: "Sunrise Medical", loginTime: "2 hours ago", status: "offline" },
  { id: "l5", userId: "d3", userName: "Dr. Michael Chen", role: "doctor", hospitalName: "Metro Health", loginTime: "3 hours ago", status: "offline" },
];
