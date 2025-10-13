import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface FileUploadResponse {
  success: boolean;
  file?: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  };
  error?: string;
}

export interface FileDownloadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileListResponse {
  success: boolean;
  files?: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
  }>;
  error?: string;
}

export interface FileShareResponse {
  success: boolean;
  shareUrl?: string;
  expiresAt?: string;
  error?: string;
}

export class FileApiClient {
  private getAuthHeaders = async () => {
    const { getToken } = useAuth();
    const token = await getToken?.();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  async uploadFile(file: File, folderId?: string): Promise<FileUploadResponse> {
    try {
      const { getToken } = useAuth();
      const token = await getToken?.();
      
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async downloadFile(fileId: string): Promise<FileDownloadResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async listFiles(folderId?: string): Promise<FileListResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = new URL(`${API_BASE_URL}/files`);
      if (folderId) {
        url.searchParams.append('folderId', folderId);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to list files' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  }

  async shareFile(fileId: string, expirationHours: number = 24): Promise<FileShareResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/share/${fileId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expirationHours }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to share file' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File share error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share file',
      };
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete file' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('File delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  async getStorageUsage(): Promise<{ success: boolean; usage?: number; limit?: number; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/usage`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get storage usage' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Storage usage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage usage',
      };
    }
  }
}

export const fileApiClient = new FileApiClient();