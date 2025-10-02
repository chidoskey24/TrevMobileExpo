// src/lib/authService.ts
import { database } from './database';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthSession {
  token: string;
  userId: string;
  username: string;
  role: string;
  expiresAt: number;
}

class AuthService {
  private static instance: AuthService;
  private sessions: Map<string, AuthSession> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize admin users table
  async initialize(): Promise<void> {
    try {
      // Create default admin user if none exists
      const existingAdmins = await database.getAdminUserCount();
      if (existingAdmins === 0) {
        await this.createDefaultAdmin();
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      throw error;
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    const defaultAdmin: AdminUser = {
      id: 'admin-001',
      username: 'admin',
      passwordHash: await this.hashPassword('admin123'), // Default password
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await database.createAdminUser(defaultAdmin);

    console.log('Default admin user created: admin/admin123');
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash function for React Native compatibility
    // In production, use a proper crypto library like react-native-crypto-js
    const input = password + 'trevmobile_salt';
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  async authenticate(username: string, password: string): Promise<AuthSession | null> {
    try {
      const user = await database.getAdminUser(username);

      if (!user) {
        return null;
      }

      const passwordHash = await this.hashPassword(password);
      if (user.password_hash !== passwordHash) {
        return null;
      }

      // Update last login
      await database.updateAdminLastLogin(user.id);

      // Create session
      const session: AuthSession = {
        token: this.generateToken(),
        userId: user.id,
        username: user.username,
        role: user.role,
        expiresAt: Date.now() + this.SESSION_DURATION
      };

      this.sessions.set(session.token, session);
      return session;
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }

  async validateSession(token: string): Promise<AuthSession | null> {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  async logout(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async createAdmin(username: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<AdminUser> {
    try {
      const existingUser = await database.getAdminUser(username);

      if (existingUser) {
        throw new Error('Username already exists');
      }

      const admin: AdminUser = {
        id: `admin-${Date.now()}`,
        username,
        passwordHash: await this.hashPassword(password),
        role,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await database.createAdminUser(admin);

      return admin;
    } catch (error) {
      console.error('Failed to create admin:', error);
      throw error;
    }
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const admins = await database.getAllAdmins();
      return admins as AdminUser[];
    } catch (error) {
      console.error('Failed to get admins:', error);
      throw error;
    }
  }

  async updateAdminStatus(adminId: string, isActive: boolean): Promise<boolean> {
    try {
      await database.updateAdminStatus(adminId, isActive);
      return true;
    } catch (error) {
      console.error('Failed to update admin status:', error);
      return false;
    }
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    this.sessions.forEach((session, token) => {
      if (now > session.expiresAt) {
        expiredTokens.push(token);
      }
    });
    
    expiredTokens.forEach(token => {
      this.sessions.delete(token);
    });
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
