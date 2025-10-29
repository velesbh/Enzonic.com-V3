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
  Music,
  Maximize2,
  Loader2,
  Minimize,
} from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/lib/utils';

interface NavbarMusicPlayerProps {
  onMaximize?: () => void;
}

export function NavbarMusicPlayer({ onMaximize }: NavbarMusicPlayerProps) {
  const {
    currentSong,
    playlist,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
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
    isNavbarPlayerMode,
    setIsNavbarPlayerMode,
    isFloatingPlayerDisabled,
    setIsFloatingPlayerDisabled,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Show player when there's a current song OR when we have a playlist, and navbar mode is active, but not when fullscreen player is open
  useEffect(() => {
    setShowPlayer((!!currentSong || (playlist && playlist.length > 0)) && isNavbarPlayerMode && !isFullScreenPlayerOpen);
  }, [currentSong, playlist, isNavbarPlayerMode, isFullScreenPlayerOpen]);

  // Update audio when song changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.file_url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentSong]);

  // Sync playing state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
    }
  };

  // Seek to currentTime when it changes
  useEffect(() => {
    if (audioRef.current && duration > 0 && currentTime > 0 && currentTime < duration) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, duration]);

  // Handle ended
  const handleEnded = () => {
    playNext();
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

  if (!showPlayer) return null;

  const displaySong = currentSong || (playlist && playlist.length > 0 ? playlist[0] : null);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
      />

      {/* Compact Navbar Player */}
      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 py-2 backdrop-blur-sm">
        {/* Album Art */}
        <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
          {displaySong?.cover_image_url ? (
            <img
              src={displaySong.cover_image_url}
              alt={displaySong.title || 'Album Art'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="min-w-0 flex-1 max-w-[120px]">
          <p className="text-sm font-medium truncate text-foreground">
            {displaySong?.title || 'No song selected'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {displaySong?.artist_name || 'Select a song'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={playPrevious}
            disabled={!currentSong}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
          >
            <SkipBack className="h-3 w-3" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            disabled={isBuffering || !currentSong}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isBuffering ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3 fill-current ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playNext}
            disabled={!currentSong}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-16 mx-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!currentSong}
            className="cursor-pointer"
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            disabled={!currentSong}
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Minimize Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsNavbarPlayerMode(false)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
        >
          <Minimize className="h-3 w-3" />
        </Button>

        {/* Show Floating Player Button */}
        {isFloatingPlayerDisabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFloatingPlayerDisabled(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
            title="Show floating player"
          >
            <Maximize2 className="h-3 w-3 rotate-180" />
          </Button>
        )}

        {/* Maximize Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsNavbarPlayerMode(false);
            setIsFullScreenPlayerOpen(true);
          }}
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    </>
  );
}