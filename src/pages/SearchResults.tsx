import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SearXNGAnswers from "@/components/SearXNGAnswers";
import InstantAnswers from "@/components/InstantAnswers";
import OpenStreetMap from "@/components/OpenStreetMap";
import MediaCarousel from "@/components/MediaCarousel";
import SearchLoadingOverlay from "@/components/SearchLoadingOverlay";
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
  Grid3X3,
  Moon,
  Sun,
  Brain,
  Server,
  Languages,
  Tv,
  HelpCircle
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import AppGrid from "@/components/AppGrid";
import { useTheme } from "@/components/ThemeProvider";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
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
  const { theme, setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]); // Autocomplete suggestions
  const [didYouMeanSuggestions, setDidYouMeanSuggestions] = useState<string[]>([]); // "Did you mean" suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [wikipediaResults, setWikipediaResults] = useState<SearchResponse | null>(null);
  const [mediaResults, setMediaResults] = useState<SearchResult[]>([]);
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

  // Keep a controller ref to cancel background progressive loads
  const progressiveControllerRef = useRef<AbortController | null>(null);

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

    // Cancel any previous progressive loads
    if (progressiveControllerRef.current) {
      progressiveControllerRef.current.abort();
      progressiveControllerRef.current = null;
    }

    // New abort controller used for background page fetching
    const progressiveController = new AbortController();
    progressiveControllerRef.current = progressiveController;

    try {
      // Perform both general search and Wikipedia search in parallel (Wikipedia only on page 1)
      const searchPromises = [
        searchWeb({
          q: query,
          pageno: page,
          safesearch: filters.safesearch as 0 | 1 | 2,
          language: filters.language === 'auto' ? undefined : filters.language,
          categories: filters.category,
          time_range: filters.timeRange === 'anytime' ? undefined : filters.timeRange as 'day' | 'week' | 'month' | 'year',
          engines: filters.engines || undefined,
          signal: progressiveController.signal,
        })
      ];

      // Only search Wikipedia and media on page 1
      if (page === 1) {
        searchPromises.push(searchWikipedia(query, filters.language === 'auto' ? 'en' : filters.language));
        
        // Fetch images for carousel (only if general category)
        if (filters.category === 'general') {
          searchPromises.push(
            searchWeb({
              q: query,
              pageno: 1,
              safesearch: filters.safesearch as 0 | 1 | 2,
              language: filters.language === 'auto' ? undefined : filters.language,
              categories: 'images',
              time_range: filters.timeRange === 'anytime' ? undefined : filters.timeRange as 'day' | 'week' | 'month' | 'year',
            })
          );
          
          // Fetch videos for carousel
          searchPromises.push(
            searchWeb({
              q: query,
              pageno: 1,
              safesearch: filters.safesearch as 0 | 1 | 2,
              language: filters.language === 'auto' ? undefined : filters.language,
              categories: 'videos',
              time_range: filters.timeRange === 'anytime' ? undefined : filters.timeRange as 'day' | 'week' | 'month' | 'year',
            })
          );
        }
        
        // Also fetch "Did you mean" suggestions on page 1
        getAutocompleteSuggestions(query).then(autoSuggestions => {
          // Filter out the exact query and limit to 5 suggestions
          const filteredSuggestions = autoSuggestions
            .filter(s => s.toLowerCase() !== query.toLowerCase())
            .slice(0, 5);
          setDidYouMeanSuggestions(filteredSuggestions);
        }).catch(err => {
          console.error('Failed to fetch did-you-mean suggestions:', err);
          setDidYouMeanSuggestions([]);
        });
      }

      const results = await Promise.allSettled(searchPromises);

      if (results[0].status === 'fulfilled') {
        const searchData = results[0].value;
        
        // Only set results if we actually got data
        if (searchData && searchData.results) {
          setResults(searchData);

          // Estimate total pages based on number of results (SearXNG returns ~20 results per page)
          const resultsPerPage = 20;
          const estimatedTotalPages = Math.max(1, Math.min(Math.ceil(searchData.number_of_results / resultsPerPage), 10)); // At least 1 page, cap at 10 pages
          setTotalPages(estimatedTotalPages);

          // Progressive background fetch - only fetch 1 additional page (total 2 pages = 40 results)
          const pagesToFetch = Math.min(estimatedTotalPages, 2);
          if (pagesToFetch > 1) {
            setLoadingMore(true);
            // run background fetches sequentially to allow fast incremental rendering and lower API pressure
            (async () => {
              try {
                for (let p = 2; p <= pagesToFetch; p++) {
                  // abort if controller is gone
                  if (!progressiveControllerRef.current) break;
                  try {
                    const pageData = await searchWeb({
                      q: query,
                      pageno: p,
                      safesearch: filters.safesearch as 0 | 1 | 2,
                      language: filters.language === 'auto' ? undefined : filters.language,
                      categories: filters.category,
                      time_range: filters.timeRange === 'anytime' ? undefined : filters.timeRange as 'day' | 'week' | 'month' | 'year',
                      engines: filters.engines || undefined,
                      signal: progressiveController.signal,
                    });

                    // Append new results while deduplicating by url
                    setResults((prev) => {
                      if (!prev) return pageData;
                      const existingUrls = new Set(prev.results.map(r => r.url));
                      const newItems = pageData.results.filter(r => !existingUrls.has(r.url));
                      return {
                        ...prev,
                        results: [...prev.results, ...newItems],
                        number_of_results: prev.number_of_results + newItems.length,
                      } as SearchResponse;
                    });
                  } catch (err) {
                    // If aborted, stop background fetching
                    if ((err as any)?.name === 'AbortError') break;
                    console.warn('Background page fetch failed for page', p, err);
                  }
                }
              } finally {
                setLoadingMore(false);
              }
            })();
          }
        } else {
          // No results found, but not necessarily an error
          setResults({ query, number_of_results: 0, results: [], answers: [], corrections: [], infoboxes: [], suggestions: [], unresponsive_engines: [] });
        }
      } else {
        // Only show error if it's a real network/API error, not just empty results
        console.warn('Search request failed:', results[0].reason);
        setResults({ query, number_of_results: 0, results: [], answers: [], corrections: [], infoboxes: [], suggestions: [], unresponsive_engines: [] });
      }
      
  // Handle Wikipedia, images, and videos results only if we searched for them (page 1)
      if (page === 1) {
        // Wikipedia results (index 1)
        if (results[1] && results[1].status === 'fulfilled' && results[1].value) {
          setWikipediaResults(results[1].value);
        } else {
          setWikipediaResults(null);
        }
        
        // Combine images and videos for media carousel (only if general category)
        if (filters.category === 'general') {
          const mediaItems: SearchResult[] = [];
          
          // Images (index 2) - Take up to 12 images
          if (results[2] && results[2].status === 'fulfilled' && results[2].value) {
            mediaItems.push(...results[2].value.results.slice(0, 12));
          }
          
          // Videos (index 3) - Take up to 12 videos
          if (results[3] && results[3].status === 'fulfilled' && results[3].value) {
            mediaItems.push(...results[3].value.results.slice(0, 12));
          }
          
          setMediaResults(mediaItems);
        } else {
          setMediaResults([]);
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
        
        // Get API suggestions if query is long enough (using Google autocomplete)
        const apiSuggestions = value.length >= 2 ? await getAutocompleteSuggestions(value, 'google') : [];
        
        // Combine history and API suggestions, prioritizing history
        const combinedSuggestions = [
          ...historySuggestions,
          ...apiSuggestions.filter(s => !historySuggestions.includes(s))
        ].slice(0, 8); // Show up to 8 suggestions
        
        setSuggestions(combinedSuggestions);
        setShowSuggestions(combinedSuggestions.length > 0);
      } catch (err) {
        // Fallback to just history suggestions if API fails
        const historySuggestions = getHistorySuggestions(value);
        setSuggestions(historySuggestions);
        setShowSuggestions(historySuggestions.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const updateFiltersAndSearch = async (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Save filters to localStorage
    localStorage.setItem('enzonic_search_filters', JSON.stringify(updatedFilters));
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset to page 1 when filters change
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== 'general' && value !== 'auto' && value !== 'anytime' && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // cancel any background progressive loads before performing filter search
    if (progressiveControllerRef.current) {
      progressiveControllerRef.current.abort();
      progressiveControllerRef.current = null;
    }

    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
      setSearchParams(params);
      
      // Perform search immediately with updated filters
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        const searchPromises = [
          searchWeb({
            q: searchQuery.trim(),
            pageno: 1,
            safesearch: updatedFilters.safesearch as 0 | 1 | 2,
            language: updatedFilters.language === 'auto' ? undefined : updatedFilters.language,
            categories: updatedFilters.category,
            time_range: updatedFilters.timeRange === 'anytime' ? undefined : updatedFilters.timeRange as 'day' | 'week' | 'month' | 'year',
            engines: updatedFilters.engines || undefined
          }),
          searchWikipedia(searchQuery.trim(), updatedFilters.language === 'auto' ? 'en' : updatedFilters.language)
        ];

        // Add media searches if general category
        if (updatedFilters.category === 'general') {
          searchPromises.push(
            searchWeb({
              q: searchQuery.trim(),
              pageno: 1,
              safesearch: updatedFilters.safesearch as 0 | 1 | 2,
              language: updatedFilters.language === 'auto' ? undefined : updatedFilters.language,
              categories: 'images',
              time_range: updatedFilters.timeRange === 'anytime' ? undefined : updatedFilters.timeRange as 'day' | 'week' | 'month' | 'year',
            })
          );
          
          searchPromises.push(
            searchWeb({
              q: searchQuery.trim(),
              pageno: 1,
              safesearch: updatedFilters.safesearch as 0 | 1 | 2,
              language: updatedFilters.language === 'auto' ? undefined : updatedFilters.language,
              categories: 'videos',
              time_range: updatedFilters.timeRange === 'anytime' ? undefined : updatedFilters.timeRange as 'day' | 'week' | 'month' | 'year',
            })
          );
        }

        const results = await Promise.allSettled(searchPromises);
        
        if (results[0].status === 'fulfilled') {
          const searchData = results[0].value;
          
          if (searchData && searchData.results) {
            setResults(searchData);
            
            const resultsPerPage = 20;
            const estimatedTotalPages = Math.max(1, Math.min(Math.ceil(searchData.number_of_results / resultsPerPage), 10));
            setTotalPages(estimatedTotalPages);
          } else {
            setResults({ query: searchQuery.trim(), number_of_results: 0, results: [], answers: [], corrections: [], infoboxes: [], suggestions: [], unresponsive_engines: [] });
          }
        } else {
          console.warn('Filter search failed:', results[0].reason);
          setResults({ query: searchQuery.trim(), number_of_results: 0, results: [], answers: [], corrections: [], infoboxes: [], suggestions: [], unresponsive_engines: [] });
        }
        
        if (results[1].status === 'fulfilled' && results[1].value) {
          setWikipediaResults(results[1].value);
        } else {
          setWikipediaResults(null);
        }
        
        // Handle media results for general category
        if (updatedFilters.category === 'general') {
          const mediaItems: SearchResult[] = [];
          
          if (results[2] && results[2].status === 'fulfilled' && results[2].value) {
            mediaItems.push(...results[2].value.results.slice(0, 12));
          }
          
          if (results[3] && results[3].status === 'fulfilled' && results[3].value) {
            mediaItems.push(...results[3].value.results.slice(0, 12));
          }
          
          setMediaResults(mediaItems);
        } else {
          setMediaResults([]);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while searching');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cleanup on unmount - abort any in-progress progressive fetches
  useEffect(() => {
    return () => {
      if (progressiveControllerRef.current) {
        progressiveControllerRef.current.abort();
        progressiveControllerRef.current = null;
      }
    };
  }, []);

  // Detect language from search query text
  const detectLanguage = (text: string): string => {
    // Character ranges for different scripts
    const patterns = {
      // Arabic script
      ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
      // Chinese characters (Simplified & Traditional)
      zh: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
      // Japanese (Hiragana, Katakana, Kanji)
      ja: /[\u3040-\u309F\u30A0-\u30FF]/,
      // Korean (Hangul)
      ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
      // Russian/Cyrillic
      ru: /[\u0400-\u04FF]/,
      // Hindi/Devanagari
      hi: /[\u0900-\u097F]/,
      // Greek
      el: /[\u0370-\u03FF]/,
      // Hebrew
      he: /[\u0590-\u05FF]/,
    };

    // Check for non-Latin scripts first (more distinctive)
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // For Latin scripts, check for distinctive patterns
    const lowerText = text.toLowerCase();
    
    // Spanish: ñ, ¿, ¡, or common words
    if (/[ñáéíóúü¿¡]/.test(lowerText) || /\b(el|la|de|que|y|es|en|un|para|por|como|con|no|una|su)\b/.test(lowerText)) {
      return 'es';
    }
    
    // French: common accents and words
    if (/[àâæçèéêëîïôùûü]/.test(lowerText) || /\b(le|la|les|de|un|une|est|et|dans|pour|qui|avec|ce|il|au)\b/.test(lowerText)) {
      return 'fr';
    }
    
    // German: ä, ö, ü, ß or common words
    if (/[äöüß]/.test(lowerText) || /\b(der|die|das|und|in|von|zu|den|mit|ist|im|für|auf|des|dem)\b/.test(lowerText)) {
      return 'de';
    }
    
    // Italian: common words
    if (/\b(il|la|di|e|da|in|un|per|con|non|una|che|come|più|del|dei)\b/.test(lowerText)) {
      return 'it';
    }
    
    // Portuguese: ã, õ, ç or common words
    if (/[ãõç]/.test(lowerText) || /\b(o|a|os|as|de|da|do|em|para|com|que|não|um|uma|por|se|como)\b/.test(lowerText)) {
      return 'pt';
    }

    // Default to auto (let the search engine decide)
    return 'auto';
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
      
      // Detect language from search query
      const detectedLang = detectLanguage(searchQuery.trim());
      
      // Update filters with detected language if it's not auto
      let updatedFilters = { ...filters };
      if (detectedLang !== 'auto' && filters.language === 'auto') {
        updatedFilters.language = detectedLang;
        setFilters(updatedFilters);
        localStorage.setItem('enzonic_search_filters', JSON.stringify(updatedFilters));
      }
      
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      params.set('page', '1'); // Reset to page 1 for new searches
      
      // Include current filters in URL
      Object.entries(updatedFilters).forEach(([key, value]) => {
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

  // Get favicon URL for website - using DuckDuckGo's service (more reliable than Google)
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // DuckDuckGo's favicon service is more reliable and doesn't require API keys
      return `https://icons.duckduckgo.com/ip3/${urlObj.hostname}.ico`;
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col w-full overflow-x-hidden bg-gradient-to-br from-background to-primary/5">
      {/* Full-page loading overlay */}
      <SearchLoadingOverlay isLoading={loading} />
      
      {/* Use shared Navbar with floating behavior */}
      <Navbar />

      {/* Categories and Filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Category Tabs */}
              <Tabs 
                value={filters.category} 
                onValueChange={(value) => updateFiltersAndSearch({ category: value })}
                className="w-full sm:flex-1 overflow-x-auto"
              >
                <TabsList className="bg-transparent h-auto p-0 space-x-1 flex-nowrap w-full sm:w-auto">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">{category.label}</span>
                        <span className="sm:hidden">{category.label.substring(0, 3)}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* Filter Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {/* Language Filter */}
                <Select value={filters.language} onValueChange={(value) => updateFiltersAndSearch({ language: value })}>
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Any Language</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>

                {/* Time Range Filter */}
                <Select value={filters.timeRange} onValueChange={(value) => updateFiltersAndSearch({ timeRange: value })}>
                  <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anytime">Any time</SelectItem>
                    <SelectItem value="day">Past 24 hours</SelectItem>
                    <SelectItem value="week">Past week</SelectItem>
                    <SelectItem value="month">Past month</SelectItem>
                    <SelectItem value="year">Past year</SelectItem>
                  </SelectContent>
                </Select>

                {/* Safe Search Filter */}
                <Select value={filters.safesearch.toString()} onValueChange={(value) => updateFiltersAndSearch({ safesearch: parseInt(value) })}>
                  <SelectTrigger className="w-[90px] sm:w-[120px] h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Safe Search" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="1">Moderate</SelectItem>
                    <SelectItem value="2">Strict</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Column - Search Results */}
          <div className="flex-1 w-full lg:max-w-4xl">
            {/* Search Stats */}
            {results && !loading && (
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {results.results.length.toLocaleString()} results for "{results.query}"
                  {filters.category !== 'general' && ` in ${categories.find(c => c.id === filters.category)?.label}`}
                </p>
              </div>
            )}

            {/* Quick Access - Explore Enzonic's Services */}
            {results && !loading && (
              <Card className="mb-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-1">Quick Access</h2>
                    <p className="text-sm text-muted-foreground">Explore Enzonic's services</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Chatbot */}
                    <Link to="/chatbot">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 hover:from-purple-500/20 hover:to-indigo-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 group-hover:scale-110 transition-transform">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Enzonic Chatbot</h3>
                          <p className="text-xs text-muted-foreground">AI Assistant</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* Emi */}
                    <Link to="/emi">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-purple-600/10 hover:from-blue-500/20 hover:to-purple-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110 transition-transform">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Enzonic Emi</h3>
                          <p className="text-xs text-muted-foreground">AI Discord Bot</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* Boxes */}
                    <Link to="/boxes">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-green-500/50 bg-gradient-to-br from-green-500/10 to-teal-600/10 hover:from-green-500/20 hover:to-teal-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 group-hover:scale-110 transition-transform">
                              <Server className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Enzonic Boxes</h3>
                          <p className="text-xs text-muted-foreground">Virtual Machines</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* Translate */}
                    <Link to="/translate">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-600/10 hover:from-orange-500/20 hover:to-red-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 group-hover:scale-110 transition-transform">
                              <Languages className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Enzonic Translate</h3>
                          <p className="text-xs text-muted-foreground">AI Translation</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* Shows */}
                    <Link to="/shows">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-pink-500/50 bg-gradient-to-br from-pink-500/10 to-rose-600/10 hover:from-pink-500/20 hover:to-rose-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 group-hover:scale-110 transition-transform">
                              <Tv className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Shows</h3>
                          <p className="text-xs text-muted-foreground">Entertainment</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* About */}
                    <Link to="/about">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 hover:from-indigo-500/20 hover:to-blue-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 group-hover:scale-110 transition-transform">
                              <Info className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">About</h3>
                          <p className="text-xs text-muted-foreground">Learn More</p>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    {/* Support */}
                    <Link to="/support">
                      <Card className="group hover:shadow-lg transition-all hover:scale-105 border-border/50 hover:border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-green-600/10 hover:from-emerald-500/20 hover:to-green-600/20">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3 flex justify-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 group-hover:scale-110 transition-transform">
                              <HelpCircle className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">Support</h3>
                          <p className="text-xs text-muted-foreground">Get Help</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">

            {/* Query Suggestions (Did you mean) */}
            {didYouMeanSuggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Did you mean:</h3>
                <div className="flex flex-wrap gap-2">
                  {didYouMeanSuggestions.map((suggestion, index) => (
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

            {/* Media Carousel - Show images and videos at the top for general category */}
            {filters.category === 'general' && mediaResults.length > 0 && (
              <MediaCarousel 
                results={mediaResults} 
                onImageClick={(result) => {
                  setSelectedImage(result);
                  setShowImageModal(true);
                }}
              />
            )}

            {/* Search Results - Different layouts based on category */}
            <div className="flex items-center justify-between">
              <div className="flex-1" />
              {loadingMore && (
                <Badge variant="secondary" className="ml-4 flex items-center gap-1.5">
                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                  Loading more...
                </Badge>
              )}
            </div>

            {filters.category === 'map' ? (
              // Map View
              <OpenStreetMap query={searchQuery} results={results.results} />
            ) : filters.category === 'images' ? (
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
                            <>
                              <img
                                src={getFaviconUrl(result.url)!}
                                alt=""
                                className="h-3 w-3 rounded-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <Globe className="h-3 w-3" />
                            </>
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
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

            {/* Pagination - Bottom of Results */}
            {results && results.results.length > 0 && (
              <Card className="mt-8 mb-6 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Page Counter */}
                    <div className="text-sm text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{currentPage}</span> of <span className="font-semibold text-foreground">{Math.max(totalPages, 1)}</span>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <Button
                        variant="outline"
                        size="default"
                        disabled={currentPage === 1 || loading}
                        onClick={() => performSearch(searchQuery, currentPage - 1)}
                        className="flex items-center gap-2"
                      >
                        ← Previous
                      </Button>

                      {/* Page Numbers */}
                      <div className="hidden md:flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="default"
                              disabled={loading}
                              onClick={() => performSearch(searchQuery, pageNum)}
                              className="w-10 h-10 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <Button
                        variant="outline"
                        size="default"
                        disabled={currentPage === totalPages || loading}
                        onClick={() => performSearch(searchQuery, currentPage + 1)}
                        className="flex items-center gap-2"
                      >
                        Next →
                      </Button>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{results.results.length}</span> results
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        </div>

        {/* Right Sidebar - SearXNG Answers & Wikipedia Info */}
        {results && !loading && (
          (results.answers?.length > 0 || results.infoboxes?.length > 0 || (wikipediaResults && wikipediaResults.results.length > 0)) && 
          filters.category === 'general'
        ) && (
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              
              {/* SearXNG Instant Answers - Sidebar Version */}
              {(results.answers?.length > 0 || results.infoboxes?.length > 0) && (
                <SearXNGAnswers 
                  answers={results.answers || []} 
                  infoboxes={results.infoboxes || []}
                />
              )}

              {/* Custom Instant Answers (Calculator, Time, Translate, Converters) */}
              {searchQuery && (
                <InstantAnswers query={searchQuery} language={filters.language} />
              )}

              {/* Wikipedia Info Box */}
              {wikipediaResults && wikipediaResults.results.length > 0 && wikipediaResults.results.slice(0, 1).map((wikiResult, index) => (
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