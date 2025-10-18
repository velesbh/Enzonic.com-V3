import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, ExternalLink, Maximize2 } from "lucide-react";
import { SearchResult } from "@/lib/searxngApi";

interface MediaCarouselProps {
  results: SearchResult[];
  onImageClick?: (result: SearchResult) => void;
}

const MediaCarousel = ({ results, onImageClick }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use all provided results (already filtered for media)
  const mediaItems = results;

  if (mediaItems.length === 0) {
    return null;
  }

  // Show 6 items at a time on desktop, 3 on tablet, 2 on mobile
  const itemsPerView = {
    mobile: 2,
    tablet: 3,
    desktop: 6
  };

  const maxIndex = Math.max(0, mediaItems.length - itemsPerView.desktop);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const getMediaType = (item: SearchResult): 'image' | 'video' => {
    if (item.category === 'videos' || item.url.includes('youtube') || item.url.includes('vimeo')) {
      return 'video';
    }
    return 'image';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Media Results</h3>
          <Badge variant="secondary" className="text-xs">
            {mediaItems.length}
          </Badge>
        </div>
        
        {mediaItems.length > itemsPerView.desktop && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground mx-2">
              {currentIndex + 1} - {Math.min(currentIndex + itemsPerView.desktop, mediaItems.length)} of {mediaItems.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex gap-3 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView.desktop)}%)` }}
        >
          {mediaItems.map((item, index) => {
            const mediaType = getMediaType(item);
            const thumbnailUrl = item.img_src || item.thumbnail;

            return (
              <Card 
                key={index}
                className="flex-shrink-0 w-1/2 sm:w-1/3 lg:w-1/6 border-border/50 hover:border-primary/20 hover:shadow-lg transition-all group overflow-hidden"
                style={{ minWidth: `calc(${100 / itemsPerView.desktop}% - 0.75rem)` }}
              >
                <CardContent className="p-0">
                  {/* Media Display */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <Video className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            mediaType === 'video' 
                              ? 'bg-red-500/90 text-white' 
                              : 'bg-blue-500/90 text-white'
                          }`}
                        >
                          {mediaType === 'video' ? (
                            <><Video className="h-3 w-3 mr-1" /> Video</>
                          ) : (
                            <><ImageIcon className="h-3 w-3 mr-1" /> Image</>
                          )}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {mediaType === 'image' && onImageClick && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                            onClick={(e) => {
                              e.preventDefault();
                              onImageClick(item);
                            }}
                          >
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(item.url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Play Button for Videos */}
                      {mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Info */}
                  <div className="p-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1">
                        {item.title}
                      </h4>
                      {item.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.content}
                        </p>
                      )}
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MediaCarousel;
