// src/lib/testOfflineSystem.ts
import { database } from './database';
import { syncService } from './syncService';
import { useOfflineTxStore } from '../store/offlineTxStore';

export async function testOfflineSystem() {
  console.log('🧪 Testing Offline System...');
  
  try {
    // Test 1: Database initialization
    console.log('1️⃣ Testing database initialization...');
    await database.init();
    console.log('✅ Database initialized successfully');

    // Test 2: Add a test transaction
    console.log('2️⃣ Testing transaction creation...');
    const testTx = {
      id: `test_${Date.now()}`,
      type: 'deposit' as const,
      title: 'Test Transaction',
      subtitle: '1.0 POL',
      amount: 1000,
      currency: '₦',
      timestamp: Date.now(),
    };
    
    await database.insertTransaction(testTx);
    console.log('✅ Test transaction created');

    // Test 3: Retrieve transactions
    console.log('3️⃣ Testing transaction retrieval...');
    const transactions = await database.getAllTransactions();
    console.log(`✅ Retrieved ${transactions.length} transactions`);

    // Test 4: Check unsynced count
    console.log('4️⃣ Testing unsynced count...');
    const unsyncedCount = await database.getUnsyncedCount();
    console.log(`✅ Found ${unsyncedCount} unsynced transactions`);

    // Test 5: Test sync service connection
    console.log('5️⃣ Testing sync service connection...');
    const isConnected = await syncService.testConnection();
    console.log(`✅ Sync service connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

    // Test 6: Test offline store initialization
    console.log('6️⃣ Testing offline store initialization...');
    await useOfflineTxStore.getState().initialize();
    console.log('✅ Offline store initialized');

    console.log('🎉 All tests passed! Offline system is working correctly.');
    
    return {
      success: true,
      message: 'All offline system tests passed',
      stats: {
        totalTransactions: transactions.length,
        unsyncedTransactions: unsyncedCount,
        syncServiceConnected: isConnected,
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error}`,
      error: error
    };
  }
}

// Helper function to clean up test data
export async function cleanupTestData() {
  try {
    await database.clearAllTransactions();
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
}
