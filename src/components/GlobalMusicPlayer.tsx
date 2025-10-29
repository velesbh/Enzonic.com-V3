import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  X,
  Music,
  Maximize2,
} from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/lib/utils';

interface GlobalMusicPlayerProps {
  onLike?: (songId: string) => void;
  isLiked?: boolean;
}

export function GlobalMusicPlayer({ onLike, isLiked }: GlobalMusicPlayerProps) {
  const {
    currentSong,
    playlist,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isShuffle,
    isRepeat,
    isBuffering,
    bufferingState,
    audioRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setIsMuted,
    playNext,
    playPrevious,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    setIsFullScreenPlayerOpen,
    isFullScreenPlayerOpen,
    preloadQueue,
  } = useMusicPlayer();

  const [showPlayer, setShowPlayer] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  // Show player when there's a current song OR when we have a playlist, but not when fullscreen player is open
  useEffect(() => {
    setShowPlayer((!!currentSong || (playlist && playlist.length > 0)) && !isFullScreenPlayerOpen);
  }, [currentSong, playlist, isFullScreenPlayerOpen]);

  // Update preloading state based on preload queue
  useEffect(() => {
    const hasPreloading = Array.from(preloadQueue.values()).some(item => item.status === 'loading');
    setIsPreloading(hasPreloading);
  }, [preloadQueue]);

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      // Seek to persisted currentTime after metadata is loaded
      if (currentTime > 0 && currentTime < audioRef.current.duration) {
        audioRef.current.currentTime = currentTime;
      }
    }
  };

  // Seek to currentTime when it changes (e.g., from localStorage)
  useEffect(() => {
    if (audioRef.current && duration > 0 && currentTime > 0 && currentTime < duration) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, duration]);

  // Handle ended
  const handleEnded = () => {
    if (isRepeat && currentSong) {
      audioRef.current?.play().catch(console.error);
    } else {
      playNext();
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    const time = value[0];
    seekTo(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolumeLevel(value[0]);
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showPlayer) {
    return null;
  }

  // Show placeholder when no current song but we have a playlist
  const displaySong = currentSong || (playlist && playlist.length > 0 ? playlist[0] : null);

  return (
    <>
      {/* Floating Player Container */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900/95 border border-zinc-800/50 backdrop-blur-sm rounded-full shadow-lg overflow-hidden">
        {/* Subtle Background Image */}
        {displaySong?.cover_image_url && (
          <div className="absolute inset-0 opacity-10 rounded-full">
            <img
              src={displaySong.cover_image_url}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-200 rounded-full"
            />
          </div>
        )}

        <div className="relative flex items-center h-14 px-6 gap-4 min-w-[500px] max-w-[700px]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPlayer(false)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Album Art */}
          <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
            {displaySong?.cover_image_url ? (
              <img
                src={displaySong.cover_image_url}
                alt={displaySong.title || 'Unknown Song'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center rounded-md">
                <Music className="h-5 w-5 text-zinc-400" />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {displaySong?.title || 'No song selected'}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {displaySong?.artist_name || 'Select a song to play'}
            </p>
          </div>

          {/* Minimal Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrevious}
              disabled={!currentSong}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full disabled:opacity-50"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              onClick={togglePlay}
              disabled={isBuffering || !currentSong}
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {isBuffering ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
              ) : isPreloading && !isPlaying ? (
                <div className="flex items-center gap-1">
                  <div className="animate-pulse w-2 h-2 bg-black rounded-full" />
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              ) : isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={playNext}
              disabled={!currentSong}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-24 mx-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={!currentSong}
              className="cursor-pointer"
            />
          </div>

          {/* Time Display */}
          <div className="text-xs text-zinc-400 tabular-nums flex-shrink-0 mr-2 min-w-[40px]">
            {currentSong ? formatTime(currentTime) : '0:00'}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              disabled={!currentSong}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full disabled:opacity-50"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              disabled={!currentSong}
              className="w-16"
            />
          </div>

          {/* Like Button */}
          {onLike && displaySong && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onLike(displaySong.id);
              }}
              className="h-8 w-8 text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50 rounded-full flex-shrink-0"
            >
              <Heart className={cn(
                "h-4 w-4 transition-all",
                isLiked && "fill-green-400 text-green-400"
              )} />
            </Button>
          )}

          {/* Maximize Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreenPlayerOpen(true)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full flex-shrink-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}