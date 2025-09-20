// src/store/offlineTxStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { database, TransactionRecord } from '../lib/database';
import { syncService } from '../lib/syncService';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineTxState {
  transactions: TransactionRecord[];
  isLoading: boolean;
  isOnline: boolean;
  unsyncedCount: number;
  
  // Actions
  initialize: () => Promise<void>;
  addTransaction: (tx: Omit<TransactionRecord, 'synced' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  markTransactionAsSynced: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  syncPendingTransactions: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useOfflineTxStore = create<OfflineTxState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      isOnline: true,
      unsyncedCount: 0,

      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Initialize database
          await database.init();
          
          // Load transactions from database
          const transactions = await database.getAllTransactions();
          
          // Get unsynced count
          const unsyncedCount = await database.getUnsyncedCount();
          
          // Check network status
          const netInfo = await NetInfo.fetch();
          const isOnline = netInfo.isConnected ?? false;
          
          set({ 
            transactions, 
            unsyncedCount,
            isOnline,
            isLoading: false 
          });

          // Listen for network changes
          NetInfo.addEventListener(state => {
            const wasOnline = get().isOnline;
            const isNowOnline = state.isConnected ?? false;
            
            if (!wasOnline && isNowOnline) {
              // Just came online, trigger sync
              get().syncPendingTransactions();
            }
            
            set({ isOnline: isNowOnline });
          });

          // Auto-sync if online
          if (isOnline && unsyncedCount > 0) {
            get().syncPendingTransactions();
          }
        } catch (error) {
          console.error('Failed to initialize offline transaction store:', error);
          set({ isLoading: false });
        }
      },

      addTransaction: async (tx) => {
        try {
          // Add to database first (offline-first)
          await database.insertTransaction(tx);
          
          // Add to local state
          const newTransaction: TransactionRecord = {
            ...tx,
            synced: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          set(state => ({
            transactions: [newTransaction, ...state.transactions],
            unsyncedCount: state.unsyncedCount + 1
          }));

          // Try to sync immediately if online
          if (get().isOnline) {
            get().syncPendingTransactions();
          }
        } catch (error) {
          console.error('Failed to add transaction:', error);
          throw error;
        }
      },

      markTransactionAsSynced: async (id: string) => {
        try {
          await database.markTransactionAsSynced(id);
          
          set(state => ({
            transactions: state.transactions.map(tx => 
              tx.id === id ? { ...tx, synced: true, updatedAt: Date.now() } : tx
            ),
            unsyncedCount: Math.max(0, state.unsyncedCount - 1)
          }));
        } catch (error) {
          console.error('Failed to mark transaction as synced:', error);
        }
      },

      refreshTransactions: async () => {
        try {
          set({ isLoading: true });
          const transactions = await database.getAllTransactions();
          const unsyncedCount = await database.getUnsyncedCount();
          
          set({ 
            transactions, 
            unsyncedCount,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to refresh transactions:', error);
          set({ isLoading: false });
        }
      },

      syncPendingTransactions: async () => {
        if (!get().isOnline) {
          console.log('Offline - skipping sync');
          return;
        }

        try {
          const unsyncedTransactions = await database.getUnsyncedTransactions();
          
          if (unsyncedTransactions.length === 0) {
            console.log('No pending transactions to sync');
            return;
          }

          console.log(`Syncing ${unsyncedTransactions.length} pending transactions...`);

          // Use the sync service to sync all transactions
          const result = await syncService.syncTransactions(unsyncedTransactions);
          
          if (result.success) {
            // Mark all transactions as synced
            for (const tx of unsyncedTransactions) {
              await get().markTransactionAsSynced(tx.id);
            }
            console.log(`Successfully synced ${result.syncedCount} transactions`);
          } else {
            console.error(`Sync failed: ${result.errors.join(', ')}`);
          }
        } catch (error) {
          console.error('Failed to sync pending transactions:', error);
        }
      },

      clearAllTransactions: async () => {
        try {
          await database.clearAllTransactions();
          set({ 
            transactions: [], 
            unsyncedCount: 0 
          });
        } catch (error) {
          console.error('Failed to clear transactions:', error);
        }
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        
        // Trigger sync when coming online
        if (isOnline && get().unsyncedCount > 0) {
          get().syncPendingTransactions();
        }
      },
    }),
    {
      name: 'offline-tx-store',
      // Only persist certain fields, not the full state
      partialize: (state) => ({
        isOnline: state.isOnline,
        unsyncedCount: state.unsyncedCount,
      }),
    }
  )
);

