import { useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  seekStep?: number;
  volumeStep?: number;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    seekStep = 10,
    volumeStep = 0.1,
  } = options;

  const {
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    currentTime,
    duration,
    volume,
    isMuted,
    setPlayerMode,
    playerMode,
  } = useAudioPlayer();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (except for specific combinations)
      if (event.ctrlKey || event.metaKey) {
        // Allow some Ctrl/Cmd combinations
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
          return;
        }
      }

      switch (event.key) {
        case ' ': // Spacebar - Play/Pause
          event.preventDefault();
          togglePlay();
          break;

        case 'ArrowRight': // Right arrow - Seek forward
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Right: Next track
            next();
          } else {
            // Right: Seek forward by seekStep seconds
            const newTime = Math.min(currentTime + seekStep, duration);
            seek(newTime);
          }
          break;

        case 'ArrowLeft': // Left arrow - Seek backward
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Left: Previous track
            previous();
          } else {
            // Left: Seek backward by seekStep seconds
            const newTime = Math.max(currentTime - seekStep, 0);
            seek(newTime);
          }
          break;

        case 'ArrowUp': // Up arrow - Volume up
          event.preventDefault();
          const newVolumeUp = Math.min(volume + volumeStep, 1);
          setVolume(newVolumeUp);
          break;

        case 'ArrowDown': // Down arrow - Volume down
          event.preventDefault();
          const newVolumeDown = Math.max(volume - volumeStep, 0);
          setVolume(newVolumeDown);
          break;

        case 'm':
        case 'M': // M - Mute/Unmute
          event.preventDefault();
          toggleMute();
          break;

        case 'f':
        case 'F': // F - Toggle fullscreen player
          event.preventDefault();
          setPlayerMode(playerMode === 'full' ? 'mini' : 'full');
          break;

        case 'Escape': // Escape - Close/minimize player
          event.preventDefault();
          if (playerMode === 'full') {
            setPlayerMode('mini');
          }
          break;

        // Number keys for seeking to percentage
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          const percentage = parseInt(event.key) * 10;
          const seekTime = (percentage / 100) * duration;
          seek(seekTime);
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    seekStep,
    volumeStep,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    currentTime,
    duration,
    volume,
    setPlayerMode,
    playerMode,
  ]);
}

// Keyboard shortcuts help text
export const KEYBOARD_SHORTCUTS = [
  { key: 'Space', description: 'Play/Pause' },
  { key: '←/→', description: 'Seek backward/forward 10s' },
  { key: 'Shift + ←/→', description: 'Previous/Next track' },
  { key: '↑/↓', description: 'Volume up/down' },
  { key: 'M', description: 'Mute/Unmute' },
  { key: 'F', description: 'Toggle fullscreen player' },
  { key: '0-9', description: 'Seek to 0-90% of track' },
  { key: 'Esc', description: 'Minimize player' },
];