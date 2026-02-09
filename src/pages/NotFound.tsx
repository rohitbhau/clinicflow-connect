import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { WifiOff, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 safe-area-inset">
      <div className="flex flex-col items-center text-center max-w-xs animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6">
          <WifiOff className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h1 className="font-display text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="text-lg font-medium text-foreground mb-1">Page Not Found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="gradient-primary gap-2 h-12 px-6 text-base">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
