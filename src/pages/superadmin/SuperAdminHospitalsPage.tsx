
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Phone, Mail, MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
    const isMobile = useIsMobile();

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
            <div className="space-y-4">
                {/* Search + Add */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search hospitals..." className="pl-9 h-11" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary gap-2 h-11 w-full sm:w-auto">
                                <Plus className="h-4 w-4" /> Onboard Hospital
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Onboard New Hospital</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <h3 className="text-sm font-semibold border-b pb-2">Hospital Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Hospital Name *</Label><Input name="name" value={formData.name} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Email</Label><Input name="email" value={formData.email} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Phone</Label><Input name="phone" value={formData.phone} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Address</Label><Input name="address" value={formData.address} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2 sm:col-span-2"><Label>License Number</Label><Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="Optional (Auto-generated)" className="h-11" /></div>
                                </div>

                                <h3 className="text-sm font-semibold border-b pb-2 mt-2">Admin Account</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Admin Name</Label><Input name="adminName" value={formData.adminName} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Admin Email *</Label><Input name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="h-11" /></div>
                                    <div className="space-y-2 sm:col-span-2"><Label>Password *</Label><Input name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} className="h-11" /></div>
                                </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)} className="h-11 w-full sm:w-auto">Cancel</Button>
                                <Button onClick={handleSubmit} disabled={loading} className="h-11 w-full sm:w-auto">
                                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Onboard Hospital"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Hospital Cards */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(h => (
                        <Card key={h.id} className="shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="pb-2 px-4">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="text-sm sm:text-base truncate">{h.name}</CardTitle>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${h.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10' : 'bg-muted text-muted-foreground'}`}>
                                        {h.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1.5 px-4">
                                {h.address && <div className="flex items-center gap-2 text-muted-foreground text-xs"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{h.address}</span></div>}
                                {h.email && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{h.email}</span></div>}
                                {h.phone && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Phone className="h-3 w-3 shrink-0" />{h.phone}</div>}
                                <div className="border-t pt-2 mt-2 grid grid-cols-3 gap-2 text-center">
                                    <div><p className="font-bold text-sm">{h.doctors}</p><p className="text-[10px] text-muted-foreground">Doctors</p></div>
                                    <div><p className="font-bold text-sm">{h.patients}</p><p className="text-[10px] text-muted-foreground">Patients</p></div>
                                    <div><p className="font-bold text-sm">{h.admins}</p><p className="text-[10px] text-muted-foreground">Admins</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No hospitals found
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
