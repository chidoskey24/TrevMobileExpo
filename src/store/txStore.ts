import { create } from 'zustand';
import { useOfflineTxStore } from './offlineTxStore';

export type TxRecord = {
  id: string; // tx hash or uuid
  type: 'deposit' | 'withdraw';
  title: string;
  subtitle: string; // e.g. "0.10 POL"
  amount: number;   // positive = deposit, negative = withdraw
  currency?: string; // default "₦"
  timestamp?: number;
};

interface TxState {
  txs: TxRecord[];
  hasUnread: boolean;
  addTx: (tx: TxRecord) => Promise<void>;
  markAllRead: () => void;
  initialize: () => Promise<void>;
}

export const useTxStore = create<TxState>()((set, get) => ({
  txs: [],
  hasUnread: false,
  
  initialize: async () => {
    try {
      // Initialize the offline store
      await useOfflineTxStore.getState().initialize();
      
      // Load transactions from offline store
      const offlineStore = useOfflineTxStore.getState();
      const transactions = offlineStore.transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        title: tx.title,
        subtitle: tx.subtitle,
        amount: tx.amount,
        currency: tx.currency,
        timestamp: tx.timestamp,
      }));
      
      set({ txs: transactions });
    } catch (error) {
      console.error('Failed to initialize transaction store:', error);
    }
  },

  addTx: async (tx) => {
    try {
      // Add to offline store (which handles SQLite persistence)
      await useOfflineTxStore.getState().addTransaction({
        id: tx.id,
        type: tx.type,
        title: tx.title,
        subtitle: tx.subtitle,
        amount: tx.amount,
        currency: tx.currency,
        timestamp: tx.timestamp || Date.now(),
      });
      
      // Update local state
      set((state) => ({
        txs: [{ ...tx, timestamp: tx.timestamp || Date.now() }, ...state.txs],
        hasUnread: true,
      }));
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  },
  
  markAllRead: () => set({ hasUnread: false }),
})); 