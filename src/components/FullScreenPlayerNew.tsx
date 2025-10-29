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
  Repeat,
  Shuffle,
  X,
  Music,
  Loader2,
  Minimize,
  MoreHorizontal,
} from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/lib/utils';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onLike?: (songId: string) => void;
  isLiked?: boolean;
}

export function FullScreenPlayer({
  isOpen,
  onClose,
  onLike,
  isLiked,
}: FullScreenPlayerProps) {
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
    toggleShuffle,
    toggleRepeat,
    setIsFullScreenPlayerOpen,
    preloadQueue,
  } = useMusicPlayer();

  const [isLoading, setIsLoading] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [showLyrics, setShowLyrics] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);

  // Update audio when song changes
  useEffect(() => {
    if (currentSong && audioRef.current && isOpen) {
      setIsLoading(true);
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Play error:', error);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentSong, isOpen]);

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);

      // Update current lyric if realtime lyrics available
      if (currentSong?.lyrics?.isRealtime && Array.isArray(currentSong.lyrics.data)) {
        const lyrics = currentSong.lyrics.data as Array<{ timestamp: number; text: string }>;
        const index = lyrics.findIndex((l, i) => {
          const nextTimestamp = lyrics[i + 1]?.timestamp ?? Infinity;
          return audioRef.current!.currentTime >= l.timestamp &&
                 audioRef.current!.currentTime < nextTimestamp;
        });
        setCurrentLyricIndex(index);
      }
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      // Seek to persisted currentTime after metadata is loaded
      if (currentTime > 0 && currentTime < audioRef.current.duration) {
        audioRef.current.currentTime = currentTime;
      }
    }
  };

  // Update preloading state based on preload queue
  useEffect(() => {
    const hasPreloading = Array.from(preloadQueue.values()).some(item => item.status === 'loading');
    setIsPreloading(hasPreloading);
  }, [preloadQueue]);

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

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const minimizePlayer = () => {
    setIsFullScreenPlayerOpen(false);
  };

  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={minimizePlayer}
          className="text-white hover:bg-white/10 rounded-full"
        >
          <Minimize className="h-6 w-6" />
        </Button>

        <div className="text-center">
          <p className="text-white/60 text-sm">NOW PLAYING</p>
          <p className="text-white text-lg font-medium">
            {currentSong.title || 'Unknown Song'}
          </p>
        </div>

        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Album Art */}
        <div className="relative w-80 h-80 mb-8 rounded-2xl overflow-hidden shadow-2xl">
          {currentSong.cover_image_url ? (
            <img
              src={currentSong.cover_image_url}
              alt={currentSong.title || 'Album Art'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800 flex items-center justify-center">
              <Music className="h-32 w-32 text-zinc-400" />
            </div>
          )}

          {/* Loading/Buffering Overlay */}
          {(isLoading || isBuffering) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
                <p className="text-white text-lg font-medium">
                  {isLoading ? 'Loading...' :
                   bufferingState === 'connecting' ? 'Connecting...' :
                   bufferingState === 'buffering' ? 'Buffering...' :
                   bufferingState === 'stalled' ? 'Reconnecting...' :
                   'Loading...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="text-center mb-8 max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            {currentSong.title || 'Unknown Song'}
          </h1>
          <p className="text-xl text-white/80 mb-2">
            {currentSong.artist_name || 'Unknown Artist'}
          </p>
          {currentSong.album_title && (
            <p className="text-white/60">
              {currentSong.album_title}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-white/60 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={cn(
              'h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full',
              isShuffle && 'text-green-400'
            )}
          >
            <Shuffle className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playPrevious}
            className="h-14 w-14 text-white hover:bg-white/10 rounded-full"
          >
            <SkipBack className="h-7 w-7" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            disabled={isBuffering}
            className="h-20 w-20 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 shadow-2xl transition-all disabled:opacity-50"
          >
            {isBuffering ? (
              <Loader2 className="h-9 w-9 animate-spin" />
            ) : isPreloading && !isPlaying ? (
              <div className="flex flex-col items-center">
                <div className="animate-pulse w-3 h-3 bg-black rounded-full mb-1" />
                <Play className="h-9 w-9 ml-1" />
              </div>
            ) : isPlaying ? (
              <Pause className="h-9 w-9" />
            ) : (
              <Play className="h-9 w-9 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playNext}
            className="h-14 w-14 text-white hover:bg-white/10 rounded-full"
          >
            <SkipForward className="h-7 w-7" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            className={cn(
              'h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full',
              isRepeat && 'text-green-400'
            )}
          >
            <Repeat className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Like Button */}
          {onLike && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLike(currentSong.id)}
              className="h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Heart
                className={cn(
                  'h-6 w-6',
                  isLiked && 'fill-green-400 text-green-400'
                )}
              />
            </Button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-32"
            />
          </div>

          {/* Lyrics Toggle */}
          {currentSong.has_lyrics && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLyrics(!showLyrics)}
              className={cn(
                'h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full',
                showLyrics && 'text-green-400'
              )}
            >
              <Music className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Lyrics Display */}
        {showLyrics && currentSong.has_lyrics && currentSong.lyrics && (
          <div className="absolute bottom-32 left-6 right-6 max-h-40 overflow-y-auto">
            <div className="text-center">
              {currentSong.lyrics.isRealtime ? (
                <div className="space-y-2">
                  {Array.isArray(currentSong.lyrics.data) &&
                    currentSong.lyrics.data.map((lyric: any, index: number) => (
                      <p
                        key={index}
                        className={cn(
                          'text-lg transition-all duration-300 leading-relaxed',
                          index === currentLyricIndex
                            ? 'text-white font-semibold scale-105'
                            : 'text-white/40'
                        )}
                      >
                        {lyric.text}
                      </p>
                    ))}
                </div>
              ) : (
                <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-white/80 whitespace-pre-wrap leading-relaxed text-center">
                    {typeof currentSong.lyrics.data === 'string' ? currentSong.lyrics.data : 'No lyrics available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}