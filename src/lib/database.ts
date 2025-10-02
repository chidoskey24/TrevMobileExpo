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

export interface ReceiptRecord {
  id: string;
  transactionId: string; // Links to the transaction
  driverId: string;
  driverName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'paid' | 'queued' | 'failed';
  transactionHash?: string; // Blockchain transaction hash
  receiptData: string; // JSON string of receipt details
  createdAt: number;
  updatedAt: number;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        console.log('Database already initialized');
        return;
      }

      this.db = await SQLite.openDatabaseAsync('trevmobile.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.init();
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

    const createReceiptsTable = `
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        driverId TEXT NOT NULL,
        driverName TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT '₦',
        paymentMethod TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('paid', 'queued', 'failed')),
        transactionHash TEXT,
        receiptData TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (transactionId) REFERENCES transactions (id)
      );
    `;

    const createAdminUsersTable = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL,
        last_login TEXT,
        is_active INTEGER NOT NULL DEFAULT 1
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_receipts_transactionId ON receipts(transactionId);
      CREATE INDEX IF NOT EXISTS idx_receipts_driverId ON receipts(driverId);
      CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
      CREATE INDEX IF NOT EXISTS idx_receipts_createdAt ON receipts(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
    `;

    await this.db.execAsync(createTransactionsTable);
    await this.db.execAsync(createReceiptsTable);
    await this.db.execAsync(createAdminUsersTable);
    await this.db.execAsync(createIndexes);
  }

  async insertTransaction(transaction: Omit<TransactionRecord, 'synced' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
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
    } catch (error) {
      console.error('Error inserting transaction:', error);
      throw error;
    }
  }

  async getAllTransactions(limit?: number): Promise<TransactionRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = limit 
        ? `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?`
        : `SELECT * FROM transactions ORDER BY timestamp DESC`;

      const result = limit 
        ? await this.db.getAllAsync(sql, [limit])
        : await this.db.getAllAsync(sql);

      return result as TransactionRecord[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
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

    const values = fields.map(field => updates[field as keyof TransactionRecord]).filter(v => v !== undefined);
    values.push(Date.now(), id);

    await this.db.runAsync(sql, ...values);
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

  // Receipt methods
  async insertReceipt(receipt: Omit<ReceiptRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const now = Date.now();
      const sql = `
        INSERT INTO receipts (id, transactionId, driverId, driverName, amount, currency, paymentMethod, status, transactionHash, receiptData, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.runAsync(sql, [
        receipt.id,
        receipt.transactionId,
        receipt.driverId,
        receipt.driverName,
        receipt.amount,
        receipt.currency || '₦',
        receipt.paymentMethod,
        receipt.status,
        receipt.transactionHash || null,
        receipt.receiptData,
        now,
        now
      ]);
    } catch (error) {
      console.error('Error inserting receipt:', error);
      throw error;
    }
  }

  async getAllReceipts(limit?: number): Promise<ReceiptRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = limit 
        ? `SELECT * FROM receipts ORDER BY createdAt DESC LIMIT ?`
        : `SELECT * FROM receipts ORDER BY createdAt DESC`;

      const result = limit 
        ? await this.db.getAllAsync(sql, [limit])
        : await this.db.getAllAsync(sql);

      return result as ReceiptRecord[];
    } catch (error) {
      console.error('Error getting receipts:', error);
      throw error;
    }
  }

  async getReceiptsByDriver(driverId: string): Promise<ReceiptRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = `SELECT * FROM receipts WHERE driverId = ? ORDER BY createdAt DESC`;
      const result = await this.db.getAllAsync(sql, [driverId]);
      return result as ReceiptRecord[];
    } catch (error) {
      console.error('Error getting receipts by driver:', error);
      throw error;
    }
  }

  async getReceiptsByStatus(status: ReceiptRecord['status']): Promise<ReceiptRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = `SELECT * FROM receipts WHERE status = ? ORDER BY createdAt DESC`;
      const result = await this.db.getAllAsync(sql, [status]);
      return result as ReceiptRecord[];
    } catch (error) {
      console.error('Error getting receipts by status:', error);
      throw error;
    }
  }

  async updateReceiptStatus(id: string, status: ReceiptRecord['status'], transactionHash?: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = `UPDATE receipts SET status = ?, transactionHash = ?, updatedAt = ? WHERE id = ?`;
      await this.db.runAsync(sql, [status, transactionHash || null, Date.now(), id]);
    } catch (error) {
      console.error('Error updating receipt status:', error);
      throw error;
    }
  }

  async getReceiptById(id: string): Promise<ReceiptRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = `SELECT * FROM receipts WHERE id = ?`;
      const result = await this.db.getFirstAsync(sql, [id]);
      return result as ReceiptRecord | null;
    } catch (error) {
      console.error('Error getting receipt by id:', error);
      throw error;
    }
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const sql = `DELETE FROM receipts WHERE id = ?`;
      await this.db.runAsync(sql, [id]);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  async getReceiptCount(): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM receipts');
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting receipt count:', error);
      throw error;
    }
  }

  async clearAllReceipts(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.execAsync('DELETE FROM receipts');
    } catch (error) {
      console.error('Error clearing receipts:', error);
      throw error;
    }
  }

  // Admin user management methods
  async createAdminUsersTable(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          created_at TEXT NOT NULL,
          last_login TEXT,
          is_active INTEGER NOT NULL DEFAULT 1
        )
      `);
    } catch (error) {
      console.error('Error creating admin_users table:', error);
      throw error;
    }
  }

  async getAdminUser(username: string): Promise<any | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM admin_users WHERE username = ? AND is_active = 1',
        [username]
      );
      return result;
    } catch (error) {
      console.error('Error getting admin user:', error);
      throw error;
    }
  }

  async createAdminUser(admin: any): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.runAsync(
        'INSERT INTO admin_users (id, username, password_hash, role, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        admin.id, admin.username, admin.passwordHash, admin.role, admin.createdAt, admin.isActive ? 1 : 0
      );
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  async updateAdminLastLogin(userId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.runAsync(
        'UPDATE admin_users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), userId]
      );
    } catch (error) {
      console.error('Error updating admin last login:', error);
      throw error;
    }
  }

  async getAllAdmins(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM admin_users ORDER BY created_at DESC');
      return result.map((admin: any) => ({
        ...admin,
        isActive: Boolean(admin.is_active),
        passwordHash: '[HIDDEN]' // Don't expose password hashes
      }));
    } catch (error) {
      console.error('Error getting all admins:', error);
      throw error;
    }
  }

  async updateAdminStatus(adminId: string, isActive: boolean): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.runAsync(
        'UPDATE admin_users SET is_active = ? WHERE id = ?',
        [isActive ? 1 : 0, adminId]
      );
    } catch (error) {
      console.error('Error updating admin status:', error);
      throw error;
    }
  }

  async getAdminUserCount(): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM admin_users');
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting admin user count:', error);
      throw error;
    }
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
