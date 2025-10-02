// src/lib/contractGateway.ts
import { useWriteContract, usePublicClient, useWalletClient } from 'wagmi';
import { polygonAmoy } from 'viem/chains';
import DepositContractAbi from '../../abi/DepositContract.json';
import { formatEther } from 'viem';
import { receiptService } from './receiptService';
import { useAppStore } from '../store/useAppStore';

export interface PaymentRequest {
  contractAddress: string;
  recipientAddress: string;
  amount: bigint;
  driverId: string;
  driverName: string;
  paymentMethod?: string;
  tripDetails?: {
    from: string;
    to: string;
    distance?: number;
    duration?: number;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  receiptId?: string;
  error?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface QueuedPayment {
  id: string;
  request: PaymentRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  processedAt?: number;
  transactionHash?: string;
  receiptId?: string;
  error?: string;
}

export class ContractGateway {
  private static instance: ContractGateway;
  private queuedPayments: QueuedPayment[] = [];
  private isProcessing = false;

  static getInstance(): ContractGateway {
    if (!ContractGateway.instance) {
      ContractGateway.instance = new ContractGateway();
    }
    return ContractGateway.instance;
  }

  async submitPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('ContractGateway: Submitting payment request', request);

      // Check if we have the necessary clients
      const publicClient = usePublicClient({ chainId: polygonAmoy.id });
      const { data: walletClient } = useWalletClient({ chainId: polygonAmoy.id });

      if (!publicClient || !walletClient) {
        throw new Error('Wallet client not ready');
      }

      // Simulate the transaction first
      const { request: contractRequest } = await publicClient.simulateContract({
        account: await walletClient.getAddresses().then(a => a[0]),
        address: request.contractAddress as `0x${string}`,
        abi: DepositContractAbi.abi,
        functionName: 'deposit',
        args: [request.recipientAddress, request.amount],
        value: request.amount,
      });

      // Execute the transaction
      const transactionHash = await walletClient.writeContract(contractRequest);

      // Create receipt
      const amountEth = Number(formatEther(request.amount));
      let naira = amountEth;
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
        const priceJson = await res.json();
        const polPrice = priceJson['matic-network']?.ngn ?? 0;
        naira = amountEth * polPrice;
      } catch {}

      const receiptId = await receiptService.createReceipt({
        transactionId: transactionHash as string,
        driverId: request.driverId,
        driverName: request.driverName,
        amount: naira,
        currency: '₦',
        paymentMethod: request.paymentMethod || 'Blockchain (POL)',
        recipientAddress: request.recipientAddress,
        contractAddress: request.contractAddress,
        timestamp: Date.now(),
        tripDetails: request.tripDetails,
      }, 'paid');

      // Update receipt with transaction hash
      await receiptService.updateReceiptWithTransaction(receiptId, transactionHash as string, 'paid');

      console.log('ContractGateway: Payment completed successfully', { transactionHash, receiptId });

      return {
        success: true,
        transactionHash: transactionHash as string,
        receiptId,
        status: 'completed'
      };

    } catch (error) {
      console.error('ContractGateway: Payment failed', error);
      
      // Create failed receipt
      try {
        const amountEth = Number(formatEther(request.amount));
        let naira = amountEth;
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
          const priceJson = await res.json();
          const polPrice = priceJson['matic-network']?.ngn ?? 0;
          naira = amountEth * polPrice;
        } catch {}

        const receiptId = await receiptService.createReceipt({
          transactionId: `failed_${Date.now()}`,
          driverId: request.driverId,
          driverName: request.driverName,
          amount: naira,
          currency: '₦',
          paymentMethod: request.paymentMethod || 'Blockchain (POL)',
          recipientAddress: request.recipientAddress,
          contractAddress: request.contractAddress,
          timestamp: Date.now(),
          tripDetails: request.tripDetails,
        }, 'failed');

        await receiptService.markReceiptAsFailed(receiptId, (error as Error).message);

        return {
          success: false,
          error: (error as Error).message,
          receiptId,
          status: 'failed'
        };
      } catch (receiptError) {
        console.error('ContractGateway: Failed to create failed receipt', receiptError);
      }

