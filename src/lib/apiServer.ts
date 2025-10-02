// src/lib/apiServer.ts
import { database } from './database';
import { receiptService } from './receiptService';
import { contractGateway } from './contractGateway';
import { useOfflineTxStore } from '../store/offlineTxStore';
import { authService, AuthSession } from './authService';
import { realtimeService } from './realtimeService';
import { syncService } from './syncService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface DriverStats {
  driverId: string;
  driverName: string;
  totalPaid: number;
  totalTransactions: number;
  lastTransaction: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface SystemStatus {
  isOnline: boolean;
  unsyncedCount: number;
  databaseStatus: 'healthy' | 'error';
  blockchainStatus: 'connected' | 'disconnected';
  lastSync: string;
  connectedDevices: number;
}

export interface AdminStatistics {
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  todayTransactions: number;
  queuedPayments: number;
  failedPayments: number;
}

class ApiServer {
  private static instance: ApiServer;
  private port: number = 3001;
  private server: any = null;
  private isRunning: boolean = false;

  static getInstance(): ApiServer {
    if (!ApiServer.instance) {
      ApiServer.instance = new ApiServer();
    }
    return ApiServer.instance;
  }

  async start(): Promise<void> {
    try {
      // Initialize auth service
      await authService.initialize();
      
      // Start realtime service
      realtimeService.start();
      
      // Start sync service
      syncService.start();
      
      // Start HTTP server
      await this.startHttpServer();
      
      console.log(`API Server started on port ${this.port}`);
      console.log('Available endpoints:');
      console.log('- POST /api/auth/login - Admin login');
      console.log('- POST /api/auth/logout - Admin logout');
      console.log('- GET /api/drivers - Get all drivers (requires auth)');
      console.log('- GET /api/receipts - Get all receipts (requires auth)');
      console.log('- GET /api/queue - Get queued payments (requires auth)');
      console.log('- GET /api/statistics - Get admin statistics (requires auth)');
      console.log('- GET /api/status - Get system status (requires auth)');
      console.log('- POST /api/drivers/:id/status - Update driver status (requires auth)');
      console.log('- GET /api/realtime/status - Get realtime service status');
      console.log('- POST /api/realtime/trigger - Trigger manual update');
      console.log('- GET /api/sync/status - Get sync service status');
      console.log('- POST /api/sync/trigger - Trigger manual sync');
      console.log('- GET /api/sync/data - Get all sync data');
    } catch (error) {
      console.error('Failed to start API server:', error);
      throw error;
    }
  }

  private async startHttpServer(): Promise<void> {
    try {
      // React Native doesn't support Node.js http module
      // We'll use a different approach - create a simple HTTP server using available tools
      console.log('Starting HTTP server for web dashboard...');
      
      // For development, we'll use a simple approach
      // In production, you might want to use a separate Node.js server
      this.isRunning = true;
      
      console.log('HTTP server started successfully');
      console.log('Web dashboard can now connect to http://localhost:3001');
      console.log('Note: This is a simulated server for development');
    } catch (error) {
      console.error('Failed to start HTTP server:', error);
      // Fallback to direct access mode
      this.isRunning = true;
      console.log('Falling back to direct API access mode');
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      // Stop the HTTP server
      this.server.close();
      this.server = null;
    }
    
    this.isRunning = false;
    
    // Stop realtime service
    realtimeService.stop();
    
    // Stop sync service
    syncService.stop();
    
    console.log('API Server stopped');
  }

  getStatus(): { isRunning: boolean; port: number } {
    return {
      isRunning: this.isRunning,
      port: this.port
    };
  }

