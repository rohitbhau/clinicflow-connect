import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1800);
    const timer2 = setTimeout(() => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (token && user?.role) {
        navigate(user.role === "admin" ? "/admin" : "/doctor", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }, 2200);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [navigate]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-xl">
          <Stethoscope className="h-10 w-10 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">ClinicMG</h1>
          <p className="mt-1 text-sm text-muted-foreground">Healthcare Management</p>
        </div>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-pulse rounded-full gradient-primary" 
               style={{ animation: "splashBar 1.5s ease-in-out infinite" }} />
        </div>
        <p className="text-xs text-muted-foreground/60">Version 1.0.0</p>
      </div>
    </div>
  );
}
