// src/lib/syncService.ts
import { supabase } from './supabase';
import { TransactionRecord } from './database';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncService {
  private static instance: SyncService;
  private isSyncing = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncTransactions(transactions: TransactionRecord[]): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      console.log(`Starting sync of ${transactions.length} transactions...`);

      for (const transaction of transactions) {
        try {
          await this.syncSingleTransaction(transaction);
          result.syncedCount++;
        } catch (error) {
          result.failedCount++;
          result.errors.push(`Failed to sync transaction ${transaction.id}: ${error}`);
          console.error(`Failed to sync transaction ${transaction.id}:`, error);
        }
      }

      result.success = result.failedCount === 0;
      console.log(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync service error: ${error}`);
      console.error('Sync service error:', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncSingleTransaction(transaction: TransactionRecord): Promise<void> {
    try {
      // Check if we're using a mock client
      if (!supabase.from || typeof supabase.from !== 'function') {
        console.log(`Mock sync: Transaction ${transaction.id} would be synced to server`);
        return; // Mock client - just log and return success
      }

      // Prepare transaction data for Supabase
      const transactionData = {
        id: transaction.id,
        type: transaction.type,
        title: transaction.title,
        subtitle: transaction.subtitle,
        amount: transaction.amount,
        currency: transaction.currency || '₦',
        timestamp: transaction.timestamp,
        created_at: new Date(transaction.createdAt).toISOString(),
        updated_at: new Date(transaction.updatedAt).toISOString(),
      };

      // Insert or update transaction in Supabase
      const { error } = await supabase
        .from('transactions')
        .upsert(transactionData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`Successfully synced transaction ${transaction.id}`);
    } catch (error) {
      throw new Error(`Failed to sync transaction: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Check if we're using a mock client
      if (!supabase.from || typeof supabase.from !== 'function') {
        console.log('Using mock Supabase client - connection test skipped');
        return false; // Mock client means no real connection
      }

      // Test Supabase connection
      const { error } = await supabase
        .from('transactions')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }

      console.log('Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  async getServerTransactionCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Failed to get server count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get server transaction count:', error);
      return 0;
    }
  }

  async pullLatestTransactions(limit = 50): Promise<TransactionRecord[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to pull transactions: ${error.message}`);
      }

      // Convert Supabase format to our TransactionRecord format
      return (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        amount: item.amount,
        currency: item.currency,
        timestamp: item.timestamp,
        synced: true, // These are from server, so they're synced
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
      }));
    } catch (error) {
      console.error('Failed to pull latest transactions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
