import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Moon, Sun, Monitor, ArrowRight, Activity, LogOut, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SettingsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem("themeColor") || "default");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") === "true");
  const [autoapprove, setAutoapprove] = useState(() => localStorage.getItem("autoapprove") === "true");
  const [duration, setDuration] = useState(() => localStorage.getItem("duration") || "15");

  const applyTheme = (selectedTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (selectedTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(selectedTheme);
  };

  const applyColor = (color: string) => {
    const root = window.document.documentElement;
    root.classList.remove("theme-blue", "theme-purple", "theme-orange", "theme-red");
    if (color !== "default") {
      root.classList.add(`theme-${color}`);
    }
    setThemeColor(color);
  };

  const handleSave = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("autoapprove", String(autoapprove));
    localStorage.setItem("duration", duration);
    localStorage.setItem("themeColor", themeColor);
    applyTheme(theme);
    applyColor(themeColor);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <DashboardLayout type="doctor" title="Settings" subtitle="Preferences">
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: "light", label: "Light", icon: Sun, color: "text-amber-500" },
                { value: "dark", label: "Dark", icon: Moon, color: "text-indigo-500" },
                { value: "system", label: "Auto", icon: Monitor, color: "text-primary" },
              ].map((t) => (
                <button
                  key={t.value}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all touch-target sm:p-4 ${theme === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                    }`}
                  onClick={() => { setTheme(t.value); applyTheme(t.value); }}
                >
                  <t.icon className={`h-6 w-6 ${t.color}`} />
                  <span className="text-xs font-medium sm:text-sm">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Accent Color */}
            <div className="pt-4 border-t mt-4">
              <Label className="text-sm font-medium mb-3 block">Accent Color</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: "default", color: "bg-teal-600" },
                  { name: "blue", color: "bg-blue-600" },
                  { name: "purple", color: "bg-purple-600" },
                  { name: "orange", color: "bg-orange-500" },
                  { name: "red", color: "bg-rose-600" },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => applyColor(c.name)}
                    className={`h-10 w-10 rounded-full ${c.color} transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center ${themeColor === c.name ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  >
                    {themeColor === c.name && <Check className="h-5 w-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium">Auto-Approve</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Confirm appointments automatically</p>
              </div>
              <Switch checked={autoapprove} onCheckedChange={setAutoapprove} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Get alerts for bookings</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Default Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {["10", "15", "20", "30", "45", "60"].map((v) => (
                    <SelectItem key={v} value={v}>{v === "60" ? "1 hour" : `${v} minutes`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full h-12 text-base font-semibold gradient-primary gap-2">
          Save Changes
          <ArrowRight className="h-4 w-4" />
        </Button>

        {/* Danger Zone */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive transition-colors hover:bg-destructive/10 touch-target"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Log Out</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </DashboardLayout>
  );
}
