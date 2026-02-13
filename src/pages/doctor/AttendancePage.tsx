import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, History, Calendar, LogIn, LogOut, Coffee } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AttendancePage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        api.get('/attendance/status'),
        api.get('/attendance/history')
      ]);
      if (statusRes.data.success) setStatus(statusRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch (error) {
      console.error("Failed to fetch attendance data", error);
      toast({ title: "Error", description: "Failed to load attendance data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/check-in');
      if (res.data.success) { toast({ title: "Checked In successfully" }); fetchData(); }
    } catch (error: any) {
      toast({ title: "Check-in Failed", description: error.response?.data?.error?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.post('/attendance/check-out');
      if (res.data.success) { toast({ title: "Checked Out successfully" }); fetchData(); }
    } catch (error: any) {
      toast({ title: "Check-out Failed", description: error.response?.data?.error?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout type="doctor" title="Attendance" subtitle="Track your daily attendance">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Status Card */}
        <Card className="col-span-full lg:col-span-2 shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Today's Status
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold text-primary font-mono tracking-tight mb-2 sm:text-5xl">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <Badge variant={status.checkedIn && !status.checkedOut ? "default" : "secondary"} className="text-xs px-3 py-1 sm:text-sm">
                  {status.checkedIn && !status.checkedOut ? "Present (Active)" : status.checkedOut ? "Checked Out" : "Not Checked In"}
                </Badge>
              </div>

              <div className="w-full md:w-auto md:min-w-[200px]">
                {!status.checkedIn ? (
                  <Button size="lg" className="w-full h-14 text-base gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg sm:h-16 sm:text-lg touch-target" onClick={handleCheckIn}>
                    <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
                    Check In Now
                  </Button>
                ) : !status.checkedOut ? (
                  <Button size="lg" className="w-full h-14 text-base gap-2 sm:h-16 sm:text-lg touch-target" variant="destructive" onClick={handleCheckOut}>
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                    Check Out
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-muted/50 rounded-lg border border-dashed">
                    <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-sm">Day Completed</p>
                    <p className="text-xs text-muted-foreground">Total: {status.totalHours} hrs</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Timeline */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 sm:gap-4 sm:mt-8 sm:pt-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center text-success flex-shrink-0 sm:h-10 sm:w-10">
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check In</p>
                  <p className="font-semibold text-base sm:text-lg">{formatTime(status.checkInTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 sm:h-10 sm:w-10">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check Out</p>
                  <p className="font-semibold text-base sm:text-lg">{formatTime(status.checkOutTime)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Coffee className="h-4 w-4 text-warning" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="bg-primary/5 p-3 rounded-lg sm:p-4">
              <p className="text-xs text-muted-foreground mb-1 sm:text-sm">Total Hours (Today)</p>
              <p className="text-2xl font-bold text-primary sm:text-3xl">{status.totalHours || 0} hrs</p>
            </div>
            <div className="bg-secondary p-3 rounded-lg sm:p-4">
              <p className="text-xs text-muted-foreground mb-1 sm:text-sm">Attendance Streak</p>
              <p className="text-2xl font-bold text-foreground sm:text-3xl">
                {history.length > 0 ? history.length : 0} Days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="col-span-full shadow-md">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <History className="h-5 w-5 text-muted-foreground" />
              Recent History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {history.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground sm:py-8">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20 sm:h-12 sm:w-12" />
                <p className="text-sm">No attendance history found.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Table Header - Desktop */}
                <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 bg-muted/50 rounded-md font-medium text-xs text-muted-foreground sm:text-sm">
                  <div>Date</div>
                  <div>Check In</div>
                  <div>Check Out</div>
                  <div>Total Hours</div>
                </div>
                {/* Rows */}
                {history.map((record: any) => (
                  <div key={record._id} className="flex flex-col gap-2 p-3 border rounded-lg md:grid md:grid-cols-4 md:gap-4 md:px-4 md:py-3 md:border-none md:bg-transparent md:hover:bg-muted/30 transition-colors md:items-center">
                    <div className="flex items-center justify-between md:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary md:hidden flex-shrink-0" />
                        <span className="font-medium text-sm">{formatDate(record.date)}</span>
                      </div>
                      {/* Mobile-only total hours badge */}
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded md:hidden">{record.totalHours} hrs</span>
                    </div>
                    <div className="flex items-center gap-3 md:contents">
                      <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                        <span className="text-xs text-muted-foreground md:hidden">In:</span>
                        <Badge variant="outline" className="bg-success/5 text-success border-success/20 text-xs">
                          {formatTime(record.checkIn)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                        <span className="text-xs text-muted-foreground md:hidden">Out:</span>
                        {record.checkOut ? (
                          <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 text-xs">
                            {formatTime(record.checkOut)}
                          </Badge>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">--:--</span>
                        )}
                      </div>
                      <div className="hidden md:block">
                        <span className="font-mono text-sm">{record.totalHours} hrs</span>
                      </div>
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