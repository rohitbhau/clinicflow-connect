import { memo } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileAppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const MobileAppHeader = memo(function MobileAppHeader({
  title,
  showBack = false,
  rightAction,
  className,
}: MobileAppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-md px-4 safe-area-top",
      className
    )}>
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 -ml-2 flex-shrink-0"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      <h1 className="flex-1 font-display text-base font-bold text-foreground truncate">
        {title}
      </h1>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </header>
  );
});
