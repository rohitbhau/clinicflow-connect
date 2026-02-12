
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Phone, Mail, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

export default function SuperAdminHospitalsPage() {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", address: "", licenseNumber: "",
        adminName: "", adminEmail: "", adminPassword: ""
    });

    const fetchHospitals = async () => {
        try {
            const res = await api.get('/superadmin/hospitals');
            if (res.data.success) setHospitals(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchHospitals(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.adminEmail || !formData.adminPassword) {
            toast({ title: "Please fill required fields", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/superadmin/hospitals', formData);
            if (res.data.success) {
                toast({ title: "Hospital Onboarded Successfully" });
                setOpen(false);
                fetchHospitals();
                setFormData({ name: "", email: "", phone: "", address: "", licenseNumber: "", adminName: "", adminEmail: "", adminPassword: "" });
            }
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.error?.message || "Error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const filtered = hospitals.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <DashboardLayout type="superadmin" title="Hospitals" subtitle="Manage Hospitals">
            <div className="flex justify-between mb-6">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search hospitals..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary gap-2"><Plus className="h-4 w-4" /> Onboard Hospital</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Onboard New Hospital</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <h3 className="text-sm font-semibold border-b pb-2">Hospital Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Hospital Name *</Label><Input name="name" value={formData.name} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Email</Label><Input name="email" value={formData.email} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Phone</Label><Input name="phone" value={formData.phone} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Address</Label><Input name="address" value={formData.address} onChange={handleChange} /></div>
                                <div className="space-y-2 col-span-2"><Label>License Number</Label><Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="Optional (Auto-generated if empty)" /></div>
                            </div>

                            <h3 className="text-sm font-semibold border-b pb-2 mt-4">Admin Account</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Admin Name</Label><Input name="adminName" value={formData.adminName} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Admin Email *</Label><Input name="adminEmail" value={formData.adminEmail} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Password *</Label><Input name="adminPassword" value={formData.adminPassword} onChange={handleChange} /></div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Onboard Hospital"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(h => (
                    <Card key={h.id} className="shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between">
                                <CardTitle className="text-base">{h.name}</CardTitle>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${h.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100'}`}>{h.status}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {h.address}</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" /> {h.email}</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {h.phone}</div>
                            <div className="border-t pt-2 mt-2 grid grid-cols-3 gap-2 text-center">
                                <div><p className="font-bold">{h.doctors}</p><p className="text-xs text-muted-foreground">Doctors</p></div>
                                <div><p className="font-bold">{h.patients}</p><p className="text-xs text-muted-foreground">Patients</p></div>
                                <div><p className="font-bold">{h.admins}</p><p className="text-xs text-muted-foreground">Admins</p></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </DashboardLayout>
    );
}