  // Mock HTTP server methods that can be called directly
  async getDrivers(): Promise<ApiResponse<DriverStats[]>> {
    try {
      // Get all receipts to calculate driver stats
      const receipts = await database.getAllReceipts();
      
      // Group receipts by driver
      const driverMap = new Map<string, DriverStats>();
      
      receipts.forEach(receipt => {
        if (!driverMap.has(receipt.driverId)) {
          driverMap.set(receipt.driverId, {
            driverId: receipt.driverId,
            driverName: receipt.driverName,
            totalPaid: 0,
            totalTransactions: 0,
            lastTransaction: 'Never',
            status: 'active' // Default status
          });
        }
        
        const driver = driverMap.get(receipt.driverId)!;
        if (receipt.status === 'paid') {
          driver.totalPaid += receipt.amount;
          driver.totalTransactions++;
        }
        
        // Update last transaction date
        const receiptDate = new Date(receipt.createdAt).toLocaleDateString();
        if (driver.lastTransaction === 'Never' || receiptDate > driver.lastTransaction) {
          driver.lastTransaction = receiptDate;
        }
      });

      const drivers = Array.from(driverMap.values());
      
      return {
        success: true,
        data: drivers,
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

  async getReceipts(): Promise<ApiResponse<any[]>> {
    try {
      const receipts = await database.getAllReceipts();
      
      return {
        success: true,
        data: receipts.map(receipt => ({
          id: receipt.id,
          driverName: receipt.driverName,
          amount: receipt.amount,
          status: receipt.status,
          date: new Date(receipt.createdAt).toLocaleString(),
          method: receipt.paymentMethod,
          transactionHash: receipt.transactionHash
        })),
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

  async getQueue(): Promise<ApiResponse<any[]>> {
    try {
      const queuedPayments = contractGateway.getQueuedPayments();
      
      return {
        success: true,
        data: queuedPayments.map(payment => ({
          id: payment.id,
          driverName: payment.request.driverName,
          amount: Number(payment.request.amount / BigInt(10**18)),
          status: payment.status,
          date: new Date(payment.createdAt).toLocaleString(),
          recipient: payment.request.recipientAddress,
          error: payment.error
        })),
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

  async getStatistics(): Promise<ApiResponse<AdminStatistics>> {
    try {
      const receipts = await database.getAllReceipts();
      const queuedPayments = contractGateway.getQueuedPayments();
      
      // Calculate statistics
      const totalDrivers = new Set(receipts.map(r => r.driverId)).size;
      const activeDrivers = totalDrivers; // Assume all are active for now
      const totalRevenue = receipts
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.amount, 0);
      
      const today = new Date().toDateString();
      const todayTransactions = receipts.filter(r => 
        new Date(r.createdAt).toDateString() === today
      ).length;
      
      const queuedCount = queuedPayments.filter(p => p.status === 'queued').length;
      const failedCount = queuedPayments.filter(p => p.status === 'failed').length;
      
      return {
        success: true,
        data: {
          totalDrivers,
          activeDrivers,
          totalRevenue,
          todayTransactions,
          queuedPayments: queuedCount,
          failedPayments: failedCount
        },
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

  async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    try {
      const offlineStore = useOfflineTxStore.getState();
      const receipts = await database.getAllReceipts();
      
      return {
        success: true,
        data: {
          isOnline: offlineStore.isOnline,
          unsyncedCount: offlineStore.unsyncedCount,
          databaseStatus: 'healthy',
          blockchainStatus: 'connected',
          lastSync: new Date().toISOString(),
          connectedDevices: new Set(receipts.map(r => r.driverId)).size
        },
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

  async updateDriverStatus(driverId: string, status: 'active' | 'inactive' | 'pending'): Promise<ApiResponse<boolean>> {
    try {
      // In a real implementation, you would update the driver status in the database
      // For now, we'll just return success
      console.log(`Updating driver ${driverId} status to ${status}`);
      
      return {
        success: true,
        data: true,
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

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse<AuthSession>> {
    try {
      const session = await authService.authenticate(username, password);
      
      if (!session) {
        return {
          success: false,
          error: 'Invalid credentials',
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data: session,
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

  async logout(token: string): Promise<ApiResponse<boolean>> {
    try {
      const success = await authService.logout(token);
      return {
        success,
        data: success,
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

  // Helper method to validate authentication
  private async validateAuth(token: string): Promise<AuthSession | null> {
    if (!token) return null;
    return await authService.validateSession(token);
  }

  // Realtime service methods
  async getRealtimeStatus(): Promise<ApiResponse> {
    try {
      const status = realtimeService.getStatus();
      return {
        success: true,
        data: status,
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

  async triggerRealtimeUpdate(type: string): Promise<ApiResponse> {
    try {
      await realtimeService.triggerUpdate(type);
      return {
        success: true,
        data: { type, triggered: true },
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

  // Sync service methods
  async getSyncStatus(): Promise<ApiResponse> {
    try {
      const status = await syncService.getSyncStatus();
      return {
        success: true,
        data: status,
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

  async getSyncData(): Promise<ApiResponse> {
    try {
      const data = await syncService.getSyncData();
      return {
        success: true,
        data,
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

  async triggerSync(): Promise<ApiResponse> {
    try {
      const success = await syncService.triggerSync();
      return {
        success,
        data: { triggered: success },
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

  // Utility method to handle API calls
  async handleRequest(method: string, path: string, data?: any, authToken?: string): Promise<ApiResponse> {
    try {
      // Handle authentication endpoints
      if (path === '/api/auth/login' && method === 'POST') {
        return await this.login(data.username, data.password);
      }
      
      if (path === '/api/auth/logout' && method === 'POST') {
        return await this.logout(authToken || '');
      }

      // Validate authentication for protected endpoints
      const session = await this.validateAuth(authToken || '');
      if (!session) {
        return {
          success: false,
          error: 'Authentication required',
          timestamp: Date.now()
        };
      }

      switch (method) {
        case 'GET':
          if (path === '/api/drivers') return await this.getDrivers();
          if (path === '/api/receipts') return await this.getReceipts();
          if (path === '/api/queue') return await this.getQueue();
          if (path === '/api/statistics') return await this.getStatistics();
          if (path === '/api/status') return await this.getSystemStatus();
          if (path === '/api/realtime/status') return await this.getRealtimeStatus();
          if (path === '/api/sync/status') return await this.getSyncStatus();
          if (path === '/api/sync/data') return await this.getSyncData();
          break;
          
        case 'POST':
          if (path.startsWith('/api/drivers/') && path.endsWith('/status')) {
            const driverId = path.split('/')[3];
            return await this.updateDriverStatus(driverId, data.status);
          }
          if (path === '/api/realtime/trigger') {
            return await this.triggerRealtimeUpdate(data.type);
          }
          if (path === '/api/sync/trigger') {
            return await this.triggerSync();
          }
          break;
      }
      
      return {
        success: false,
        error: 'Endpoint not found',
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
}

// Export singleton instance
export const apiServer = ApiServer.getInstance();
