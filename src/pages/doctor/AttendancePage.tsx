
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, History, Calendar, LogIn, LogOut, Coffee } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>({
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0
    });
    const [history, setHistory] = useState<any[]>([]);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch status and history
    const fetchData = async () => {
        try {
            setLoading(true);
            const [statusRes, historyRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/attendance/history')
            ]);

            if (statusRes.data.success) {
                setStatus(statusRes.data.data);
            }
            if (historyRes.data.success) {
                setHistory(historyRes.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch attendance data", error);
            toast({
                title: "Error",
                description: "Failed to load attendance data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckIn = async () => {
        try {
            const res = await api.post('/attendance/check-in');
            if (res.data.success) {
                toast({ title: "Checked In successfully" });
                fetchData();
            }
        } catch (error: any) {
            toast({
                title: "Check-in Failed",
                description: error.response?.data?.error?.message || "Something went wrong",
                variant: "destructive"
            });
        }
    };

    const handleCheckOut = async () => {
        try {
            const res = await api.post('/attendance/check-out');
            if (res.data.success) {
                toast({ title: "Checked Out successfully" });
                fetchData();
            }
        } catch (error: any) {
            toast({
                title: "Check-out Failed",
                description: error.response?.data?.error?.message || "Something went wrong",
                variant: "destructive"
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return "--:--";
        return new Date(dateString).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout type="doctor" title="Attendance" subtitle="Track your daily attendance">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Status Card */}
                <Card className="col-span-full lg:col-span-2 shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Today's Status
                        </CardTitle>
                        <CardDescription>
                            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <div className="text-5xl font-bold text-primary font-mono tracking-tight mb-2">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                    <Badge variant={status.checkedIn && !status.checkedOut ? "default" : "secondary"} className="text-sm px-3 py-1">
                                        {status.checkedIn && !status.checkedOut ? "Present (Active)" : status.checkedOut ? "Checked Out" : "Absent / Not Checked In"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px]">
                                {!status.checkedIn ? (
                                    <Button size="lg" className="h-16 text-lg gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all hover:scale-105" onClick={handleCheckIn}>
                                        <LogIn className="h-6 w-6" />
                                        Check In Now
                                    </Button>
                                ) : !status.checkedOut ? (
                                    <Button size="lg" className="h-16 text-lg gap-2" variant="destructive" onClick={handleCheckOut}>
                                        <LogOut className="h-6 w-6" />
                                        Check Out
                                    </Button>
                                ) : (
                                    <div className="text-center p-4 bg-muted/50 rounded-lg border border-dashed">
                                        <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                                        <p className="font-medium">Day Completed</p>
                                        <p className="text-sm text-muted-foreground">Total: {status.totalHours} hrs</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Today's Timeline */}
                        <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                    <LogIn className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Check In</p>
                                    <p className="font-semibold text-lg">{formatTime(status.checkInTime)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Check Out</p>
                                    <p className="font-semibold text-lg">{formatTime(status.checkOutTime)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Summary / Stats (Placeholder for now, could be dynamic) */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-warning" />
                            Quick Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Hours (Today)</p>
                            <p className="text-3xl font-bold text-primary">{status.totalHours || 0} hrs</p>
                        </div>
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Attendance Streak</p>
                            <p className="text-3xl font-bold text-foreground">
                                {/* Mock streak calculation */}
                                {history.length > 0 ? history.length : 0} Days
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent History */}
                <Card className="col-span-full shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />
                            Recent History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No attendance history found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Table Header */}
                                <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 bg-muted/50 rounded-md font-medium text-sm text-muted-foreground">
                                    <div>Date</div>
                                    <div>Check In</div>
                                    <div>Check Out</div>
                                    <div>Total Hours</div>
                                </div>
                                {/* Rows */}
                                {history.map((record: any) => (
                                    <div key={record._id} className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 py-4 border rounded-lg md:border-none md:bg-transparent md:hover:bg-muted/30 transition-colors items-center">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-primary md:hidden" />
                                            <span className="font-medium">{formatDate(record.date)}</span>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-start gap-2">
                                            <span className="text-xs text-muted-foreground md:hidden">In:</span>
                                            <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                                                {formatTime(record.checkIn)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-start gap-2">
                                            <span className="text-xs text-muted-foreground md:hidden">Out:</span>
                                            {record.checkOut ? (
                                                <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20">
                                                    {formatTime(record.checkOut)}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm italic text-muted-foreground">--:--</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between md:justify-start gap-2">
                                            <span className="text-xs text-muted-foreground md:hidden">Total:</span>
                                            <span className="font-mono">{record.totalHours} hrs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
