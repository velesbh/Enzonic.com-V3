import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Grid3x3, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppGrid from "@/components/AppGrid";
import logo from "@/assets/logo.png";
import emiLogo from "@/assets/emi-logo.png";
import boxesLogo from "@/assets/boxes-logo.png";
import translateLogo from "@/assets/translate-logo.png";
const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Get service-specific branding with consistent naming
  const getServiceBranding = () => {
    switch (location.pathname) {
      case '/boxes':
        return { name: 'ENZONIC BOXES', icon: boxesLogo };
      case '/translate':
        return { name: 'ENZONIC TRANSLATE', icon: translateLogo };
      case '/emi':
        return { name: 'ENZONIC EMI', icon: emiLogo };
      default:
        return { name: 'ENZONIC', icon: logo };
    }
  };

  const branding = getServiceBranding();

  return <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm w-full">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
            {branding.icon && (
              <img src={branding.icon} alt="Enzonic Logo" className="h-6 sm:h-8 w-6 sm:w-8 transition-transform group-hover:scale-110" />
            )}
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text">{branding.name}</span>
          </Link>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {/* Mobile menu is now empty but can be used for future navigation items */}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10 flex items-center justify-center">
                  <Grid3x3 className="h-5 w-5" />
                  <span className="sr-only">Apps menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0 border-0 shadow-2xl">
                <AppGrid />
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10 flex items-center justify-center">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hidden sm:flex items-center justify-center h-10 px-4 text-sm font-medium min-w-[80px]">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="default" size="sm" className="rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center h-10 px-4 text-sm font-medium min-w-[80px]">
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center justify-center h-10 w-10">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;