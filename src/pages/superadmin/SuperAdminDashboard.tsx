
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Building2, Users, UserCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        api.get('/superadmin/stats').then(res => {
            if (res.data.success) setStats(res.data.data);
        }).catch(err => console.error(err));
    }, []);

    return (
        <DashboardLayout type="superadmin" title="Super Admin Dashboard" subtitle="Platform Overview">
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Total Hospitals" value={stats?.hospitals || 0} icon={Building2} iconColor="primary" />
                <StatsCard title="Total Users" value={stats?.users || 0} icon={Users} iconColor="info" />
                <StatsCard title="Doctors" value={stats?.doctors || 0} icon={UserCheck} iconColor="success" />
                <StatsCard title="Admins" value={stats?.admins || 0} icon={Shield} iconColor="warning" />
            </div>

            <div className="mt-8">
                <Card>
                    <CardHeader><CardTitle>Recent Hospitals</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recentHospitals?.map((h: any) => (
                                <div key={h._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{h.name}</p>
                                        <p className="text-sm text-muted-foreground">{h.email}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(h.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {!stats?.recentHospitals?.length && <p className="text-muted-foreground">No hospitals found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
