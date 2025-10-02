// src/lib/syncService.ts
import { database } from './database';
import { receiptService } from './receiptService';
import { contractGateway } from './contractGateway';
import { useOfflineTxStore } from '../store/offlineTxStore';
import { realtimeService } from './realtimeService';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string;
  pendingSync: number;
  syncInProgress: boolean;
  lastError?: string;
}

export interface SyncData {
  receipts: any[];
  transactions: any[];
  queuedPayments: any[];
  driverStats: any[];
}

class SyncService {
  private static instance: SyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  start(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.SYNC_INTERVAL);
    
    console.log('Sync service started');
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('Sync service stopped');
  }

  async performSync(): Promise<void> {
    if (this.isSyncing) return;
    
    const offlineStore = useOfflineTxStore.getState();
    if (!offlineStore.isOnline) {
      console.log('Device offline, skipping sync');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('Starting data sync...');
      
      // Sync receipts
      await this.syncReceipts();
      
      // Sync transactions
      await this.syncTransactions();
      
      // Sync queued payments
      await this.syncQueuedPayments();
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      
      // Trigger realtime updates
      await realtimeService.triggerUpdate('drivers');
      await realtimeService.triggerUpdate('receipts');
      await realtimeService.triggerUpdate('queue');
      await realtimeService.triggerUpdate('statistics');
      
      console.log('Data sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncReceipts(): Promise<void> {
    try {
      const receipts = await database.getAllReceipts();
      
      // In a real implementation, you would sync with a remote server
      // For now, we'll just log the sync
      console.log(`Synced ${receipts.length} receipts`);
    } catch (error) {
      console.error('Failed to sync receipts:', error);
      throw error;
    }
  }

  private async syncTransactions(): Promise<void> {
    try {
      const offlineStore = useOfflineTxStore.getState();
      
      // In a real implementation, you would sync with a remote server
      // For now, we'll just log the sync
      console.log(`Synced ${offlineStore.unsyncedCount} transactions`);
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      throw error;
    }
  }

  private async syncQueuedPayments(): Promise<void> {
    try {
      const queuedPayments = contractGateway.getQueuedPayments();
      
      // Process queued payments
      for (const payment of queuedPayments) {
        if (payment.status === 'queued') {
          try {
            // Attempt to process the payment
            const result = await contractGateway.submitPayment(payment.request);
            if (result.success) {
              // Update payment status
              payment.status = 'completed';
              payment.transactionHash = result.transactionHash;
            }
          } catch (error) {
            console.error(`Failed to process queued payment ${payment.id}:`, error);
            payment.status = 'failed';
            payment.error = (error as Error).message;
          }
        }
      }
      
      console.log(`Processed ${queuedPayments.length} queued payments`);
    } catch (error) {
      console.error('Failed to sync queued payments:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const offlineStore = useOfflineTxStore.getState();
    
    return {
      isOnline: offlineStore.isOnline,
      lastSync: this.lastSyncTime ? new Date(this.lastSyncTime).toISOString() : 'Never',
      pendingSync: offlineStore.unsyncedCount,
      syncInProgress: this.isSyncing,
      lastError: undefined // Could be enhanced to track last error
    };
  }

  async getSyncData(): Promise<SyncData> {
    try {
      const receipts = await database.getAllReceipts();
      const offlineStore = useOfflineTxStore.getState();
      const queuedPayments = contractGateway.getQueuedPayments();
      
      // Calculate driver stats
      const driverMap = new Map();
      receipts.forEach(receipt => {
        if (!driverMap.has(receipt.driverId)) {
          driverMap.set(receipt.driverId, {
            driverId: receipt.driverId,
            driverName: receipt.driverName,
            totalPaid: 0,
            totalTransactions: 0,
            lastTransaction: 'Never',
            status: 'active'
          });
        }
        
        const driver = driverMap.get(receipt.driverId);
        if (receipt.status === 'paid') {
          driver.totalPaid += receipt.amount;
          driver.totalTransactions++;
        }
        
        const receiptDate = new Date(receipt.createdAt).toLocaleDateString();
        if (driver.lastTransaction === 'Never' || receiptDate > driver.lastTransaction) {
          driver.lastTransaction = receiptDate;
        }
      });

      return {
        receipts: receipts.map(receipt => ({
          id: receipt.id,
          driverName: receipt.driverName,
          amount: receipt.amount,
          status: receipt.status,
          date: new Date(receipt.createdAt).toLocaleString(),
          method: receipt.paymentMethod,
          transactionHash: receipt.transactionHash
        })),
        transactions: [], // Would be populated from transaction store
        queuedPayments: queuedPayments.map(payment => ({
          id: payment.id,
          driverName: payment.request.driverName,
          amount: Number(payment.request.amount / BigInt(10**18)),
          status: payment.status,
          date: new Date(payment.createdAt).toLocaleString(),
          recipient: payment.request.recipientAddress,
          error: payment.error
        })),
        driverStats: Array.from(driverMap.values())
      };
    } catch (error) {
      console.error('Failed to get sync data:', error);
      throw error;
    }
  }

  // Manual sync trigger
  async triggerSync(): Promise<boolean> {
    try {
      await this.performSync();
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  // Get service status
  getStatus(): { isRunning: boolean; isSyncing: boolean; lastSync: number } {
    return {
      isRunning: this.syncInterval !== null,
      isSyncing: this.isSyncing,
      lastSync: this.lastSyncTime
    };
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();