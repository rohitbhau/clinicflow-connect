import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HospitalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    status: "active" | "inactive";
  } | null;
  onSave: (data: { name: string; address: string; phone: string; status: "active" | "inactive" }) => void;
}

export function HospitalDialog({ open, onOpenChange, hospital, onSave }: HospitalDialogProps) {
  const [name, setName] = useState(hospital?.name || "");
  const [address, setAddress] = useState(hospital?.address || "");
  const [phone, setPhone] = useState(hospital?.phone || "");
  const [status, setStatus] = useState<"active" | "inactive">(hospital?.status || "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address, phone, status });
    onOpenChange(false);
    // Reset form
    if (!hospital) {
      setName("");
      setAddress("");
      setPhone("");
      setStatus("active");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hospital ? "Edit Hospital" : "Add New Hospital"}</DialogTitle>
          <DialogDescription>
            {hospital ? "Update hospital information" : "Add a new hospital to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hospital Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="City General Hospital"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Downtown"
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
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              {hospital ? "Save Changes" : "Add Hospital"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
