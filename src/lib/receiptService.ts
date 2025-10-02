// src/lib/receiptService.ts
import { database, ReceiptRecord } from './database';
import { useReceiptStore } from '../store/receiptStore';
import { useAppStore } from '../store/useAppStore';

export interface ReceiptData {
  transactionId: string;
  driverId: string;
  driverName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  recipientAddress?: string;
  contractAddress?: string;
  timestamp: number;
  location?: string;
  tripDetails?: {
    from: string;
    to: string;
    distance?: number;
    duration?: number;
  };
}

export class ReceiptService {
  private static instance: ReceiptService;

  static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  async createReceipt(receiptData: ReceiptData, status: ReceiptRecord['status'] = 'queued'): Promise<string> {
    try {
      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const receipt: Omit<ReceiptRecord, 'createdAt' | 'updatedAt'> = {
        id: receiptId,
        transactionId: receiptData.transactionId,
        driverId: receiptData.driverId,
        driverName: receiptData.driverName,
        amount: receiptData.amount,
        currency: receiptData.currency,
        paymentMethod: receiptData.paymentMethod,
        status,
        receiptData: JSON.stringify(receiptData),
      };

      // Add to receipt store
      const receiptStore = useReceiptStore.getState();
      await receiptStore.addReceipt(receipt);

      console.log(`Receipt created: ${receiptId}`);
      return receiptId;
    } catch (error) {
      console.error('Failed to create receipt:', error);
      throw error;
    }
  }

  async updateReceiptWithTransaction(receiptId: string, transactionHash: string, status: ReceiptRecord['status'] = 'paid'): Promise<void> {
    try {
      const receiptStore = useReceiptStore.getState();
      await receiptStore.updateReceiptStatus(receiptId, status, transactionHash);
      
      console.log(`Receipt ${receiptId} updated with transaction hash: ${transactionHash}`);
    } catch (error) {
      console.error('Failed to update receipt with transaction:', error);
      throw error;
    }
  }

  async getReceiptById(receiptId: string): Promise<ReceiptRecord | null> {
    try {
      return await database.getReceiptById(receiptId);
    } catch (error) {
      console.error('Failed to get receipt by ID:', error);
      throw error;
    }
  }

  async getDriverReceipts(driverId: string): Promise<ReceiptRecord[]> {
    try {
      return await database.getReceiptsByDriver(driverId);
    } catch (error) {
      console.error('Failed to get driver receipts:', error);
      throw error;
    }
  }

  async getPendingReceipts(): Promise<ReceiptRecord[]> {
    try {
      return await database.getReceiptsByStatus('queued');
    } catch (error) {
      console.error('Failed to get pending receipts:', error);
      throw error;
    }
  }

  async generateReceiptPDF(receiptId: string): Promise<string> {
    try {
      const receipt = await this.getReceiptById(receiptId);
      if (!receipt) {
        throw new Error('Receipt not found');
      }

      const receiptData = JSON.parse(receipt.receiptData);
      
      // Generate PDF content (simplified for demo)
      const pdfContent = `
        RECEIPT
        =======
        
        Receipt ID: ${receipt.id}
        Date: ${new Date(receipt.createdAt).toLocaleString()}
        
        Driver: ${receipt.driverName}
        Amount: ${receipt.amount} ${receipt.currency}
        Payment Method: ${receipt.paymentMethod}
        Status: ${receipt.status.toUpperCase()}
        
        ${receipt.transactionHash ? `Transaction Hash: ${receipt.transactionHash}` : ''}
        
        Trip Details:
        ${receiptData.tripDetails ? `
          From: ${receiptData.tripDetails.from}
          To: ${receiptData.tripDetails.to}
          ${receiptData.tripDetails.distance ? `Distance: ${receiptData.tripDetails.distance} km` : ''}
          ${receiptData.tripDetails.duration ? `Duration: ${receiptData.tripDetails.duration} min` : ''}
        ` : ''}
        
        Thank you for using TrevMobile!
      `;

      // In a real implementation, you would use a PDF generation library
      // For now, we'll return the content as a string
      return pdfContent;
    } catch (error) {
      console.error('Failed to generate receipt PDF:', error);
      throw error;
    }
  }

  async markReceiptAsFailed(receiptId: string, reason: string): Promise<void> {
    try {
      const receipt = await this.getReceiptById(receiptId);
      if (!receipt) {
        throw new Error('Receipt not found');
      }

      const receiptData = JSON.parse(receipt.receiptData);
      receiptData.failureReason = reason;
      
      // Update the receipt data with failure reason
      const updatedReceipt: Omit<ReceiptRecord, 'createdAt' | 'updatedAt'> = {
        ...receipt,
        status: 'failed',
        receiptData: JSON.stringify(receiptData),
      };

      const receiptStore = useReceiptStore.getState();
      await receiptStore.updateReceiptStatus(receiptId, 'failed');
      
      console.log(`Receipt ${receiptId} marked as failed: ${reason}`);
    } catch (error) {
      console.error('Failed to mark receipt as failed:', error);
      throw error;
    }
  }

  async getReceiptStatistics(): Promise<{
    totalReceipts: number;
    paidReceipts: number;
    queuedReceipts: number;
    failedReceipts: number;
    totalAmount: number;
  }> {
    try {
      const receipts = await database.getAllReceipts();
      
      const stats = receipts.reduce((acc, receipt) => {
        acc.totalReceipts++;
        acc.totalAmount += receipt.amount;
        
        switch (receipt.status) {
          case 'paid':
            acc.paidReceipts++;
            break;
          case 'queued':
            acc.queuedReceipts++;
            break;
          case 'failed':
            acc.failedReceipts++;
            break;
        }
        
        return acc;
      }, {
        totalReceipts: 0,
        paidReceipts: 0,
        queuedReceipts: 0,
        failedReceipts: 0,
        totalAmount: 0,
      });

      return stats;
    } catch (error) {
      console.error('Failed to get receipt statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const receiptService = ReceiptService.getInstance();
