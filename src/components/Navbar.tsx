import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Moon, Sun, Grid3x3, Menu, Youtube, Search, Clock, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppGrid from "@/components/AppGrid";
import { useScroll } from "@/hooks/use-scroll";
import { useState, useRef, useEffect } from "react";
import { getAutocompleteSuggestions } from "@/lib/searxngApi";
const logo = "/logo.png";
const emiLogo = "/emi.png";
const boxesLogo = "/boxes.png";
const translateLogo = "/translate.png";
const showsLogo = "/show.png";
const searchLogo = "/search.png";
const chatbotLogo = "/ai.png";
const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isScrolled, scrollDirection } = useScroll();
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isSearchPage = location.pathname === '/search';
  
  // Load search history
  useEffect(() => {
    const history = localStorage.getItem('enzonic_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        setSearchHistory([]);
      }
    }
  }, []);
  
  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    
    if (value.length >= 1) {
      try {
        const historySuggestions = searchHistory.filter(h => 
          h.toLowerCase().includes(value.toLowerCase()) && h.toLowerCase() !== value.toLowerCase()
        ).slice(0, 3);
        
        const apiSuggestions = value.length >= 2 ? await getAutocompleteSuggestions(value, 'google') : [];
        
        const combinedSuggestions = [
          ...historySuggestions,
          ...apiSuggestions.filter(s => !historySuggestions.includes(s))
        ].slice(0, 8);
        
        setSuggestions(combinedSuggestions);
        setShowSuggestions(combinedSuggestions.length > 0);
      } catch (err) {
        const historySuggestions = searchHistory.filter(h => 
          h.toLowerCase().includes(value.toLowerCase()) && h.toLowerCase() !== value.toLowerCase()
        ).slice(0, 3);
        setSuggestions(historySuggestions);
        setShowSuggestions(historySuggestions.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  // Get service-specific branding with consistent naming
  const getServiceBranding = () => {
    switch (location.pathname) {
      case '/':
        return { name: 'ENZONIC', icon: searchLogo };
      case '/search':
        return { name: 'ENZONIC SEARCH', icon: searchLogo };
      case '/chatbot':
        return { name: 'ENZONIC AI', icon: chatbotLogo };
      case '/boxes':
        return { name: 'ENZONIC BOXES', icon: boxesLogo };
      case '/translate':
        return { name: 'ENZONIC TRANSLATE', icon: translateLogo };
      case '/emi':
        return { name: 'ENZONIC EMI', icon: emiLogo };
      case '/shows':
        return { name: 'ENZONIC SHOWS', icon: showsLogo };
      default:
        return { name: 'ENZONIC', icon: logo };
    }
  };

  const branding = getServiceBranding();

  // Dynamic navbar classes based on scroll state
  const navbarClasses = `
    ${isScrolled 
      ? 'fixed top-4 left-2 right-2 sm:left-4 sm:right-4 md:left-6 md:right-6 lg:left-8 lg:right-8 bg-background/95 backdrop-blur-xl border border-border/70 shadow-2xl rounded-2xl' 
      : 'sticky top-0 w-full bg-background/95 backdrop-blur border-b border-border/50 shadow-sm rounded-none'
    }
    z-50 transition-all duration-500 ease-out
    ${scrollDirection === 'down' && isScrolled ? 'opacity-95' : 'opacity-100'}
    supports-[backdrop-filter]:bg-background/80
  `.replace(/\s+/g, ' ').trim();

  return <nav className={navbarClasses}>
      <div className={`transition-all duration-500 ${isScrolled ? 'px-4 sm:px-6' : 'container mx-auto px-3 sm:px-4'}`}>
        <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
            {branding.icon && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl overflow-hidden flex items-center justify-center bg-background/50 flex-shrink-0">
                <img 
                  src={branding.icon} 
                  alt="Enzonic Logo" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
              </div>
            )}
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text hidden sm:block">{branding.name}</span>
          </Link>

          {/* Search Box - Only on search page */}
          {isSearchPage && (
            <div className="flex-1 max-w-2xl relative hidden md:block">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="bg-background/95 backdrop-blur rounded-full border-2 border-border/60 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search the web..."
                      value={searchQuery}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="pl-12 pr-12 py-2 rounded-full border-0 bg-transparent focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      {searchQuery && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSearchQuery('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }}
                          className="rounded-full w-8 h-8 p-0 hover:bg-primary/10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-border/50">
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => {
                          const isHistory = searchHistory.includes(suggestion);
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectSuggestion(suggestion)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center gap-3"
                            >
                              {isHistory ? (
                                <Clock className="h-3 w-3 text-primary" />
                              ) : (
                                <Search className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span>{suggestion}</span>
                              {isHistory && (
                                <span className="ml-auto text-xs text-primary">Recent</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              </form>
            </div>
          )}

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
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10 flex items-center justify-center"
            >
              <a 
                href="https://www.youtube.com/channel/UCss9ZEsraYR-oqLfD62KSGA" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit Enzonic YouTube Channel"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </Button>

            {!isSearchPage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10 flex items-center justify-center">
                  <Grid3x3 className="h-5 w-5" />
                  <span className="sr-only">Apps menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0 border-0 shadow-2xl bg-transparent backdrop-blur-xl">
                <AppGrid />
              </DropdownMenuContent>
            </DropdownMenu>
            )}

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