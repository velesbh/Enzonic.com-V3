import { AudioTrack } from '@/contexts/AudioPlayerContext';

interface PreloadItem {
  audio: HTMLAudioElement;
  track: AudioTrack;
  priority: 'high' | 'medium' | 'low';
  status: 'loading' | 'ready' | 'error';
  loadStartTime: number;
  retryCount: number;
  bytesLoaded: number;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

class SmartPreloader {
  private preloadQueue: Map<string, PreloadItem> = new Map();
  private maxConcurrentLoads = 3;
  private activeLoads = 0;
  private connectionInfo: ConnectionInfo | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.detectConnection();
    this.startCleanup();
  }

  private detectConnection() {
    // Detect network connection quality
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      this.connectionInfo = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 1,
        rtt: connection.rtt || 100,
      };

      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.connectionInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 1,
          rtt: connection.rtt || 100,
        };
        this.adjustPreloadingStrategy();
      });
    } else {
      // Fallback: measure connection with a test request
      this.measureConnectionSpeed();
    }
  }

  private async measureConnectionSpeed(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      const latency = endTime - startTime;

      // Estimate connection quality based on latency
      let effectiveType = 'unknown';
      let downlink = 1;

      if (latency < 50) {
        effectiveType = '4g';
        downlink = 10;
      } else if (latency < 150) {
        effectiveType = '3g';
        downlink = 2;
      } else {
        effectiveType = '2g';
        downlink = 0.5;
      }

      this.connectionInfo = {
        effectiveType,
        downlink,
        rtt: latency,
      };
    } catch (error) {
      console.warn('Connection speed detection failed:', error);
      this.connectionInfo = {
        effectiveType: 'unknown',
        downlink: 1,
        rtt: 100,
      };
    }
  }

  private adjustPreloadingStrategy() {
    if (!this.connectionInfo) return;

    const { effectiveType, downlink } = this.connectionInfo;

    // Adjust max concurrent loads based on connection
    if (effectiveType === '4g' && downlink >= 5) {
      this.maxConcurrentLoads = 5;
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink >= 1)) {
      this.maxConcurrentLoads = 3;
    } else {
      this.maxConcurrentLoads = 1;
    }
  }

  private getPreloadSettings() {
    if (!this.connectionInfo) {
      return {
        maxItems: 5,
        preloadLevel: 'metadata' as const,
        priorityThreshold: 0.5,
        timeout: 30000,
      };
    }

    const { effectiveType, downlink } = this.connectionInfo;

    if (effectiveType === '4g' && downlink >= 5) {
      // Fast connection
      return {
        maxItems: 8,
        preloadLevel: 'auto' as const,
        priorityThreshold: 0.8,
        timeout: 45000,
      };
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink >= 1)) {
      // Medium connection
      return {
        maxItems: 5,
        preloadLevel: 'auto' as const,
        priorityThreshold: 0.6,
        timeout: 30000,
      };
    } else {
      // Slow connection
      return {
        maxItems: 3,
        preloadLevel: 'metadata' as const,
        priorityThreshold: 0.3,
        timeout: 20000,
      };
    }
  }

  preloadTrack(track: AudioTrack, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const existing = this.preloadQueue.get(track.id);
    if (existing) {
      // Update priority if higher
      if (this.getPriorityWeight(priority) > this.getPriorityWeight(existing.priority)) {
        existing.priority = priority;
      }
      existing.loadStartTime = Date.now(); // Refresh access time
      return;
    }

    // Check if we're at capacity
    const settings = this.getPreloadSettings();
    if (this.preloadQueue.size >= settings.maxItems) {
      this.evictLowPriorityItems();
    }

    const audio = new Audio();
    audio.preload = settings.preloadLevel;
    audio.volume = 0; // Mute preloaded audio

    const item: PreloadItem = {
      audio,
      track,
      priority,
      status: 'loading',
      loadStartTime: Date.now(),
      retryCount: 0,
      bytesLoaded: 0,
    };

    // Set up event listeners
    audio.addEventListener('loadstart', () => {
      item.status = 'loading';
    });

    audio.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        item.bytesLoaded = e.loaded;
      }
    });

    audio.addEventListener('canplaythrough', () => {
      item.status = 'ready';
      this.activeLoads = Math.max(0, this.activeLoads - 1);
      this.processQueue();
    });

    audio.addEventListener('error', () => {
      item.status = 'error';
      item.retryCount++;

      if (item.retryCount < 3) {
        // Retry with exponential backoff
        setTimeout(() => {
          this.retryPreload(track.id);
        }, Math.pow(2, item.retryCount) * 1000);
      } else {
        this.activeLoads = Math.max(0, this.activeLoads - 1);
        this.processQueue();
      }
    });

    this.preloadQueue.set(track.id, item);

    // Start loading if we haven't exceeded concurrent load limit
    if (this.activeLoads < this.maxConcurrentLoads) {
      this.startLoading(item);
    }
  }

  private startLoading(item: PreloadItem): void {
    this.activeLoads++;
    item.audio.src = item.track.audioUrl;
    item.audio.load();
  }

  private retryPreload(trackId: string): void {
    const item = this.preloadQueue.get(trackId);
    if (!item || item.status !== 'error') return;

    item.status = 'loading';
    item.loadStartTime = Date.now();

    if (this.activeLoads < this.maxConcurrentLoads) {
      this.startLoading(item);
    }
  }

  private processQueue(): void {
    if (this.activeLoads >= this.maxConcurrentLoads) return;

    // Find next item to load based on priority
    const pendingItems = Array.from(this.preloadQueue.values())
      .filter(item => item.status === 'loading' && !item.audio.src)
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    if (pendingItems.length > 0) {
      this.startLoading(pendingItems[0]);
    }
  }

  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private evictLowPriorityItems(): void {
    const settings = this.getPreloadSettings();
    const items = Array.from(this.preloadQueue.entries());

    // Sort by priority (lowest first), then by access time (oldest first)
    items.sort(([,a], [,b]) => {
      const priorityDiff = this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority);
      if (priorityDiff !== 0) return priorityDiff;

      return a.loadStartTime - b.loadStartTime;
    });

    // Remove lowest priority items
    const toRemove = items.slice(0, items.length - settings.maxItems + 1);
    toRemove.forEach(([trackId, item]) => {
      item.audio.remove();
      this.preloadQueue.delete(trackId);
    });
  }

  getPreloadedTrack(trackId: string): HTMLAudioElement | null {
    const item = this.preloadQueue.get(trackId);
    if (item && item.status === 'ready') {
      item.loadStartTime = Date.now(); // Update access time
      return item.audio;
    }
    return null;
  }

  getPreloadStatus(trackId: string): 'none' | 'loading' | 'ready' | 'error' {
    const item = this.preloadQueue.get(trackId);
    return item ? item.status : 'none';
  }

  preloadNextTracks(currentTrack: AudioTrack, queue: AudioTrack[], maxPreload = 5): void {
    if (queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    const tracksToPreload = [];
    const settings = this.getPreloadSettings();

    // Preload next tracks with decreasing priority
    for (let i = 1; i <= Math.min(maxPreload, settings.maxItems); i++) {
      const nextIndex = (currentIndex + i) % queue.length;
      tracksToPreload.push(queue[nextIndex]);
    }

    tracksToPreload.forEach((track, index) => {
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (index === 0) priority = 'high';
      else if (index === 1) priority = 'medium';

      // Reduce priority on slow connections
      if (this.connectionInfo && this.connectionInfo.effectiveType !== '4g') {
        if (priority === 'medium') priority = 'low';
      }

      this.preloadTrack(track, priority);
    });
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const settings = this.getPreloadSettings();
      const toRemove: string[] = [];

      this.preloadQueue.forEach((item, trackId) => {
        // Remove items that have been loading too long
        if (item.status === 'loading' && now - item.loadStartTime > settings.timeout) {
          toRemove.push(trackId);
        }

        // Remove failed items after max retries
        if (item.status === 'error' && item.retryCount >= 3) {
          toRemove.push(trackId);
        }

        // Remove old items (keep only recent ones)
        if (now - item.loadStartTime > 300000) { // 5 minutes
          toRemove.push(trackId);
        }
      });

      toRemove.forEach(trackId => {
        const item = this.preloadQueue.get(trackId);
        if (item) {
          item.audio.remove();
          this.preloadQueue.delete(trackId);
        }
      });
    }, 60000); // Clean up every minute
  }

  clear(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.preloadQueue.forEach(item => {
      item.audio.remove();
    });
    this.preloadQueue.clear();
    this.activeLoads = 0;
  }
}

// Export singleton instance
export const smartPreloader = new SmartPreloader();