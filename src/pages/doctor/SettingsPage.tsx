import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Moon, Sun, Monitor, ArrowRight, Activity, Calendar } from "lucide-react";

export default function SettingsPage() {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") === "true");
    const [autoapprove, setAutoapprove] = useState(() => localStorage.getItem("autoapprove") === "true");
    const [duration, setDuration] = useState(() => localStorage.getItem("duration") || "15");

    useEffect(() => {
        applyTheme(theme);
    }, []);

    const applyTheme = (selectedTheme: string) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (selectedTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(selectedTheme);
    };

    const handleSave = () => {
        localStorage.setItem("theme", theme);
        localStorage.setItem("notifications", String(notifications));
        localStorage.setItem("autoapprove", String(autoapprove));
        localStorage.setItem("duration", duration);

        applyTheme(theme);

        toast({
            title: "Settings saved",
            description: "Your preferences have been updated successfully.",
        });
    };

    return (
        <DashboardLayout
            type="doctor"
            title="Settings"
            subtitle="Manage your application preferences and flow settings"
        >
            <div className="space-y-6 max-w-4xl">
                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-primary" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize how the application looks on your device
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="h-8 w-8 text-orange-500" />
                                <span className="font-medium">Light Mode</span>
                            </div>
                            <div
                                className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="h-8 w-8 text-indigo-500" />
                                <span className="font-medium">Dark Mode</span>
                            </div>
                            <div
                                className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="h-8 w-8 text-primary" />
                                <span className="font-medium">System Default</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Workflow Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Workflow Settings
                        </CardTitle>
                        <CardDescription>
                            Configure how appointments and patient flows are managed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Auto-Approve Appointments</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically confirm appointments when booked by patients
                                </p>
                            </div>
                            <Switch checked={autoapprove} onCheckedChange={setAutoapprove} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive SMS alerts for new bookings and cancellations
                                </p>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>

                        <div className="space-y-2">
                            <Label>Default Appointment Duration</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="20">20 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Set the standard time block for new appointments
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} className="gap-2">
                        Save Changes
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
