import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Globe, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  Image, 
  Video, 
  Music, 
  FileText,
  Newspaper,
  Map,
  X,
  Download,
  Copy,
  Share,
  Info,
  Calendar,
  Tag,
  Maximize2,
  Link as LinkIcon,
  User,
  Grid3X3
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import AppGrid from "@/components/AppGrid";
import { searchWeb, getAutocompleteSuggestions, searchWikipedia, SearchResult, SearchResponse } from "@/lib/searxngApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";

interface SearchFilters {
  category: string;
  language: string;
  timeRange: string;
  safesearch: number;
  engines: string;
}

const SearchResults = () => {
  usePageMetadata();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [wikipediaResults, setWikipediaResults] = useState<SearchResponse | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAppGrid, setShowAppGrid] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  // Load saved filters from localStorage
  const loadSavedFilters = (): SearchFilters => {
    const saved = localStorage.getItem('enzonic_search_filters');
    const defaultFilters = {
      category: 'general',
      language: 'auto',
      timeRange: 'anytime',
      safesearch: 1,
      engines: ''
    };
    
    try {
      const parsedSaved = saved ? JSON.parse(saved) : {};
      return {
        category: searchParams.get('category') || parsedSaved.category || defaultFilters.category,
        language: searchParams.get('language') || parsedSaved.language || defaultFilters.language,
        timeRange: searchParams.get('time_range') || parsedSaved.timeRange || defaultFilters.timeRange,
        safesearch: parseInt(searchParams.get('safesearch') || parsedSaved.safesearch?.toString() || defaultFilters.safesearch.toString()),
        engines: searchParams.get('engines') || parsedSaved.engines || defaultFilters.engines
      };
    } catch {
      return defaultFilters;
    }
  };

  const [filters, setFilters] = useState<SearchFilters>(loadSavedFilters);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(loadSearchHistory());
  }, []);

  const performSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) return;

    // Save to search history only for new searches (page 1)
    if (page === 1) {
      saveSearchToHistory(query.trim());
    }
    
    setLoading(true);
    setError(null);
    setCurrentPage(page);

    // Update URL with current page
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('q', query);
    newSearchParams.set('page', page.toString());
    setSearchParams(newSearchParams);

    try {
      // Perform both general search and Wikipedia search in parallel (Wikipedia only on page 1)
      const searchPromises = [
        searchWeb({
          q: query,
          pageno: page,
          safesearch: filters.safesearch as 0 | 1 | 2,
          language: filters.language === 'auto' ? undefined : filters.language,
          categories: filters.category === 'general' ? undefined : filters.category,
          time_range: filters.timeRange === 'anytime' ? undefined : filters.timeRange as 'day' | 'week' | 'month' | 'year',
          engines: filters.engines || undefined
        })
      ];

      // Only search Wikipedia on page 1
      if (page === 1) {
        searchPromises.push(searchWikipedia(query, filters.language === 'auto' ? 'en' : filters.language));
      }

      const results = await Promise.allSettled(searchPromises);
      
      if (results[0].status === 'fulfilled') {
        const searchData = results[0].value;
        setResults(searchData);
        
        // Estimate total pages based on number of results (assuming ~10 results per page)
        const resultsPerPage = 10;
        const estimatedTotalPages = Math.min(Math.ceil(searchData.number_of_results / resultsPerPage), 10); // Cap at 10 pages
        setTotalPages(estimatedTotalPages);
      } else {
        throw results[0].reason;
      }
      
      // Handle Wikipedia results only if we searched for them (page 1)
      if (page === 1 && results[1]) {
        if (results[1].status === 'fulfilled' && results[1].value) {
          setWikipediaResults(results[1].value);
        } else {
          setWikipediaResults(null);
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  // Auto-complete functionality
  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    
    if (value.length >= 1) {
      try {
        // Get history suggestions first
        const historySuggestions = getHistorySuggestions(value);
        
        // Get API suggestions if query is long enough
        const apiSuggestions = value.length >= 2 ? await getAutocompleteSuggestions(value) : [];
        
        // Combine history and API suggestions, prioritizing history
        const combinedSuggestions = [
          ...historySuggestions,
          ...apiSuggestions.filter(s => !historySuggestions.includes(s))
        ].slice(0, 8);
        
        setSuggestions(combinedSuggestions);
        setShowSuggestions(combinedSuggestions.length > 0);
      } catch (err) {
        const historySuggestions = getHistorySuggestions(value);
        setSuggestions(historySuggestions);
        setShowSuggestions(historySuggestions.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const updateFiltersAndSearch = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Save filters to localStorage
    localStorage.setItem('enzonic_search_filters', JSON.stringify(updatedFilters));
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
      setSearchParams(params);
      performSearch(searchQuery.trim());
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    if (query) {
      setSearchQuery(query);
      setCurrentPage(page);
      performSearch(query, page);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      params.set('page', '1'); // Reset to page 1 for new searches
      
      // Include current filters in URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
          params.set(key, value.toString());
        }
      });
      
      setSearchParams(params);
      performSearch(searchQuery.trim(), 1);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    const params = new URLSearchParams();
    params.set('q', suggestion);
    params.set('page', '1'); // Reset to page 1 for new searches
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    setSearchParams(params);
    performSearch(suggestion, 1);
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  // Get favicon URL for website
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch {
      return null;
    }
  };

  // Load search history from localStorage
  const loadSearchHistory = (): string[] => {
    try {
      const saved = localStorage.getItem('enzonic_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Save search to history
  const saveSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const history = loadSearchHistory();
    const updatedHistory = [query, ...history.filter(h => h !== query)].slice(0, 20); // Keep last 20 searches
    
    localStorage.setItem('enzonic_search_history', JSON.stringify(updatedHistory));
    setSearchHistory(updatedHistory);
  };

  // Get search suggestions from history
  const getHistorySuggestions = (query: string): string[] => {
    if (!query.trim()) return [];
    
    return searchHistory.filter(h => 
      h.toLowerCase().includes(query.toLowerCase()) && h.toLowerCase() !== query.toLowerCase()
    ).slice(0, 3);
  };

  // Categories configuration
  const categories = [
    { id: 'general', label: 'All', icon: Search },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'map', label: 'Maps', icon: Map },
  ];



  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-gradient-to-br from-background to-primary/5">
      {/* Combined Header with Search */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        {/* Main Search Bar */}
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
                Enzonic Search
              </h1>
            </Link>

            {/* Search Bar with Autocomplete */}
            <div className="flex-1 max-w-2xl relative">
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
                      className="pl-12 pr-16 py-3 rounded-full border-0 bg-transparent focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
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

            {/* Right side buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* AppGrid Button */}
              <Dialog open={showAppGrid} onOpenChange={setShowAppGrid}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 hover:bg-primary/10"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
                  <AppGrid />
                </DialogContent>
              </Dialog>

              {/* Account Button */}
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all"
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 hover:bg-primary/10"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>

          </div>
        </div>

        {/* Categories and Filters */}
        <div className="border-t border-border/50">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Category Tabs */}
              <Tabs 
                value={filters.category} 
                onValueChange={(value) => updateFiltersAndSearch({ category: value })}
                className="flex-1"
              >
                <TabsList className="bg-transparent h-auto p-0 space-x-1">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                        {category.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>


            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Column - Search Results */}
          <div className="flex-1 max-w-4xl">
            {/* Search Stats */}
            {results && !loading && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {results.results.length.toLocaleString()} results for "{results.query}"
                  {filters.category !== 'general' && ` in ${categories.find(c => c.id === filters.category)?.label}`}
                </p>
              </div>
            )}



        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">


            {/* Query Suggestions */}
            {results.suggestions && results.suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Did you mean:</h3>
                <div className="flex flex-wrap gap-2">
                  {results.suggestions.slice(0, 5).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results - Different layouts based on category */}
            {filters.category === 'images' ? (
              // Image Grid Layout
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.results.map((result, index) => (
                  <div key={index} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted hover:shadow-lg transition-all cursor-pointer">
                      {result.img_src || result.thumbnail ? (
                        <img
                          src={result.img_src || result.thumbnail}
                          alt={result.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onClick={() => {
                            setSelectedImage(result);
                            setShowImageModal(true);
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          onClick={() => {
                            setSelectedImage(result);
                            setShowImageModal(true);
                          }}
                        >
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedImage(result);
                              setShowImageModal(true);
                            }}
                          >
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium truncate">
                            {result.title}
                          </p>
                          <p className="text-white/70 text-xs truncate">
                            {formatUrl(result.url)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filters.category === 'videos' ? (
              // Video Grid Layout
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.results.map((result, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-shadow border border-border/50 hover:border-primary/20">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                        {result.thumbnail || result.img_src ? (
                          <img
                            src={result.thumbnail || result.img_src}
                            alt={result.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="truncate">{formatUrl(result.url)}</span>
                        </div>
                        {result.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.content}
                          </p>
                        )}
                      </CardContent>
                    </a>
                  </Card>
                ))}
              </div>
            ) : (
              // Default List Layout for other categories
              <div className="space-y-6">
                {results.results.map((result, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow border border-border/50 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {/* URL with Favicon */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getFaviconUrl(result.url) ? (
                            <img
                              src={getFaviconUrl(result.url)!}
                              alt=""
                              className="h-3 w-3 rounded-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Globe className="h-3 w-3 hidden" />
                          <span className="truncate">{formatUrl(result.url)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-medium">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                          >
                            {result.title}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </h3>

                        {/* Content */}
                        <p className="text-muted-foreground leading-relaxed">
                          {result.content}
                        </p>

                        {/* Thumbnail */}
                        {result.thumbnail && (
                          <div className="mt-3">
                            <img
                              src={result.thumbnail}
                              alt=""
                              className="w-20 h-20 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {results.results.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Pagination */}
            {results && results.results.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-8 mb-6">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || loading}
                    onClick={() => performSearch(searchQuery, currentPage - 1)}
                    className="flex items-center gap-2"
                  >
                    ← Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          disabled={loading}
                          onClick={() => performSearch(searchQuery, pageNum)}
                          className="w-9 h-9 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || loading}
                    onClick={() => performSearch(searchQuery, currentPage + 1)}
                    className="flex items-center gap-2"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Right Sidebar - Wikipedia Info */}
        {results && !loading && wikipediaResults && wikipediaResults.results.length > 0 && filters.category === 'general' && (
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24">
              {wikipediaResults.results.slice(0, 1).map((wikiResult, index) => (
                <Card key={index} className="border border-primary/20 bg-background/95 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Wikipedia Header */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Wikipedia</span>
                      </div>

                      {/* Title and Image */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg leading-tight">
                          {wikiResult.title}
                        </h3>
                        
                        {/* Wikipedia Image - Enhanced */}
                        {(wikiResult.img_src || wikiResult.thumbnail) && (
                          <div className="w-full">
                            <div className="relative group">
                              <img
                                src={wikiResult.img_src || wikiResult.thumbnail}
                                alt={wikiResult.title}
                                className="w-full h-40 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                            </div>
                          </div>
                        )}
                        
                        {/* Content/Summary - Enhanced */}
                        {wikiResult.content && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-8">
                              {wikiResult.content}
                            </p>
                            
                            {/* Additional Info */}
                            <div className="pt-2 space-y-2">
                              {/* URL Info */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Globe className="h-3 w-3" />
                                <span>{formatUrl(wikiResult.url)}</span>
                              </div>
                              
                              {/* Last Updated (if available in parsed_url) */}
                              {wikiResult.parsed_url && wikiResult.parsed_url.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Recently updated</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wikipedia Link */}
                      <div className="pt-2 border-t">
                        <a
                          href={wikiResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Read more on Wikipedia
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>


                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        </div>
      </main>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
          {selectedImage && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Image Display */}
              <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[50vh] md:min-h-[70vh]">
                {selectedImage.img_src || selectedImage.thumbnail ? (
                  <img
                    src={selectedImage.img_src || selectedImage.thumbnail}
                    alt={selectedImage.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <Image className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Metadata Panel */}
              <div className="w-full md:w-80 bg-background border-l">
                <DialogHeader className="p-4 pb-2 border-b">
                  <DialogTitle className="text-lg font-semibold line-clamp-2">
                    {selectedImage.title}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(70vh-6rem)] p-4">
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedImage.url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Source
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const imageUrl = selectedImage.img_src || selectedImage.thumbnail;
                          if (imageUrl) {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = selectedImage.title || 'image';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const imageUrl = selectedImage.img_src || selectedImage.thumbnail;
                          if (imageUrl && navigator.clipboard) {
                            navigator.clipboard.writeText(imageUrl);
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: selectedImage.title,
                              url: selectedImage.url
                            });
                          }
                        }}
                      >
                        <Share className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Info className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">Details</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-1">
                            <span className="font-medium">Source:</span>{' '}
                            {formatUrl(selectedImage.url)}
                          </p>
                          {selectedImage.engine && (
                            <p className="mb-1 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span className="font-medium">Engine:</span>{' '}
                              {selectedImage.engine}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedImage.content && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">Description</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedImage.content}
                          </p>
                        </div>
                      )}

                      {/* Image URL */}
                      {(selectedImage.img_src || selectedImage.thumbnail) && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">Image URL</span>
                          </div>
                          <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                            {selectedImage.img_src || selectedImage.thumbnail}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SearchResults;