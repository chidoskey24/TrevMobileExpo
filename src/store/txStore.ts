import { create } from 'zustand';

export type TxRecord = {
  id: string; // tx hash or uuid
  type: 'deposit' | 'withdraw';
  title: string;
  subtitle: string; // e.g. "0.10 POL"
  amount: number;   // positive = deposit, negative = withdraw
  currency?: string; // default "₦"
};

interface TxState {
  txs: TxRecord[];
  addTx: (tx: TxRecord) => void;
}

export const useTxStore = create<TxState>()((set) => ({
  txs: [],
  addTx: (tx) => set((state) => ({ txs: [tx, ...state.txs] })),
})); 