import { useState, useCallback } from "react";
import {
  Hospital,
  Doctor,
  Patient,
  Appointment,
  StaffMember,
  Transaction,
  Report,
  LoginActivity,
  initialHospitals,
  initialDoctors,
  initialPatients,
  initialAppointments,
  initialStaff,
  initialTransactions,
  initialReports,
  initialLoginActivity,
} from "@/data/mockData";

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export function useDataStore() {
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>(initialLoginActivity);

  // Hospital CRUD
  const addHospital = useCallback((hospital: Omit<Hospital, "id">) => {
    const newHospital = { ...hospital, id: generateId() };
    setHospitals((prev) => [...prev, newHospital]);
    return newHospital;
  }, []);

  const updateHospital = useCallback((id: string, updates: Partial<Hospital>) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }, []);

  const deleteHospital = useCallback((id: string) => {
    setHospitals((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // Doctor CRUD
  const addDoctor = useCallback((doctor: Omit<Doctor, "id">) => {
    const newDoctor = { ...doctor, id: generateId() };
    setDoctors((prev) => [...prev, newDoctor]);
    return newDoctor;
  }, []);

  const updateDoctor = useCallback((id: string, updates: Partial<Doctor>) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const deleteDoctor = useCallback((id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Patient CRUD
  const addPatient = useCallback((patient: Omit<Patient, "id">) => {
    const newPatient = { ...patient, id: generateId() };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, []);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Appointment CRUD
  const addAppointment = useCallback((appointment: Omit<Appointment, "id">) => {
    const newAppointment = { ...appointment, id: generateId() };
    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Staff CRUD
  const addStaffMember = useCallback((member: Omit<StaffMember, "id">) => {
    const newMember = { ...member, id: generateId() };
    setStaff((prev) => [...prev, newMember]);
    return newMember;
  }, []);

  const updateStaffMember = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteStaffMember = useCallback((id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Transaction CRUD
  const addTransaction = useCallback((transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: generateId() };
    setTransactions((prev) => [...prev, newTransaction]);
    return newTransaction;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Report CRUD
  const addReport = useCallback((report: Omit<Report, "id">) => {
    const newReport = { ...report, id: generateId() };
    setReports((prev) => [...prev, newReport]);
    return newReport;
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<Report>) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    // Data
    hospitals,
    doctors,
    patients,
    appointments,
    staff,
    transactions,
    reports,
    loginActivity,
    // Hospital operations
    addHospital,
    updateHospital,
    deleteHospital,
    // Doctor operations
    addDoctor,
    updateDoctor,
    deleteDoctor,
    // Patient operations
    addPatient,
    updatePatient,
    deletePatient,
    // Appointment operations
    addAppointment,
    updateAppointment,
    deleteAppointment,
    // Staff operations
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    // Transaction operations
    addTransaction,
    updateTransaction,
    // Report operations
    addReport,
    updateReport,
    deleteReport,
  };
}
