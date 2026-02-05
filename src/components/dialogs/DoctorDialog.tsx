import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hospital } from "@/data/mockData";

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    hospitalId: string;
    status: "active" | "on-leave" | "inactive";
  } | null;
  hospitals: Hospital[];
  onSave: (data: { name: string; email: string; phone: string; specialization: string; hospitalId: string; hospitalName: string; status: "active" | "on-leave" | "inactive" }) => void;
}

export function DoctorDialog({ open, onOpenChange, doctor, hospitals, onSave }: DoctorDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [status, setStatus] = useState<"active" | "on-leave" | "inactive">("active");

  useEffect(() => {
    if (doctor) {
      setName(doctor.name);
      setEmail(doctor.email);
      setPhone(doctor.phone);
      setSpecialization(doctor.specialization);
      setHospitalId(doctor.hospitalId);
      setStatus(doctor.status);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setSpecialization("");
      setHospitalId("");
      setStatus("active");
    }
  }, [doctor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hospital = hospitals.find((h) => h.id === hospitalId);
    onSave({
      name,
      email,
      phone,
      specialization,
      hospitalId,
      hospitalName: hospital?.name || "",
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
          <DialogDescription>
            {doctor ? "Update doctor information" : "Register a new doctor in the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Doctor Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. John Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234-567-8900"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                <SelectItem value="Neurologist">Neurologist</SelectItem>
                <SelectItem value="General Physician">General Physician</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospital">Hospital</Label>
            <Select value={hospitalId} onValueChange={setHospitalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "on-leave" | "inactive")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              {doctor ? "Save Changes" : "Add Doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
