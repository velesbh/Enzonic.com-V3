import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Server, Languages, Brain, Tv, Info, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { useScroll } from "@/hooks/use-scroll";
import { getAutocompleteSuggestions } from "@/lib/searxngApi";
import quotesData from "../../quotes.json";

const Index = () => {
  usePageMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quote, setQuote] = useState<{content: string; author: string} | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
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

  // Fetch random quote on mount
  useEffect(() => {
    fetchRandomQuote();
  }, []);

  const fetchRandomQuote = () => {
    setQuoteLoading(true);
    try {
      // Get a random quote from local JSON
      const randomIndex = Math.floor(Math.random() * quotesData.length);
      const randomQuote = quotesData[randomIndex];
      
      setQuote({
        content: randomQuote.content,
        author: randomQuote.author
      });
    } catch (error) {
      console.error('Failed to load quote:', error);
      // Fallback quote
      setQuote({
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
      });
    } finally {
      setQuoteLoading(false);
    }
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
          // Use Google autocomplete for consistent results
          const results = await getAutocompleteSuggestions(searchQuery, 'google');
          setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Detect language from search query
      const detectedLang = detectLanguage(searchQuery.trim());
      
      // Load saved filters
      const saved = localStorage.getItem('enzonic_search_filters');
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      
      let filters: any = {};
      if (saved) {
        try {
          filters = JSON.parse(saved);
        } catch {
          // Ignore parsing errors
        }
      }
      
      // Update language filter if detected and current is auto
      if (detectedLang !== 'auto' && (!filters.language || filters.language === 'auto')) {
        filters.language = detectedLang;
        localStorage.setItem('enzonic_search_filters', JSON.stringify(filters));
      }
      
      // Add filters to URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
          params.set(key, value.toString());
        }
      });
      
      navigate(`/search?${params.toString()}`);
    }
  };

  // Detect language from search query text
  const detectLanguage = (text: string): string => {
    // Character ranges for different scripts
    const patterns = {
      ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
      zh: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
      ja: /[\u3040-\u309F\u30A0-\u30FF]/,
      ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
      ru: /[\u0400-\u04FF]/,
      hi: /[\u0900-\u097F]/,
    };

    // Check for non-Latin scripts
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // For Latin scripts, check for distinctive patterns
    const lowerText = text.toLowerCase();
    
    if (/[ñáéíóúü¿¡]/.test(lowerText) || /\b(el|la|de|que|y|es|en|un|para|por|como|con|no|una|su)\b/.test(lowerText)) {
      return 'es';
    }
    
    if (/[àâæçèéêëîïôùûü]/.test(lowerText) || /\b(le|la|les|de|un|une|est|et|dans|pour|qui|avec|ce|il|au)\b/.test(lowerText)) {
      return 'fr';
    }
    
    if (/[äöüß]/.test(lowerText) || /\b(der|die|das|und|in|von|zu|den|mit|ist|im|für|auf|des|dem)\b/.test(lowerText)) {
      return 'de';
    }
    
    if (/\b(il|la|di|e|da|in|un|per|con|non|una|che|come|più|del|dei)\b/.test(lowerText)) {
      return 'it';
    }
    
    if (/[ãõç]/.test(lowerText) || /\b(o|a|os|as|de|da|do|em|para|com|que|não|um|uma|por|se|como)\b/.test(lowerText)) {
      return 'pt';
    }

    return 'auto';
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
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
      {/* Simple clean background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Light gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background to-primary/5" />
        
        {/* Subtle geometric accents */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-primary/5 rounded-full" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-green-500/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/10 rotate-45 rounded-lg" />
      </div>

      <Navbar />
      <main className="flex-1 w-full flex flex-col justify-center items-center px-6 relative z-10 min-h-screen">
        {/* Clean Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
              Enzonic Search
            </span>
          </h1>
          
          {/* Random Quote or Loading State */}
          {!searchQuery && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              {quoteLoading ? (
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Loading inspiration...
                </p>
              ) : quote ? (
                <blockquote className="text-lg sm:text-xl text-muted-foreground">
                  <p className="italic">
                    "{quote.content}"
                  </p>
                  <footer className="text-base text-muted-foreground/80 mt-2">
                    — {quote.author}
                  </footer>
                </blockquote>
              ) : (
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Discover the Web with Innovation & Intelligence
                </p>
              )}
            </div>
          )}
        </div>

        {/* Clean Search Bar */}
        <div className="w-full max-w-2xl mb-12 relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="bg-background border-2 border-border rounded-full shadow-lg hover:border-primary/50 transition-all">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search the world wide web..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-16 pr-6 py-6 text-lg rounded-full border-0 bg-transparent focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-6 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-center gap-3"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(suggestion);
                        
                        const params = new URLSearchParams();
                        params.set('q', suggestion);
                        navigate(`/search?${params.toString()}`);
                      }}
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Clean Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-4"
            onClick={() => navigate('/about')}
          >
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
          <Button
            variant="default"
            size="lg"
            className="px-8 py-4"
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
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Enzonic Web Search • Available in English
          </p>
        </div>
      </main>

      {/* Quick Access Section */}
      <section className="w-full py-16 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-semibold mb-2">Quick Access</h3>
            <p className="text-muted-foreground">Explore Enzonic's services</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {quickActions.map((action) => (
              <Link key={action.name} to={action.path}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 mx-auto`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{action.name}</h3>
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