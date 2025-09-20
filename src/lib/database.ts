// src/lib/database.ts
import * as SQLite from 'expo-sqlite';

export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdraw';
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  timestamp: number;
  synced: boolean; // Whether this transaction has been synced to the server
  createdAt: number; // When the record was created locally
  updatedAt: number; // When the record was last updated
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('trevmobile.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT '₦',
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    `;

    await this.db.execAsync(createTransactionsTable);
    await this.db.execAsync(createIndexes);
  }

  async insertTransaction(transaction: Omit<TransactionRecord, 'synced' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const sql = `
      INSERT INTO transactions (id, type, title, subtitle, amount, currency, timestamp, synced, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `;

    await this.db.runAsync(sql, [
      transaction.id,
      transaction.type,
      transaction.title,
      transaction.subtitle,
      transaction.amount,
      transaction.currency || '₦',
      transaction.timestamp,
      now,
      now
    ]);
  }

  async getAllTransactions(limit?: number): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = limit 
      ? `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM transactions ORDER BY timestamp DESC`;

    const result = limit 
      ? await this.db.getAllAsync(sql, [limit])
      : await this.db.getAllAsync(sql);

    return result as TransactionRecord[];
  }

  async getUnsyncedTransactions(): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `SELECT * FROM transactions WHERE synced = 0 ORDER BY createdAt ASC`;
    const result = await this.db.getAllAsync(sql);
    return result as TransactionRecord[];
  }

  async markTransactionAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `UPDATE transactions SET synced = 1, updatedAt = ? WHERE id = ?`;
    await this.db.runAsync(sql, [Date.now(), id]);
  }

  async updateTransaction(id: string, updates: Partial<TransactionRecord>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE transactions SET ${setClause}, updatedAt = ? WHERE id = ?`;

    const values = fields.map(field => updates[field as keyof TransactionRecord]);
    values.push(Date.now(), id);

    await this.db.runAsync(sql, values);
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `DELETE FROM transactions WHERE id = ?`;
    await this.db.runAsync(sql, [id]);
  }

  async getTransactionCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM transactions');
    return (result as any)?.count || 0;
  }

  async getUnsyncedCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM transactions WHERE synced = 0');
    return (result as any)?.count || 0;
  }

  async clearAllTransactions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('DELETE FROM transactions');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Export singleton instance
export const database = new Database();
