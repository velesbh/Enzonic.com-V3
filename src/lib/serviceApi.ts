import { env } from './env';
import { useState, useEffect } from 'react';

export interface ServiceStatus {
  serviceId: string;
  available: boolean;
  timestamp: string;
  name?: string;
  responseTime?: number;
}

export interface ServicesStatus {
  [serviceId: string]: {
    name: string;
    enabled: boolean;
    endpoint: string;
    available?: boolean;
    responseTime?: number;
  };
}

export interface RealtimeData {
  statistics: {
    activeUsers: number;
    recentTranslations: number;
    recentApiCalls: number;
    timestamp: string;
  };
  services: ServicesStatus;
  timestamp: string;
}

// Check if a specific service is available
export async function checkServiceStatus(serviceId: string): Promise<ServiceStatus> {
  try {
    const response = await fetch(`${env.API_URL}/api/admin/services/${serviceId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to check service status: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      serviceId: data.serviceId,
      available: data.available,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error checking service status:', error);
    // Default to available when API fails to prevent blocking access
    return {
      serviceId,
      available: true,
      timestamp: new Date().toISOString()
    };
  }
}

// Get all services status with availability check
export async function getAllServicesStatus(): Promise<ServicesStatus> {
  try {
    const response = await fetch(`${env.API_URL}/api/admin/services/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get services status: ${response.statusText}`);
    }
    
    const data = await response.json();
    const services = data.services || {};
    
    // Check availability for each service
    const checkedServices: ServicesStatus = {};
    
    for (const [serviceId, service] of Object.entries(services)) {
      const serviceData = service as any;
      const startTime = performance.now();
      
      try {
        // Try to ping the service endpoint
        const pingResponse = await fetch(`${serviceData.endpoint}/health`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        const responseTime = performance.now() - startTime;
        checkedServices[serviceId] = {
          ...serviceData,
          available: pingResponse.ok || pingResponse.status < 500,
          responseTime: Math.round(responseTime)
        };
      } catch (error) {
        // Service is unavailable
        checkedServices[serviceId] = {
          ...serviceData,
          available: false,
          responseTime: Math.round(performance.now() - startTime)
        };
      }
    }
    
    return checkedServices;
  } catch (error) {
    console.error('Error getting services status:', error);
    return {};
  }
}

// Get real-time data (requires auth)
export async function getRealtimeData(token?: string): Promise<RealtimeData | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${env.API_URL}/api/admin/realtime`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get realtime data: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting realtime data:', error);
    return null;
  }
}

// Record user activity for real-time tracking
export async function recordActivity(activity: string, details: any = {}, token?: string): Promise<void> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    await fetch(`${env.API_URL}/api/admin/activity`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        activity,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          sessionId: getSessionId()
        }
      })
    });
  } catch (error) {
    // Silently fail for activity tracking
    console.debug('Activity tracking failed:', error);
  }
}

// Generate or get session ID for tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('enzonic_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('enzonic_session_id', sessionId);
  }
  return sessionId;
}

// Hook for service status monitoring
export function useServiceStatus(serviceId: string) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const checkStatus = async () => {
      if (!mounted) return;
      
      setLoading(true);
      const result = await checkServiceStatus(serviceId);
      
      if (mounted) {
        setStatus(result);
        setLoading(false);
      }
    };
    
    // Initial check only - no polling
    checkStatus();
    
    return () => {
      mounted = false;
    };
  }, [serviceId]);
  
  return { status, loading };
}

// Hook for all services status
export function useAllServicesStatus() {
  const [services, setServices] = useState<ServicesStatus>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const checkStatuses = async () => {
      if (!mounted) return;
      
      setLoading(true);
      const result = await getAllServicesStatus();
      
      if (mounted) {
        setServices(result);
        setLoading(false);
      }
    };
    
    // Initial check only - no polling
    checkStatuses();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return { services, loading };
}