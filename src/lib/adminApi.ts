import { env } from './env';
import { useAuth } from '@clerk/clerk-react';

async function getAuthToken() {
  // This will be called from components where useAuth is available
  return null; // Will be passed from components
}

export async function adminApiCall(endpoint: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${env.API_URL}/api/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }
  
  return response.json();
}

// Check if current user is admin
export const checkAdminStatus = (token: string) => 
  adminApiCall('/status', {}, token);

// Environment variables management
export const getEnvironmentVariables = (token: string) => 
  adminApiCall('/env', {}, token);

export const updateEnvironmentVariables = (envVars: Record<string, string>, token: string) => 
  adminApiCall('/env', { 
    method: 'PUT', 
    body: JSON.stringify({ envVars }) 
  }, token);

// Service configurations
export const getServiceConfigurations = (token: string) => 
  adminApiCall('/services', {}, token);

export const updateServiceConfiguration = (serviceId: string, serviceConfig: any, token: string) => 
  adminApiCall(`/services/${serviceId}`, { 
    method: 'PUT', 
    body: JSON.stringify({ serviceConfig }) 
  }, token);

// Statistics and monitoring
export const getLiveStatistics = (token: string) => 
  adminApiCall('/stats', {}, token);

export const getSystemHealth = (token: string) => 
  adminApiCall('/health', {}, token);

// Real-time data refresh
export const refreshAllData = async (token: string) => {
  try {
    const [envVars, services, stats, health] = await Promise.all([
      getEnvironmentVariables(token),
      getServiceConfigurations(token),
      getLiveStatistics(token),
      getSystemHealth(token)
    ]);
    
    return {
      envVars: envVars.envVars,
      services: services.services,
      stats: stats.stats,
      health: health.health
    };
  } catch (error) {
    console.error('Error refreshing all data:', error);
    throw error;
  }
};