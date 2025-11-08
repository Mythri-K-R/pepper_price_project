import { Link, useLocation } from "react-router-dom";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground hidden sm:inline">Pepper Market Intelligence</span>
            <span className="text-xl font-bold text-foreground sm:hidden">PMI</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Home
            </Link>
            <Link
              to="/predict"
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/predict")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Price Predictor
            </Link>
            <Link
              to="/dashboard"
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Market Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;