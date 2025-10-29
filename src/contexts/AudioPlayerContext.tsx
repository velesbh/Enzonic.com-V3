import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback, ReactNode } from 'react';
import { smartPreloader } from '@/utils/smartPreloader';

// Types
export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  coverUrl?: string;
  audioUrl: string;
  lyrics?: {
    isRealtime: boolean;
    data: string | Array<{ timestamp: number; text: string }>;
  };
}

export interface AudioState {
  // Playback state
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;

  // Queue state
  queue: AudioTrack[];
  queueIndex: number;
  originalQueue: AudioTrack[]; // For shuffle restoration

  // Playback modes
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;

  // UI state
  showPlayer: boolean;
  playerMode: 'mini' | 'full' | 'navbar';

  // Error state
  error: string | null;
}

export interface AudioActions {
  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;

  // Queue management
  playTrack: (track: AudioTrack, queue?: AudioTrack[]) => Promise<void>;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  clearQueueAfterCurrent: () => void;
  addTracksToQueue: (tracks: AudioTrack[]) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  shuffle: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;

  // UI controls
  setPlayerMode: (mode: 'mini' | 'full' | 'navbar') => void;
  togglePlayer: () => void;
  closePlayer: () => void;

  // Error handling
  clearError: () => void;

  // Settings
  resetAudioSettings: () => void;
}

type AudioContextType = AudioState & AudioActions;

const AudioContext = createContext<AudioContextType | null>(null);

