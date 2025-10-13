import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Mic, Camera, Server, Languages, Brain, Tv, Info, HelpCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { useScroll } from "@/hooks/use-scroll";
import { getAutocompleteSuggestions } from "@/lib/searxngApi";

const Index = () => {
  usePageMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // Truly random search terms - no placeholders, real interesting stuff
  const randomSearchTerms = [
    "bioluminescent forests", "ancient underwater cities", "quantum entanglement experiments",
    "rarest gemstones on earth", "mysterious disappearances solved", "deep ocean creatures 2024",
    "abandoned space stations", "neural network art", "volcano lightning phenomenon", 
    "time dilation effects", "crystal cave formations", "aurora borealis time lapse",
    "microorganisms in space", "sound of black holes", "magnetic field reversals",
    "fibonacci patterns in nature", "extremophile bacteria", "glacier collapse videos",
    "supernova remnants", "dna origami structures", "fractal geometry architecture",
    "telepathic animal communication", "holographic principle physics", "dark matter detection",
    "biomimetic robot design", "synesthesia brain scans", "metamaterial invisibility",
    "crispr gene editing", "quantum computing breakthrough", "consciousness uploading research",
    "artificial photosynthesis", "space elevator materials", "fusion reactor progress",
    "brain organoids growing", "magnetic levitation trains", "photonic crystals",
    "swarm robotics algorithms", "vertical farming towers", "atmospheric processors",
    "bioprinting human organs", "metamorphic rock formation", "plasma physics phenomena",
    "exoplanet atmosphere analysis", "synthetic spider silk", "room temperature superconductors",
    "autonomous underwater vehicles", "bacterial fuel cells", "smart dust sensors",
    "molecular assemblers", "wireless power transmission", "artificial leaf technology",
    "shape memory alloys", "self healing materials", "acoustic cloaking devices"
  ];

  const getRandomSearch = () => {
    const randomIndex = Math.floor(Math.random() * randomSearchTerms.length);
    return randomSearchTerms[randomIndex];
  };

  // Handle scroll to show/hide quick access
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > window.innerHeight * 0.6); // Show after 60% of viewport height
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 2) {
        try {
          const results = await getAutocompleteSuggestions(searchQuery);
          setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
        } catch (error) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Load saved filters and include them in the URL
      const saved = localStorage.getItem('enzonic_search_filters');
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      
      if (saved) {
        try {
          const filters = JSON.parse(saved);
          Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
              params.set(key, value.toString());
            }
          });
        } catch {
          // Ignore parsing errors
        }
      }
      
      navigate(`/search?${params.toString()}`);
    }
  };

  const quickActions = [
    { name: "Enzonic Emi", path: "/emi", icon: Brain, description: "AI Discord Bot", color: "from-blue-500 to-purple-600" },
    { name: "Enzonic Boxes", path: "/boxes", icon: Server, description: "Virtual Machines", color: "from-green-500 to-teal-600" },
    { name: "Enzonic Translate", path: "/translate", icon: Languages, description: "AI Translation", color: "from-orange-500 to-red-600" },
    { name: "Shows", path: "/shows", icon: Tv, description: "Entertainment", color: "from-pink-500 to-rose-600" },
    { name: "About", path: "/about", icon: Info, description: "Learn More", color: "from-indigo-500 to-blue-600" },
    { name: "Support", path: "/support", icon: HelpCircle, description: "Get Help", color: "from-emerald-500 to-green-600" }
  ];

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden relative">
      {/* Cool green-themed background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Dynamic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/8 to-green-500/5" />
        
        {/* Animated geometric shapes - green theme */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-primary/15 to-green-500/15 rotate-45 rounded-xl animate-pulse" style={{animationDuration: '4s'}} />
        <div className="absolute bottom-40 right-16 w-24 h-24 bg-gradient-to-br from-green-500/15 to-primary/15 rounded-full animate-float" />
        <div className="absolute top-1/2 left-10 w-16 h-40 bg-gradient-to-b from-primary/10 to-transparent rounded-full animate-pulse" style={{animationDuration: '3s'}} />
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-gradient-to-br from-emerald-500/12 to-primary/12 rotate-12 rounded-lg animate-float" style={{animationDelay: '1s'}} />
        
        {/* Flowing orbs - green theme */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/12 to-green-500/12 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-500/12 to-primary/12 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="bg-grid-pattern" />
        </div>
      </div>

      <Navbar />
      

      
      <main className="flex-1 w-full flex flex-col justify-center items-center px-6 relative z-10 min-h-screen">
        {/* Epic Animated Title - One Line */}
        <div className="text-center mb-16 relative">
          <div className="relative group">
            {/* Main title with cool effects - Single line */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 relative cursor-default">
              {/* Background glow effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent blur-sm opacity-50 animate-pulse">
                Enzonic Search
              </span>
              {/* Main text with green gradient */}
              <span className="relative bg-gradient-to-r from-primary via-green-500 to-primary bg-clip-text text-transparent animate-glow bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-3000">
                Enzonic Search
              </span>
              {/* Animated underline */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-primary to-green-500 group-hover:w-full transition-all duration-1000 rounded-full" />
            </h1>
            
            {/* Cool description with fade-in */}
            <div className="relative">
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                <span className="bg-gradient-to-r from-muted-foreground to-primary/70 bg-clip-text text-transparent font-medium">
                  Discover the Web with Innovation & Intelligence
                </span>
              </p>
              
              {/* Floating accent elements */}
              <div className="absolute -top-4 -left-4 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{animationDelay: '0.5s'}} />
              <div className="absolute -bottom-2 -right-6 w-1.5 h-1.5 bg-green-500/50 rounded-full animate-ping" style={{animationDelay: '1.5s'}} />
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar with Autocomplete - Green theme */}
        <div className="w-full max-w-2xl mb-12 relative group">
          <form onSubmit={handleSearch}>
            <div className="relative">
              {/* Animated border glow - green theme */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-green-500 to-primary rounded-full blur opacity-0 group-hover:opacity-30 transition duration-1000" />
              
              <div className="relative bg-background/95 backdrop-blur-xl rounded-full border-2 border-border/60 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-500 group-hover:scale-[1.02]">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-hover:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search the infinite web..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-16 pr-24 py-7 text-lg rounded-full border-0 bg-transparent focus:ring-2 focus:ring-primary/40 focus:ring-offset-0 placeholder:text-muted-foreground/60 font-medium"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full w-9 h-9 p-0 hover:bg-primary/15 hover:text-primary transition-all hover:scale-110"
                    title="Voice search"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full w-9 h-9 p-0 hover:bg-primary/15 hover:text-primary transition-all hover:scale-110"
                    title="Visual search"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-border/50" />
                  <Globe className="h-4 w-4 text-primary/60" />
                </div>
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl rounded-2xl border border-border/60 shadow-2xl overflow-hidden z-50">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-6 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/30 last:border-b-0 flex items-center gap-3"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(suggestion);
                        
                        // Load saved filters for suggestion navigation too
                        const saved = localStorage.getItem('enzonic_search_filters');
                        const params = new URLSearchParams();
                        params.set('q', suggestion);
                        
                        if (saved) {
                          try {
                            const filters = JSON.parse(saved);
                            Object.entries(filters).forEach(([key, value]) => {
                              if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
                                params.set(key, value.toString());
                              }
                            });
                          } catch {
                            // Ignore parsing errors
                          }
                        }
                        
                        navigate(`/search?${params.toString()}`);
                      }}
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Enhanced Search Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary/5 to-green-500/5 border-2 border-primary/20 hover:border-primary/40 font-semibold"
            onClick={() => navigate('/about')}
          >
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500/10 to-primary/10 border-2 border-green-500/20 hover:border-green-500/40 font-semibold hover:text-green-600"
            onClick={() => {
              const randomQuery = getRandomSearch();
              const params = new URLSearchParams();
              params.set('q', randomQuery);
              navigate(`/search?${params.toString()}`);
            }}
          >
            ✨ I'm Feeling Lucky
          </Button>
        </div>



        {/* Footer Message */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Enzonic Web Search • Available in English
          </p>
        </div>

        {/* Simple scroll indicator */}
        <div className="mt-12">
          <div className="w-1 h-8 bg-primary/40 rounded-full mx-auto" />
        </div>
      </main>

      {/* Quick Access Section - Appears on Scroll */}
      <section className={`w-full py-16 transition-all duration-500 transform relative z-10 ${
        isScrolled ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <div className="absolute inset-0 bg-background/95 backdrop-blur" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-semibold text-foreground mb-2">Quick Access</h3>
            <p className="text-muted-foreground">Explore Enzonic's services</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {quickActions.map((action, index) => (
              <Link key={action.name} to={action.path} className="group">
                <Card className="h-full hover:shadow-lg transition-all hover:scale-102 group cursor-pointer border border-border/60 hover:border-primary/40 bg-background/90 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-105 transition-transform shadow-md`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">{action.name}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Index;