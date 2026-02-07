import { memo, useState } from "react";
import { Bell, Search, Settings, User, LogOut, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  isMobile?: boolean;
}

export const DashboardHeader = memo(function DashboardHeader({ 
  title, 
  subtitle, 
  onSearch,
  isMobile = false 
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md",
      isMobile ? "h-14 px-4" : "h-16 px-6"
    )}>
      {/* Mobile Search Overlay */}
      {showMobileSearch && isMobile ? (
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchValue}
              className="pl-9 pr-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {searchValue && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowMobileSearch(false);
              handleSearch("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <h1 className={cn(
              "font-display font-bold text-foreground truncate",
              isMobile ? "text-base" : "text-xl"
            )}>
              {title}
            </h1>
            {subtitle && !isMobile && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Mobile Search Button */}
            {isMobile && onSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowMobileSearch(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Desktop Search */}
            {!isMobile && onSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-64 pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            )}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "relative rounded-full",
                  isMobile ? "h-9 w-9" : "h-10 w-10"
                )}>
                  <Avatar className={cn(
                    "border border-muted",
                    isMobile ? "h-8 w-8" : "h-10 w-10"
                  )}>
                    <AvatarImage src={user?.profileImage} alt={user?.name || "User"} />
                    <AvatarFallback className="text-xs">
                      {(user?.name?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  );
});