      return {
        success: false,
        error: (error as Error).message,
        status: 'failed'
      };
    }
  }

  async queuePayment(request: PaymentRequest): Promise<string> {
    const queuedPayment: QueuedPayment = {
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      status: 'queued',
      createdAt: Date.now(),
    };

    this.queuedPayments.push(queuedPayment);
    console.log('ContractGateway: Payment queued', queuedPayment.id);

    // Create queued receipt
    try {
      const amountEth = Number(formatEther(request.amount));
      let naira = amountEth;
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
        const priceJson = await res.json();
        const polPrice = priceJson['matic-network']?.ngn ?? 0;
        naira = amountEth * polPrice;
      } catch {}

      const receiptId = await receiptService.createReceipt({
        transactionId: queuedPayment.id,
        driverId: request.driverId,
        driverName: request.driverName,
        amount: naira,
        currency: '₦',
        paymentMethod: request.paymentMethod || 'Blockchain (POL) - Queued',
        recipientAddress: request.recipientAddress,
        contractAddress: request.contractAddress,
        timestamp: Date.now(),
        tripDetails: request.tripDetails,
      }, 'queued');

      queuedPayment.receiptId = receiptId;
    } catch (error) {
      console.error('ContractGateway: Failed to create queued receipt', error);
    }

    return queuedPayment.id;
  }

  async processQueuedPayments(): Promise<void> {
    if (this.isProcessing) {
      console.log('ContractGateway: Already processing queued payments');
      return;
    }

    this.isProcessing = true;
    console.log('ContractGateway: Processing queued payments', this.queuedPayments.length);

    try {
      const queuedPayments = this.queuedPayments.filter(p => p.status === 'queued');
      
      for (const queuedPayment of queuedPayments) {
        try {
          queuedPayment.status = 'processing';
          
          const result = await this.submitPayment(queuedPayment.request);
          
          if (result.success) {
            queuedPayment.status = 'completed';
            queuedPayment.transactionHash = result.transactionHash;
            queuedPayment.processedAt = Date.now();
            
            // Update receipt status
            if (queuedPayment.receiptId && result.transactionHash) {
              await receiptService.updateReceiptWithTransaction(
                queuedPayment.receiptId, 
                result.transactionHash, 
                'paid'
              );
            }
            
            console.log('ContractGateway: Queued payment completed', queuedPayment.id);
          } else {
            queuedPayment.status = 'failed';
            queuedPayment.error = result.error;
            queuedPayment.processedAt = Date.now();
            
            // Update receipt status
            if (queuedPayment.receiptId) {
              await receiptService.markReceiptAsFailed(
                queuedPayment.receiptId, 
                result.error || 'Unknown error'
              );
            }
            
            console.log('ContractGateway: Queued payment failed', queuedPayment.id, result.error);
          }
        } catch (error) {
          queuedPayment.status = 'failed';
          queuedPayment.error = (error as Error).message;
          queuedPayment.processedAt = Date.now();
          
          console.error('ContractGateway: Error processing queued payment', queuedPayment.id, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueuedPayments(): QueuedPayment[] {
    return this.queuedPayments;
  }

  getQueuedPayment(id: string): QueuedPayment | undefined {
    return this.queuedPayments.find(p => p.id === id);
  }

  removeQueuedPayment(id: string): boolean {
    const index = this.queuedPayments.findIndex(p => p.id === id);
    if (index !== -1) {
      this.queuedPayments.splice(index, 1);
      return true;
    }
    return false;
  }

  clearCompletedPayments(): void {
    this.queuedPayments = this.queuedPayments.filter(p => 
      p.status === 'queued' || p.status === 'processing'
    );
  }

  getStatistics(): {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const stats = {
      total: this.queuedPayments.length,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    this.queuedPayments.forEach(payment => {
      switch (payment.status) {
        case 'queued':
          stats.queued++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const contractGateway = ContractGateway.getInstance();
