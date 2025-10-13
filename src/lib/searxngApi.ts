import { env } from './env';

// Use backend proxy through Vite in development or configured API_URL in production
const API_BASE_URL = env.API_URL || '/api/search';

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  engine: string;
  parsed_url: string[];
  template: string;
  positions: number[];
  score: number;
  category: string;
  pretty_url: string;
  thumbnail?: string;
  img_src?: string;
}

export interface SearchResponse {
  query: string;
  number_of_results: number;
  results: SearchResult[];
  answers: any[];
  corrections: any[];
  infoboxes: any[];
  suggestions: string[];
  unresponsive_engines: string[];
}

export interface SearchOptions {
  q: string;
  categories?: string;
  engines?: string;
  language?: string;
  pageno?: number;
  time_range?: 'day' | 'week' | 'month' | 'year';
  safesearch?: 0 | 1 | 2;
}

export const searchWeb = async (options: SearchOptions): Promise<SearchResponse> => {
  const params = new URLSearchParams();
  
  // Add parameters
  params.append('q', options.q);
  if (options.categories) params.append('categories', options.categories);
  
  // Exclude Wikipedia from general searches to avoid duplication with Wikipedia sidebar
  if (options.engines) {
    params.append('engines', options.engines);
  } else {
    // Use engines that exclude Wikipedia for general searches
    params.append('engines', '!wikipedia');
  }
  
  if (options.language) params.append('language', options.language);
  if (options.pageno) params.append('pageno', options.pageno.toString());
  if (options.time_range) params.append('time_range', options.time_range);
  if (options.safesearch !== undefined) params.append('safesearch', options.safesearch.toString());

  try {
    const response = await fetch(`${API_BASE_URL}/web?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as SearchResponse;
  } catch (error) {
    console.error('Search API error:', error);
    throw new Error('Failed to search. Please try again later.');
  }
};

export const getAutocompleteSuggestions = async (query: string, service: string = 'google'): Promise<string[]> => {
  const params = new URLSearchParams({
    q: query,
    autocomplete: service
  });

  try {
    const response = await fetch(`${API_BASE_URL}/autocomplete?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Autocomplete failed: ${response.status}`);
    }

    const suggestions = await response.json();
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

export const searchWikipedia = async (query: string, language: string = 'en'): Promise<any> => {
  const params = new URLSearchParams({
    q: query,
    engines: 'wikipedia',
    language: language,
    categories: 'general'
  });

  try {
    const response = await fetch(`${API_BASE_URL}/web?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia search failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
};