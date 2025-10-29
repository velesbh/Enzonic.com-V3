import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  X,
  Maximize2,
  Minimize2,
  Heart,
  MoreHorizontal,
  Music,
  Loader2,
} from 'lucide-react';
import { useAudioPlayer, AudioTrack } from '@/contexts/AudioPlayerContext';
import { cn } from '@/lib/utils';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AdvancedControls } from '@/components/AdvancedControls';

interface AudioPlayerProps {
  onLike?: (trackId: string) => void;
  isLiked?: boolean;
  className?: string;
}

// Mini Player Component
function MiniPlayer({ onLike, isLiked }: { onLike?: (trackId: string) => void; isLiked?: boolean }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    closePlayer,
    setPlayerMode,
  } = useAudioPlayer();

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900/95 border border-zinc-800/50 backdrop-blur-sm rounded-full shadow-lg overflow-hidden">
      <div className="relative flex items-center h-14 px-6 gap-4 min-w-[500px] max-w-[700px]">
        {/* Background Image */}
        {currentTrack.coverUrl && (
          <div className="absolute inset-0 opacity-10 rounded-full">
            <img
              src={currentTrack.coverUrl}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-200 rounded-full"
            />
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closePlayer}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Album Art */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
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
            {currentTrack.title}
          </h4>
          <p className="text-xs text-zinc-400 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            disabled={isLoading}
            className="h-10 w-10 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {isBuffering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
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
            onValueChange={(value) => seek(value[0])}
            className="cursor-pointer"
          />
        </div>

        {/* Time Display */}
        <div className="text-xs text-zinc-400 tabular-nums flex-shrink-0 mr-2 min-w-[40px]">
          {formatTime(currentTime)}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
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
            onValueChange={(value) => setVolume(value[0])}
            className="w-16"
          />
        </div>

        {/* Like Button */}
        {onLike && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLike(currentTrack.id)}
            className="h-8 w-8 text-zinc-400 hover:text-green-400 hover:bg-zinc-800/50 rounded-full flex-shrink-0"
          >
            <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-green-400 text-green-400")} />
          </Button>
        )}

        {/* Maximize Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPlayerMode('full')}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full flex-shrink-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Full Player Component
function FullPlayer({ onLike, isLiked }: { onLike?: (trackId: string) => void; isLiked?: boolean }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    shuffleMode,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    next,
    previous,
    shuffle,
    setRepeatMode,
    setPlayerMode,
    closePlayer,
  } = useAudioPlayer();

  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [showLyrics, setShowLyrics] = useState(false);

  // Update current lyric
  useEffect(() => {
    if (currentTrack?.lyrics?.isRealtime && Array.isArray(currentTrack.lyrics.data)) {
      const lyrics = currentTrack.lyrics.data as Array<{ timestamp: number; text: string }>;
      const index = lyrics.findIndex((l, i) => {
        const nextTimestamp = lyrics[i + 1]?.timestamp ?? Infinity;
        return currentTime >= l.timestamp && currentTime < nextTimestamp;
      });
      setCurrentLyricIndex(index);
    }
  }, [currentTime, currentTrack]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPlayerMode('mini')}
          className="text-white hover:bg-white/10 rounded-full"
        >
          <Minimize2 className="h-6 w-6" />
        </Button>

        <div className="text-center">
          <p className="text-white/60 text-sm">NOW PLAYING</p>
          <p className="text-white text-lg font-medium">
            {currentTrack.title}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={closePlayer}
          className="text-white hover:bg-white/10 rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Album Art */}
        <div className="relative w-80 h-80 mb-8 rounded-2xl overflow-hidden shadow-2xl">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800 flex items-center justify-center">
              <Music className="h-32 w-32 text-zinc-400" />
            </div>
          )}

          {/* Audio Visualizer Overlay */}
          {isPlaying && (
            <div className="absolute bottom-4 left-4 right-4 h-12">
              <AudioVisualizer
                type="waveform"
                height={48}
                color="rgba(255, 255, 255, 0.8)"
              />
            </div>
          )}

          {/* Loading/Buffering Overlay */}
          {(isLoading || isBuffering) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
                <p className="text-white text-lg font-medium">
                  {isLoading ? 'Loading...' : 'Buffering...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="text-center mb-8 max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            {currentTrack.title}
          </h1>
          <p className="text-xl text-white/80 mb-2">
            {currentTrack.artist}
          </p>
          {currentTrack.album && (
            <p className="text-white/60">
              {currentTrack.album}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={(value) => seek(value[0])}
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
            onClick={shuffle}
            className={cn(
              'h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full',
              shuffleMode && 'text-green-400'
            )}
          >
            <Shuffle className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            className="h-14 w-14 text-white hover:bg-white/10 rounded-full"
          >
            <SkipBack className="h-7 w-7" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            disabled={isLoading}
            className="h-20 w-20 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 shadow-2xl transition-all disabled:opacity-50"
          >
            {isBuffering ? (
              <Loader2 className="h-9 w-9 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-9 w-9" />
            ) : (
              <Play className="h-9 w-9 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="h-14 w-14 text-white hover:bg-white/10 rounded-full"
          >
            <SkipForward className="h-7 w-7" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
              const currentIndex = modes.indexOf(repeatMode);
              const nextMode = modes[(currentIndex + 1) % modes.length];
              setRepeatMode(nextMode);
            }}
            className={cn(
              'h-12 w-12 text-white/60 hover:text-white hover:bg-white/10 rounded-full',
              repeatMode !== 'none' && 'text-green-400'
            )}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="h-6 w-6" />
            ) : (
              <Repeat className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Like Button */}
          {onLike && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLike(currentTrack.id)}
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

          {/* Volume and Speed Control */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="flex items-center gap-2">
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
                onValueChange={(value) => setVolume(value[0])}
                className="w-20"
              />
            </div>

            {/* Playback Speed */}
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-sm">Speed:</span>
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent text-white/60 text-sm border-none outline-none"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Lyrics Toggle */}
          {currentTrack.lyrics && (
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

        {/* Advanced Controls */}
        <div className="w-full max-w-md mt-6">
          <AdvancedControls className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10" />
        </div>

        {/* Lyrics Display */}
        {showLyrics && currentTrack.lyrics && (
          <div className="absolute bottom-32 left-6 right-6 max-h-40 overflow-y-auto">
            <div className="text-center">
              {currentTrack.lyrics.isRealtime ? (
                <div className="space-y-2">
                  {Array.isArray(currentTrack.lyrics.data) &&
                    currentTrack.lyrics.data.map((lyric: any, index: number) => (
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
                    {typeof currentTrack.lyrics.data === 'string' ? currentTrack.lyrics.data : 'No lyrics available'}
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

// Navbar Player Component
function NavbarPlayer({ onLike, isLiked }: { onLike?: (trackId: string) => void; isLiked?: boolean }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    togglePlay,
    seek,
    next,
    previous,
    setPlayerMode,
  } = useAudioPlayer();

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 py-2 backdrop-blur-sm">
      {/* Album Art */}
      <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
        {currentTrack.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
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
          {currentTrack.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {currentTrack.artist}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={previous}
          disabled={!currentTrack}
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
        >
          <SkipBack className="h-3 w-3" />
        </Button>

        <Button
          size="icon"
          onClick={togglePlay}
          disabled={isLoading || !currentTrack}
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
          onClick={next}
          disabled={!currentTrack}
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
          onValueChange={(value) => seek(value[0])}
          disabled={!currentTrack}
          className="cursor-pointer"
        />
      </div>

      {/* Time Display */}
      <div className="text-xs text-muted-foreground tabular-nums flex-shrink-0 mr-2 min-w-[35px]">
        {currentTrack ? formatTime(currentTime) : '0:00'}
      </div>

      {/* Maximize Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPlayerMode('full')}
        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full"
      >
        <Maximize2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Main AudioPlayer Component
export function AudioPlayer({ onLike, isLiked, className }: AudioPlayerProps) {
  const { showPlayer, playerMode } = useAudioPlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  if (!showPlayer) return null;

  return (
    <div className={cn('', className)}>
      {playerMode === 'mini' && <MiniPlayer onLike={onLike} isLiked={isLiked} />}
      {playerMode === 'full' && <FullPlayer onLike={onLike} isLiked={isLiked} />}
      {playerMode === 'navbar' && <NavbarPlayer onLike={onLike} isLiked={isLiked} />}
    </div>
  );
}

export default AudioPlayer;