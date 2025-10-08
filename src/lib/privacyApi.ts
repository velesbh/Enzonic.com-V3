import { env } from './env';

export interface PrivacyRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection' | 'withdraw_consent' | 'ccpa_opt_out';
  description: string;
  userData: any;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  notes?: string;
  adminNotes?: string;
  requestedBy: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userName?: string;
}

export interface PrivacyRequestCounts {
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
}

export interface UserPersonalData {
  exportDate: string;
  userId: string;
  dataTypes: string[];
  data: {
    profile: any;
    chatHistory: any[];
    translationHistory: any[];
    activityLogs: any[];
    apiUsage: any[];
    preferences: any[];
  };
}

export interface PrivacyAuditLog {
  id: number;
  requestId: string;
  action: string;
  description: string;
  adminId: string;
  adminEmail?: string;
  adminName?: string;
  createdAt: string;
}

async function privacyApiCall(endpoint: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${env.API_URL}/api/admin/privacy${endpoint}`, {
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

// Get all privacy requests
export const getAllPrivacyRequests = async (token: string): Promise<{
  requests: PrivacyRequest[];
  counts: PrivacyRequestCounts;
}> => {
  return privacyApiCall('/requests', {}, token);
};

// Get user's personal data
export const getUserPersonalData = async (userId: string, token: string): Promise<UserPersonalData> => {
  return privacyApiCall(`/user-data/${userId}`, {}, token);
};

// Create a new privacy request
export const createPrivacyRequest = async (
  type: PrivacyRequest['type'],
  description: string,
  userData: any,
  requestedBy: string,
  token: string
): Promise<{ requestId: string; message: string }> => {
  return privacyApiCall('/requests', {
    method: 'POST',
    body: JSON.stringify({
      type,
      description,
      userData,
      requestedBy
    })
  }, token);
};

// Update privacy request status
export const updatePrivacyRequestStatus = async (
  requestId: string,
  status: PrivacyRequest['status'],
  notes?: string,
  adminNotes?: string,
  token?: string
): Promise<{ message: string }> => {
  return privacyApiCall(`/requests/${requestId}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status,
      notes,
      adminNotes
    })
  }, token);
};

// Process erasure request (Right to be forgotten)
export const processErasureRequest = async (
  userId: string,
  requestId: string,
  token: string
): Promise<{ message: string }> => {
  return privacyApiCall('/requests/erasure', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      requestId
    })
  }, token);
};

// Generate data export for portability request
export const generateDataExport = async (
  userId: string,
  format: 'json' | 'csv' = 'json',
  token: string
): Promise<{
  filename: string;
  downloadUrl: string;
  message: string;
}> => {
  return privacyApiCall('/export', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      format
    })
  }, token);
};

// Process data restriction request
export const processRestrictionRequest = async (
  userId: string,
  restrictionType: string,
  requestId: string,
  token: string
): Promise<{ message: string }> => {
  return privacyApiCall('/requests/restriction', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      restrictionType,
      requestId
    })
  }, token);
};

// Process consent withdrawal
export const processConsentWithdrawal = async (
  userId: string,
  consentTypes: string[],
  requestId: string,
  token: string
): Promise<{ message: string }> => {
  return privacyApiCall('/requests/consent-withdrawal', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      consentTypes,
      requestId
    })
  }, token);
};

// Get audit log for a privacy request
export const getPrivacyAuditLog = async (
  requestId: string,
  token: string
): Promise<{ logs: PrivacyAuditLog[] }> => {
  return privacyApiCall(`/requests/${requestId}/audit`, {}, token);
};

// Download exported data
export const downloadDataExport = (filename: string, token: string): string => {
  return `${env.API_URL}/api/admin/privacy/download/${filename}?token=${token}`;
};

// Helper functions for request types
export const PRIVACY_REQUEST_TYPES = {
  ACCESS: 'access' as const,
  RECTIFICATION: 'rectification' as const,
  ERASURE: 'erasure' as const,
  PORTABILITY: 'portability' as const,
  RESTRICTION: 'restriction' as const,
  OBJECTION: 'objection' as const,
  WITHDRAW_CONSENT: 'withdraw_consent' as const,
  CCPA_OPT_OUT: 'ccpa_opt_out' as const
};

export const REQUEST_STATUS = {
  PENDING: 'pending' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  REJECTED: 'rejected' as const
};

export const getRequestTypeLabel = (type: PrivacyRequest['type']): string => {
  const labels = {
    access: 'Data Access Request',
    rectification: 'Data Rectification',
    erasure: 'Data Erasure (Right to be Forgotten)',
    portability: 'Data Portability',
    restriction: 'Processing Restriction',
    objection: 'Processing Objection',
    withdraw_consent: 'Consent Withdrawal',
    ccpa_opt_out: 'CCPA Opt-Out'
  };
  return labels[type] || type;
};

export const getStatusColor = (status: PrivacyRequest['status']): string => {
  const colors = {
    pending: 'yellow',
    in_progress: 'blue',
    completed: 'green',
    rejected: 'red'
  };
  return colors[status] || 'gray';
};

export const getStatusLabel = (status: PrivacyRequest['status']): string => {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return labels[status] || status;
};