import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Search, Navigation, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { SearchResult } from "@/lib/searxngApi";

interface OpenStreetMapProps {
  query: string;
  results?: SearchResult[];
}

const OpenStreetMap = ({ query, results }: OpenStreetMapProps) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [mapLocations, setMapLocations] = useState<Array<{ lat: number; lon: number; name: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<number>(0);

  // Extract location data from SearXNG results
  const extractLocationsFromResults = (searchResults: SearchResult[]) => {
    const locations: Array<{ lat: number; lon: number; name: string; url: string }> = [];

    searchResults.forEach(result => {
      // Try to extract coordinates from the URL or content
      // OpenStreetMap URLs typically contain coordinates like: ?mlat=40.7128&mlon=-74.0060
      const urlMatch = result.url.match(/[?&]mlat=([-\d.]+)&mlon=([-\d.]+)/);
      
      if (urlMatch) {
        locations.push({
          lat: parseFloat(urlMatch[1]),
          lon: parseFloat(urlMatch[2]),
          name: result.title,
          url: result.url
        });
      } else {
        // Try to extract from content (some map results include coordinates in content)
        const contentMatch = result.content.match(/([-\d.]+)[,\s]+([-\d.]+)/);
        if (contentMatch) {
          const lat = parseFloat(contentMatch[1]);
          const lon = parseFloat(contentMatch[2]);
          
          // Validate coordinates are in valid range
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            locations.push({
              lat,
              lon,
              name: result.title,
              url: result.url
            });
          }
        }
      }
    });

    return locations;
  };

  // Geocode the search query using Nominatim (OpenStreetMap's geocoding service)
  const geocodeQuery = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Enzonic Search Engine'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to geocode location');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        setLocation({
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          name: result.display_name
        });
        setMapLocations([]);
        setSelectedLocation(0);
      } else {
        setError('Location not found. Please try a different search term.');
        setLocation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find location');
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
              headers: {
                'User-Agent': 'Enzonic Search Engine'
              }
            }
          );

          const data = await response.json();

          setLocation({
            lat,
            lon,
            name: data.display_name || 'Your Location'
          });
        } catch (err) {
          // Even if reverse geocoding fails, still show the location
          setLocation({
            lat,
            lon,
            name: 'Your Location'
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Unable to get your location: ' + err.message);
        setLoading(false);
      }
    );
  };

  // Process SearXNG results if available
  useEffect(() => {
    if (results && results.length > 0) {
      const locations = extractLocationsFromResults(results);
      
      if (locations.length > 0) {
        setMapLocations(locations);
        setLocation({
          lat: locations[0].lat,
          lon: locations[0].lon,
          name: locations[0].name
        });
        setSelectedLocation(0);
        setError(null);
      } else {
        // If no coordinates found in results, try geocoding the query
        geocodeQuery(query);
      }
    } else if (query && query.trim()) {
      // No results provided, use geocoding
      geocodeQuery(query);
    }
  }, [results]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeQuery(searchQuery);
  };

  // Generate OpenStreetMap embed URL
  const getMapEmbedUrl = () => {
    if (!location) return '';

    const zoom = 15;
    const { lat, lon } = location;

    // Using OpenStreetMap embed with marker
    // We'll use iframe with OSM's standard tile server
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={loading}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                My Location
              </Button>
              {location && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </CardContent>
        </Card>
      )}

      {/* Map Display */}
      {location && !loading && (
        <div className="space-y-4">
          {/* Multiple Locations from SearXNG Results */}
          {mapLocations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapLocations.map((loc, index) => (
                <Card 
                  key={index}
                  className={`border-primary/20 cursor-pointer transition-all hover:shadow-lg ${
                    selectedLocation === index ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedLocation(index);
                    setLocation({
                      lat: loc.lat,
                      lon: loc.lon,
                      name: loc.name
                    });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        selectedLocation === index ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                      }`}>
                        <MapPin className={`h-4 w-4 ${
                          selectedLocation === index ? 'text-primary-foreground' : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{loc.name}</h3>
                        <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                          <span>{loc.lat.toFixed(4)}</span>
                          <span>{loc.lon.toFixed(4)}</span>
                        </div>
                        <a
                          href={loc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View source
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Single Location Info (when geocoded or no SearXNG results) */}
          {mapLocations.length === 0 && (
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Location Found</h3>
                    <p className="text-sm text-muted-foreground mb-2">{location.name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Lon: {location.lon.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Embed */}
          <Card className="border-primary/20 overflow-hidden">
            <iframe
              src={getMapEmbedUrl()}
              className={`w-full border-0 ${isFullscreen ? 'h-[80vh]' : 'h-[500px]'} transition-all`}
              allowFullScreen
              loading="lazy"
              title={`Map of ${location.name}`}
            />
          </Card>

          {/* Map Links */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}&zoom=15`, '_blank')}
            >
              View on OpenStreetMap
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`, '_blank')}
            >
              View on Google Maps
            </Button>
          </div>

          {/* Additional SearXNG Results (without coordinates) */}
          {results && results.length > mapLocations.length && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Related Map Results</h3>
              {results.filter((_, index) => index >= mapLocations.length).map((result, index) => (
                <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                        >
                          {result.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </h4>
                      {result.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </p>
                      )}
                      {result.thumbnail && (
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="w-full h-32 object-cover rounded border"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!location && !loading && !error && (
        <Card className="border-primary/20">
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Search for a Location</h3>
            <p className="text-muted-foreground mb-4">
              Enter an address, city, landmark, or place name above
            </p>
            <p className="text-sm text-muted-foreground">
              or click "My Location" to see where you are
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpenStreetMap;
