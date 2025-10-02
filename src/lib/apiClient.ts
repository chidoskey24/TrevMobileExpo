// src/lib/apiClient.ts
import { apiServer, ApiResponse } from './apiServer';

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string = 'http://localhost:3001';
  private authToken: string | null = null;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('POST', '/api/auth/login', { username, password });
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const result = await apiServer.handleRequest('POST', '/api/auth/logout', {}, this.authToken || undefined);
      if (result.success) {
        this.authToken = null;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  // Direct API calls to the mobile app's API server
  async getDrivers(): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('GET', '/api/drivers', undefined, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async getReceipts(): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('GET', '/api/receipts', undefined, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async getQueue(): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('GET', '/api/queue', undefined, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async getStatistics(): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('GET', '/api/statistics', undefined, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async getSystemStatus(): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('GET', '/api/status', undefined, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  async updateDriverStatus(driverId: string, status: 'active' | 'inactive' | 'pending'): Promise<ApiResponse> {
    try {
      return await apiServer.handleRequest('POST', `/api/drivers/${driverId}/status`, { status }, this.authToken || undefined);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  // HTTP client methods for external API calls (when needed)
  private async httpRequest(method: string, endpoint: string, data?: any): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      return {
        success: response.ok,
        data: result.data,
        error: result.error,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  // Test connection to API server
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getSystemStatus();
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
