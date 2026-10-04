import { Menu, PenLine } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const { collapsed, toggleMobile } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6",
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobile}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Logo for mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <PenLine className="h-5 w-5 text-primary" />
        <span className="font-semibold">E-Signature</span>
      </div>

      {/* Spacer for desktop - accounts for sidebar */}
      <div
        className={cn(
          "hidden md:block transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      />
    </header>
  );
}
