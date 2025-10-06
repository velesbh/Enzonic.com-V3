// Frontend activity tracking utility
import { env } from './env';

class ActivityTracker {
  private static instance: ActivityTracker;
  private sessionId: string;

  constructor() {
    this.sessionId = Math.random().toString(36).substr(2, 9);
  }

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  async trackPageView(pageName: string, getToken?: () => Promise<string | null>) {
    try {
      const token = getToken ? await getToken() : null;
      
      // Send to backend for tracking (don't await to avoid blocking UI)
      fetch(`${env.API_URL}/api/admin/track/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          page: pageName,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer
        })
      }).catch(err => console.debug('Page view tracking failed:', err));
    } catch (error) {
      console.debug('Page view tracking error:', error);
    }
  }

  async trackInteraction(action: string, details: any = {}, getToken?: () => Promise<string | null>) {
    try {
      const token = getToken ? await getToken() : null;
      
      // Send to backend for tracking (don't await to avoid blocking UI)
      fetch(`${env.API_URL}/api/admin/track/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          action,
          details,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).catch(err => console.debug('Interaction tracking failed:', err));
    } catch (error) {
      console.debug('Interaction tracking error:', error);
    }
  }

  trackServiceUsage(serviceName: string, details: any = {}, getToken?: () => Promise<string | null>) {
    return this.trackInteraction('service_usage', { 
      service: serviceName, 
      ...details 
    }, getToken);
  }
}

export const activityTracker = ActivityTracker.getInstance();

// Hook for easy usage in React components
export function useActivityTracker() {
  return activityTracker;
}