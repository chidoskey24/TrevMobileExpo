// src/store/receiptStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { database, ReceiptRecord } from '../lib/database';

export interface ReceiptState {
  receipts: ReceiptRecord[];
  isLoading: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  addReceipt: (receipt: Omit<ReceiptRecord, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReceiptStatus: (id: string, status: ReceiptRecord['status'], transactionHash?: string) => Promise<void>;
  getReceiptsByDriver: (driverId: string) => Promise<ReceiptRecord[]>;
  getReceiptsByStatus: (status: ReceiptRecord['status']) => Promise<ReceiptRecord[]>;
  refreshReceipts: () => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  clearAllReceipts: () => Promise<void>;
}

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set, get) => ({
      receipts: [],
      isLoading: false,

      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Initialize database
          await database.init();
          
          // Load receipts from database
          const receipts = await database.getAllReceipts();
          
          set({ 
            receipts, 
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to initialize receipt store:', error);
          set({ isLoading: false });
        }
      },

      addReceipt: async (receipt) => {
        try {
          // Ensure database is initialized before adding receipt
          await database.init();
          
          // Add to database first
          await database.insertReceipt(receipt);
          
          // Add to local state
          const newReceipt: ReceiptRecord = {
            ...receipt,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          set(state => ({
            receipts: [newReceipt, ...state.receipts]
          }));
        } catch (error) {
          console.error('Failed to add receipt:', error);
          throw error;
        }
      },

      updateReceiptStatus: async (id, status, transactionHash) => {
        try {
          await database.updateReceiptStatus(id, status, transactionHash);
          
          set(state => ({
            receipts: state.receipts.map(receipt => 
              receipt.id === id 
                ? { 
                    ...receipt, 
                    status, 
                    transactionHash: transactionHash || receipt.transactionHash,
                    updatedAt: Date.now() 
                  } 
                : receipt
            )
          }));
        } catch (error) {
          console.error('Failed to update receipt status:', error);
          throw error;
        }
      },

      getReceiptsByDriver: async (driverId) => {
        try {
          return await database.getReceiptsByDriver(driverId);
        } catch (error) {
          console.error('Failed to get receipts by driver:', error);
          throw error;
        }
      },

      getReceiptsByStatus: async (status) => {
        try {
          return await database.getReceiptsByStatus(status);
        } catch (error) {
          console.error('Failed to get receipts by status:', error);
          throw error;
        }
      },

      refreshReceipts: async () => {
        try {
          set({ isLoading: true });
          const receipts = await database.getAllReceipts();
          
          set({ 
            receipts, 
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to refresh receipts:', error);
          set({ isLoading: false });
        }
      },

      deleteReceipt: async (id) => {
        try {
          await database.deleteReceipt(id);
          
          set(state => ({
            receipts: state.receipts.filter(receipt => receipt.id !== id)
          }));
        } catch (error) {
          console.error('Failed to delete receipt:', error);
          throw error;
        }
      },

      clearAllReceipts: async () => {
        try {
          await database.clearAllReceipts();
          set({ 
            receipts: []
          });
        } catch (error) {
          console.error('Failed to clear receipts:', error);
          throw error;
        }
      },
    }),
    {
      name: 'receipt-store',
      // Only persist certain fields, not the full state
      partialize: (state) => ({
        receipts: state.receipts,
      }),
    }
  )
);
