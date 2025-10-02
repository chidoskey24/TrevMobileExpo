// src/lib/realtimeService.ts
import { apiServer } from './apiServer';
import { authService } from './authService';

export interface RealtimeUpdate {
  type: 'driver_update' | 'receipt_update' | 'queue_update' | 'statistics_update' | 'system_status_update';
  data: any;
  timestamp: number;
}

export interface RealtimeSubscriber {
  id: string;
  callback: (update: RealtimeUpdate) => void;
  types?: string[];
}

class RealtimeService {
  private static instance: RealtimeService;
  private subscribers: Map<string, RealtimeSubscriber> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdate: number = 0;
  private isRunning: boolean = false;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.POLL_INTERVAL);
    
    console.log('Realtime service started');
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Realtime service stopped');
  }

  subscribe(subscriber: RealtimeSubscriber): void {
    this.subscribers.set(subscriber.id, subscriber);
    console.log(`Subscriber ${subscriber.id} added`);
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    console.log(`Subscriber ${subscriberId} removed`);
  }

  private async checkForUpdates(): Promise<void> {
    try {
      // Get current timestamp
      const now = Date.now();
      
      // Check for driver updates
      await this.checkDriverUpdates(now);
      
      // Check for receipt updates
      await this.checkReceiptUpdates(now);
      
      // Check for queue updates
      await this.checkQueueUpdates(now);
      
      // Check for statistics updates
      await this.checkStatisticsUpdates(now);
      
      // Check for system status updates
      await this.checkSystemStatusUpdates(now);
      
      this.lastUpdate = now;
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  private async checkDriverUpdates(timestamp: number): Promise<void> {
    try {
      const response = await apiServer.getDrivers();
      if (response.success) {
        this.notifySubscribers({
          type: 'driver_update',
          data: response.data,
          timestamp
        }, 'driver_update');
      }
    } catch (error) {
      console.error('Error checking driver updates:', error);
    }
  }

  private async checkReceiptUpdates(timestamp: number): Promise<void> {
    try {
      const response = await apiServer.getReceipts();
      if (response.success) {
        this.notifySubscribers({
          type: 'receipt_update',
          data: response.data,
          timestamp
        }, 'receipt_update');
      }
    } catch (error) {
      console.error('Error checking receipt updates:', error);
    }
  }

  private async checkQueueUpdates(timestamp: number): Promise<void> {
    try {
      const response = await apiServer.getQueue();
      if (response.success) {
        this.notifySubscribers({
          type: 'queue_update',
          data: response.data,
          timestamp
        }, 'queue_update');
      }
    } catch (error) {
      console.error('Error checking queue updates:', error);
    }
  }

  private async checkStatisticsUpdates(timestamp: number): Promise<void> {
    try {
      const response = await apiServer.getStatistics();
      if (response.success) {
        this.notifySubscribers({
          type: 'statistics_update',
          data: response.data,
          timestamp
        }, 'statistics_update');
      }
    } catch (error) {
      console.error('Error checking statistics updates:', error);
    }
  }

  private async checkSystemStatusUpdates(timestamp: number): Promise<void> {
    try {
      const response = await apiServer.getSystemStatus();
      if (response.success) {
        this.notifySubscribers({
          type: 'system_status_update',
          data: response.data,
          timestamp
        }, 'system_status_update');
      }
    } catch (error) {
      console.error('Error checking system status updates:', error);
    }
  }

  private notifySubscribers(update: RealtimeUpdate, type: string): void {
    for (const [id, subscriber] of this.subscribers.entries()) {
      try {
        // Check if subscriber is interested in this type of update
        if (!subscriber.types || subscriber.types.includes(type)) {
          subscriber.callback(update);
        }
      } catch (error) {
        console.error(`Error notifying subscriber ${id}:`, error);
      }
    }
  }

  // Manual trigger for immediate updates
  async triggerUpdate(type: string): Promise<void> {
    const timestamp = Date.now();
    
    switch (type) {
      case 'drivers':
        await this.checkDriverUpdates(timestamp);
        break;
      case 'receipts':
        await this.checkReceiptUpdates(timestamp);
        break;
      case 'queue':
        await this.checkQueueUpdates(timestamp);
        break;
      case 'statistics':
        await this.checkStatisticsUpdates(timestamp);
        break;
      case 'system':
        await this.checkSystemStatusUpdates(timestamp);
        break;
      default:
        await this.checkForUpdates();
    }
  }

  // Get service status
  getStatus(): { isRunning: boolean; subscriberCount: number; lastUpdate: number } {
    return {
      isRunning: this.isRunning,
      subscriberCount: this.subscribers.size,
      lastUpdate: this.lastUpdate
    };
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();
