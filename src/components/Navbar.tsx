import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Grid3x3, Menu, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppGrid from "@/components/AppGrid";
import logo from "@/assets/logo.png";
import { useEffect } from "react";
const Navbar = () => {
  const {
    theme,
    setTheme
  } = useTheme();
  const location = useLocation();
  
  useEffect(() => {
    // Update page title and metadata based on route
    const titles: Record<string, string> = {
      '/': 'Enzonic LLC - Proving Things Can Be Done Different',
      '/boxes': 'Boxes - Enzonic LLC',
      '/translate': 'Translate - Enzonic LLC',
      '/emi': 'Emi - AI Discord Bot | Enzonic LLC',
      '/support': 'Support - Enzonic LLC',
      '/admin': 'Admin - Enzonic LLC',
      '/terms': 'Terms of Service - Enzonic LLC',
      '/privacy': 'Privacy Policy - Enzonic LLC'
    };
    const descriptions: Record<string, string> = {
      '/': 'Enzonic prioritizes users over company gains with eco-friendly solutions. Proving things can be done different.',
      '/boxes': 'Secure cloud storage and file management with Enzonic Boxes.',
      '/translate': 'Professional translation services powered by Enzonic.',
      '/emi': 'The most advanced Discord bot with AI-powered memory and intelligent message handling.',
      '/support': 'Get support from Enzonic LLC.',
      '/admin': 'Admin dashboard for Enzonic services.',
      '/terms': 'Terms of Service for Enzonic LLC.',
      '/privacy': 'Privacy Policy for Enzonic LLC.'
    };
    document.title = titles[location.pathname] || 'Enzonic LLC';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptions[location.pathname] || 'Enzonic LLC - User-Centric & Eco-Friendly Solutions');
    }
  }, [location]);

  // Determine if we're on a service page
  const isServicePage = ['/boxes', '/translate', '/emi'].includes(location.pathname);
  
  // Get service-specific branding
  const getServiceBranding = () => {
    switch (location.pathname) {
      case '/boxes':
        return { name: 'BOXES', icon: null };
      case '/translate':
        return { name: 'TRANSLATE', icon: null };
      case '/emi':
        return { name: 'EMI', icon: null };
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

          {/* Full navbar for non-service pages */}
          {!isServicePage && (
            <>
              <div className="hidden md:flex items-center gap-4 lg:gap-6">
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                  Home
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm font-medium hover:text-primary transition-colors">
                      Services
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/boxes" className="w-full cursor-pointer">Boxes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/translate" className="w-full cursor-pointer">Translate</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/emi" className="w-full cursor-pointer">Emi</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <a href="mailto:admin@enzonic.com" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                  Support
                </a>
              </div>

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
                      <Link to="/" className="text-base font-medium hover:text-primary transition-colors px-2 py-1">
                        Home
                      </Link>
                      <div className="border-t border-border my-2" />
                      <p className="text-xs text-muted-foreground px-2 font-semibold">Services</p>
                      <Link to="/boxes" className="text-base font-medium hover:text-primary transition-colors px-4 py-1">
                        Boxes
                      </Link>
                      <Link to="/translate" className="text-base font-medium hover:text-primary transition-colors px-4 py-1">
                        Translate
                      </Link>
                      <Link to="/emi" className="text-base font-medium hover:text-primary transition-colors px-4 py-1">
                        Emi
                      </Link>
                      <div className="border-t border-border my-2" />
                      <a href="mailto:admin@enzonic.com" className="text-base font-medium hover:text-primary transition-colors px-2 py-1">
                        Support
                      </a>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                  <Grid3x3 className="h-5 w-5" />
                  <span className="sr-only">Apps menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0 border-0 shadow-2xl">
                <AppGrid />
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {!isServicePage && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hidden sm:flex">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="default" size="sm" className="rounded-full shadow-lg hover:shadow-xl transition-shadow text-xs sm:text-sm">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;