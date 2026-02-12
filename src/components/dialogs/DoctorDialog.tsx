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
  doctor?: any; // Relaxed type for convenience
  hospitals?: Hospital[];
  onSave: (data: any) => void;
  mode?: "super_admin" | "hospital_admin";
}

export function DoctorDialog({ open, onOpenChange, doctor, hospitals = [], onSave, mode = "super_admin" }: DoctorDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [role, setRole] = useState("doctor");
  const [status, setStatus] = useState<"active" | "on-leave" | "inactive">("active");

  useEffect(() => {
    if (doctor) {
      setName(doctor.name || "");
      setEmail(doctor.email || "");
      setPhone(doctor.phone || "");
      setSpecialization(doctor.specialization || "");
      setQualification(doctor.qualification || "");
      setHospitalId(doctor.hospitalId || "");
      setRole(doctor.role || "doctor");
      setStatus(doctor.status || "active");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setSpecialization("");
      setQualification("");
      setHospitalId("");
      setRole("doctor");
      setStatus("active");
    }
  }, [doctor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hospital = hospitals.find((h) => h.id === hospitalId);

    const data: any = {
      name,
      email,
      phone,
      role,
      status,
    };

    if (mode === "super_admin") {
      data.hospitalId = hospitalId;
      data.hospitalName = hospital?.name || "";
    }

    if (role === "doctor") {
      data.specialization = specialization;
      data.qualification = qualification;
    }

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {doctor ? "Update user information" : "Register a new user in the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === "hospital_admin" && !doctor && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
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
              placeholder="user@clinic.com"
              required
              disabled={!!doctor} // Email usually unique identifier
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234-567-8900"
            />
          </div>

          {role === "doctor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cardiologist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MBBS, MD"
                />
              </div>
            </>
          )}

          {mode === "super_admin" && (
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
          )}

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
              {doctor ? "Save Changes" : "Save User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