// Action types
type AudioAction =
  | { type: 'SET_CURRENT_TRACK'; payload: AudioTrack | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_QUEUE'; payload: AudioTrack[] }
  | { type: 'SET_QUEUE_INDEX'; payload: number }
  | { type: 'SET_ORIGINAL_QUEUE'; payload: AudioTrack[] }
  | { type: 'SET_REPEAT_MODE'; payload: 'none' | 'one' | 'all' }
  | { type: 'SET_SHUFFLE_MODE'; payload: boolean }
  | { type: 'SET_SHOW_PLAYER'; payload: boolean }
  | { type: 'SET_PLAYER_MODE'; payload: 'mini' | 'full' | 'navbar' }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: AudioState = {
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  repeatMode: 'none',
  shuffleMode: false,
  showPlayer: false,
  playerMode: 'mini',
  error: null,
};

// Reducer
function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload, isPaused: !action.payload };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_BUFFERING':
      return { ...state, isBuffering: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_QUEUE_INDEX':
      return { ...state, queueIndex: action.payload };
    case 'SET_ORIGINAL_QUEUE':
      return { ...state, originalQueue: action.payload };
    case 'SET_REPEAT_MODE':
      return { ...state, repeatMode: action.payload };
    case 'SET_SHUFFLE_MODE':
      return { ...state, shuffleMode: action.payload };
    case 'SET_SHOW_PLAYER':
      return { ...state, showPlayer: action.payload };
    case 'SET_PLAYER_MODE':
      return { ...state, playerMode: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Audio Manager class for handling Web Audio API
class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private animationFrame: number | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  setAudioElement(element: HTMLAudioElement) {
    this.audioElement = element;

    if (this.audioContext && !this.sourceNode) {
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(element);
        this.gainNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();

        // Configure analyser for better visualization
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0.8;

        // Create data arrays
        this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);

        // Connect nodes: source -> gain -> analyser -> destination
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      } catch (error) {
        console.warn('Failed to set up Web Audio nodes:', error);
      }
    }
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      // Smooth volume transition
      const currentTime = this.audioContext?.currentTime || 0;
      this.gainNode.gain.cancelScheduledValues(currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.1);
    }
  }

  // Get frequency data for visualization
  getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode || !this.frequencyData) return null;
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  // Get time domain data for waveform visualization
  getTimeData(): Uint8Array | null {
    if (!this.analyserNode || !this.timeData) return null;
    this.analyserNode.getByteTimeDomainData(this.timeData);
    return this.timeData;
  }

  // Get average frequency for simple level meter
  getAverageFrequency(): number {
    const data = this.getFrequencyData();
    if (!data) return 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255; // Normalize to 0-1
  }

  // Create equalizer bands
  createEqualizer(): { filters: BiquadFilterNode[]; setBandGain: (band: number, gain: number) => void } | null {
    if (!this.audioContext || !this.gainNode) return null;

    const frequencies = [60, 170, 350, 1000, 3500, 10000]; // Hz
    const filters: BiquadFilterNode[] = [];

    frequencies.forEach((freq, index) => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;

      filters.push(filter);
    });

    // Connect filters in series
    this.gainNode.disconnect();
    this.gainNode.connect(filters[0]);

    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    filters[filters.length - 1].connect(this.analyserNode || this.audioContext.destination);

    const setBandGain = (band: number, gain: number) => {
      if (filters[band]) {
        filters[band].gain.value = gain;
      }
    };

    return { filters, setBandGain };
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Provider component
export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';

    // Event listeners
    const handleLoadStart = () => dispatch({ type: 'SET_LOADING', payload: true });
    const handleCanPlay = () => {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_BUFFERING', payload: false });
    };
    const handleWaiting = () => dispatch({ type: 'SET_BUFFERING', payload: true });
    const handlePlaying = () => dispatch({ type: 'SET_BUFFERING', payload: false });
    const handleTimeUpdate = () => {
      if (audio.currentTime) {
        dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
      }
    };
    const handleDurationChange = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration || 0 });
    };
    const handleEnded = () => handleNext();
    const handleError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio' });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_BUFFERING', payload: false });
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;
    audioManagerRef.current.setAudioElement(audio);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioManagerRef.current.destroy();
      smartPreloader.clear();
    };
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = localStorage.getItem('audioPlayerState');
    if (persisted) {
      try {
        const savedState = JSON.parse(persisted);
        dispatch({
          type: 'SET_VOLUME',
          payload: savedState.volume !== undefined ? savedState.volume : 1,
        });
        dispatch({
          type: 'SET_MUTED',
          payload: savedState.isMuted !== undefined ? savedState.isMuted : false,
        });
        dispatch({
          type: 'SET_PLAYBACK_RATE',
          payload: savedState.playbackRate !== undefined ? savedState.playbackRate : 1,
        });
        dispatch({
          type: 'SET_REPEAT_MODE',
          payload: savedState.repeatMode !== undefined ? savedState.repeatMode : 'none',
        });
        dispatch({
          type: 'SET_SHUFFLE_MODE',
          payload: savedState.shuffleMode !== undefined ? savedState.shuffleMode : false,
        });
        dispatch({
          type: 'SET_QUEUE',
          payload: savedState.queue !== undefined ? savedState.queue : [],
        });
        dispatch({
          type: 'SET_ORIGINAL_QUEUE',
          payload: savedState.originalQueue !== undefined ? savedState.originalQueue : [],
        });
        dispatch({
          type: 'SET_QUEUE_INDEX',
          payload: savedState.queueIndex !== undefined ? savedState.queueIndex : -1,
        });

        // Load current track if available
        if (savedState.currentTrack) {
          dispatch({ type: 'SET_CURRENT_TRACK', payload: savedState.currentTrack });
        }
      } catch (error) {
        console.error('Error loading persisted audio player state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      volume: state.volume,
      isMuted: state.isMuted,
      playbackRate: state.playbackRate,
      repeatMode: state.repeatMode,
      shuffleMode: state.shuffleMode,
      queue: state.queue,
      originalQueue: state.originalQueue,
      queueIndex: state.queueIndex,
      currentTrack: state.currentTrack,
    };
    localStorage.setItem('audioPlayerState', JSON.stringify(stateToSave));
  }, [
    state.volume,
    state.isMuted,
    state.playbackRate,
    state.repeatMode,
    state.shuffleMode,
    state.queue,
    state.originalQueue,
    state.queueIndex,
    state.currentTrack,
  ]);

  // Sync volume with audio manager
  useEffect(() => {
    const volume = state.isMuted ? 0 : state.volume;
    audioManagerRef.current.setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [state.volume, state.isMuted]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.playbackRate;
    }
  }, [state.playbackRate]);

  // Handle next track logic
  const handleNext = useCallback(async () => {
    const { queue, queueIndex, repeatMode, shuffleMode } = state;

    if (queue.length === 0) return;

    let nextIndex = queueIndex;

    if (repeatMode === 'one') {
      // Repeat current track
      nextIndex = queueIndex;
    } else if (shuffleMode) {
      // Random next track
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      // Sequential next
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // End of queue
          dispatch({ type: 'SET_PLAYING', payload: false });
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      dispatch({ type: 'SET_QUEUE_INDEX', payload: nextIndex });
      await playTrackInternal(nextTrack);
    }
  }, [state]);

  // Internal play track function
  const playTrackInternal = useCallback(async (track: AudioTrack) => {
    if (!audioRef.current) return;

    dispatch({ type: 'SET_CURRENT_TRACK', payload: track });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await audioManagerRef.current.resumeContext();

      // Check if track is preloaded
      const preloadedAudio = smartPreloader.getPreloadedTrack(track.id);
      if (preloadedAudio) {
        // Use preloaded audio
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
      } else {
        // Load normally
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
      }

      await audioRef.current.play();
      dispatch({ type: 'SET_PLAYING', payload: true });
      dispatch({ type: 'SET_SHOW_PLAYER', payload: true });

      // Start preloading next tracks
      smartPreloader.preloadNextTracks(track, state.queue);
    } catch (error) {
      console.error('Failed to play track:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.queue]);

  // Action implementations
  const play = useCallback(async () => {
    if (!audioRef.current || !state.currentTrack) return;

    try {
      await audioManagerRef.current.resumeContext();
      await audioRef.current.play();
      dispatch({ type: 'SET_PLAYING', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' });
    }
  }, [state.currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }
  }, []);

  const setVolumeLevel = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: Math.max(0, Math.min(1, volume)) });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'SET_MUTED', payload: !state.isMuted });
  }, [state.isMuted]);

  const setPlaybackRateLevel = useCallback((rate: number) => {
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: Math.max(0.5, Math.min(2, rate)) });
  }, []);

  const playTrack = useCallback(async (track: AudioTrack, queue: AudioTrack[] = []) => {
    const newQueue = queue.length > 0 ? queue : [track];
    const trackIndex = newQueue.findIndex(t => t.id === track.id);

    dispatch({ type: 'SET_QUEUE', payload: newQueue });
    dispatch({ type: 'SET_QUEUE_INDEX', payload: trackIndex });
    dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: [...newQueue] });

    await playTrackInternal(track);
  }, [playTrackInternal]);

  const addToQueue = useCallback((track: AudioTrack) => {
    dispatch({ type: 'SET_QUEUE', payload: [...state.queue, track] });
  }, [state.queue]);

  const removeFromQueue = useCallback((index: number) => {
    const newQueue = state.queue.filter((_, i) => i !== index);
    dispatch({ type: 'SET_QUEUE', payload: newQueue });

    if (index === state.queueIndex) {
      // Current track removed, play next
      handleNext();
    } else if (index < state.queueIndex) {
      // Adjust queue index
      dispatch({ type: 'SET_QUEUE_INDEX', payload: state.queueIndex - 1 });
    }
  }, [state.queue, state.queueIndex, handleNext]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    const newQueue = [...state.queue];
    const [movedTrack] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedTrack);

    dispatch({ type: 'SET_QUEUE', payload: newQueue });
    if (state.queueIndex === fromIndex) {
      dispatch({ type: 'SET_QUEUE_INDEX', payload: toIndex });
    } else if (state.queueIndex === toIndex) {
      dispatch({ type: 'SET_QUEUE_INDEX', payload: fromIndex });
    }
  }, [state.queue, state.queueIndex]);

  const clearQueue = useCallback(() => {
    dispatch({ type: 'SET_QUEUE', payload: [] });
    dispatch({ type: 'SET_QUEUE_INDEX', payload: -1 });
    dispatch({ type: 'SET_CURRENT_TRACK', payload: null });
    dispatch({ type: 'SET_PLAYING', payload: false });
  }, []);

  const clearQueueAfterCurrent = useCallback(() => {
    const { queue, queueIndex } = state;
    if (queue.length === 0 || queueIndex === -1) return;

    const currentTrack = queue[queueIndex];
    dispatch({ type: 'SET_QUEUE', payload: [currentTrack] });
    dispatch({ type: 'SET_QUEUE_INDEX', payload: 0 });
    dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: [currentTrack] });
  }, [state]);

  const addTracksToQueue = useCallback((tracks: AudioTrack[]) => {
    dispatch({ type: 'SET_QUEUE', payload: [...state.queue, ...tracks] });
  }, [state.queue]);

  const next = useCallback(async () => {
    await handleNext();
  }, [handleNext]);

  const previous = useCallback(async () => {
    const { queue, queueIndex, shuffleMode } = state;

    if (queue.length === 0) return;

    let prevIndex = queueIndex;

    if (shuffleMode) {
      // Random previous track
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1; // Wrap to end
      }
    }

    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      dispatch({ type: 'SET_QUEUE_INDEX', payload: prevIndex });
      await playTrackInternal(prevTrack);
    }
  }, [state, playTrackInternal]);

  const shuffle = useCallback(() => {
    const newShuffleMode = !state.shuffleMode;
    dispatch({ type: 'SET_SHUFFLE_MODE', payload: newShuffleMode });

    if (newShuffleMode) {
      // Create shuffled queue
      const shuffled = [...state.originalQueue].sort(() => Math.random() - 0.5);
      const currentTrackIndex = shuffled.findIndex(t => t.id === state.currentTrack?.id);
      dispatch({ type: 'SET_QUEUE', payload: shuffled });
      dispatch({ type: 'SET_QUEUE_INDEX', payload: currentTrackIndex });
    } else {
      // Restore original queue
      const originalIndex = state.originalQueue.findIndex(t => t.id === state.currentTrack?.id);
      dispatch({ type: 'SET_QUEUE', payload: [...state.originalQueue] });
      dispatch({ type: 'SET_QUEUE_INDEX', payload: originalIndex });
    }
  }, [state.shuffleMode, state.originalQueue, state.currentTrack]);

  const setRepeatModeLevel = useCallback((mode: 'none' | 'one' | 'all') => {
    dispatch({ type: 'SET_REPEAT_MODE', payload: mode });
  }, []);

  const setPlayerModeLevel = useCallback((mode: 'mini' | 'full' | 'navbar') => {
    dispatch({ type: 'SET_PLAYER_MODE', payload: mode });
  }, []);

  const togglePlayer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_PLAYER', payload: !state.showPlayer });
  }, [state.showPlayer]);

  const closePlayer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_PLAYER', payload: false });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetAudioSettings = useCallback(() => {
    dispatch({ type: 'SET_VOLUME', payload: 1 });
    dispatch({ type: 'SET_MUTED', payload: false });
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: 1 });
  }, []);

  // Context value
  const contextValue: AudioContextType = {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume: setVolumeLevel,
    toggleMute,
    setPlaybackRate: setPlaybackRateLevel,
    playTrack,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    clearQueueAfterCurrent,
    addTracksToQueue,
    next,
    previous,
    shuffle,
    setRepeatMode: setRepeatModeLevel,
    setPlayerMode: setPlayerModeLevel,
    togglePlayer,
    closePlayer,
    clearError,
    resetAudioSettings,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

// Hook
export function useAudioPlayer(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioProvider');
  }
  return context;
}