import { create } from 'zustand';

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
  addTx: (tx: TxRecord) => void;
  markAllRead: () => void;
}

export const useTxStore = create<TxState>()((set) => ({
  txs: [],
  hasUnread: false,
  addTx: (tx) =>
    set((state) => ({
      txs: [{ ...tx, timestamp: Date.now() }, ...state.txs],
      hasUnread: true,
    })),
  markAllRead: () => set({ hasUnread: false }),
})); 