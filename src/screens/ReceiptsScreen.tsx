// src/screens/ReceiptsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useReceiptStore } from '../store/receiptStore';
import { receiptService } from '../lib/receiptService';
import { ReceiptRecord } from '../lib/database';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Receipts'>;

export default function ReceiptsScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'queued' | 'failed'>('all');
  
  const { receipts, isLoading, refreshReceipts } = useReceiptStore();

  useEffect(() => {
    refreshReceipts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshReceipts();
    setRefreshing(false);
  };

  const getStatusColor = (status: ReceiptRecord['status']) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'queued': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: ReceiptRecord['status']) => {
    switch (status) {
      case 'paid': return '✓';
      case 'queued': return '⏳';
      case 'failed': return '✗';
      default: return '?';
    }
  };

  const filteredReceipts = receipts.filter(receipt => 
    selectedStatus === 'all' || receipt.status === selectedStatus
  );

  const handleViewReceipt = async (receipt: ReceiptRecord) => {
    try {
      const pdfContent = await receiptService.generateReceiptPDF(receipt.id);
      Alert.alert(
        'Receipt Details',
        `Receipt ID: ${receipt.id}\nDriver: ${receipt.driverName}\nAmount: ${receipt.amount} ${receipt.currency}\nStatus: ${receipt.status}\n\n${pdfContent}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load receipt details');
    }
  };

  const handleDeleteReceipt = (receiptId: string) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const receiptStore = useReceiptStore.getState();
              await receiptStore.deleteReceipt(receiptId);
              Alert.alert('Success', 'Receipt deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          }
        }
      ]
    );
  };

  const getStatistics = () => {
    const total = receipts.length;
    const paid = receipts.filter(r => r.status === 'paid').length;
    const queued = receipts.filter(r => r.status === 'queued').length;
    const failed = receipts.filter(r => r.status === 'failed').length;
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
    
    return { total, paid, queued, failed, totalAmount };
  };

  const { total, paid, queued, failed, totalAmount } = getStatistics();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <Text style={styles.subtitle}>Payment receipts and history</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>{queued}</Text>
            <Text style={styles.statLabel}>Queued</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>{failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
        <View style={styles.totalAmount}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₦{totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'paid', 'queued', 'failed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedStatus === status && styles.filterButtonTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Receipts List */}
      <ScrollView
        style={styles.receiptsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredReceipts.map((receipt) => (
          <View key={receipt.id} style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptId}>#{receipt.id.slice(-8)}</Text>
                <Text style={styles.driverName}>{receipt.driverName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) }]}>
                <Text style={styles.statusIcon}>{getStatusIcon(receipt.status)}</Text>
                <Text style={styles.statusText}>{receipt.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.receiptDetails}>
              <Text style={styles.amount}>₦{receipt.amount.toLocaleString()}</Text>
              <Text style={styles.paymentMethod}>{receipt.paymentMethod}</Text>
              <Text style={styles.date}>
                {new Date(receipt.createdAt).toLocaleDateString()} at{' '}
                {new Date(receipt.createdAt).toLocaleTimeString()}
              </Text>
            </View>

            {receipt.transactionHash && (
              <View style={styles.transactionHash}>
                <Text style={styles.hashLabel}>Transaction:</Text>
                <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                  {receipt.transactionHash}
                </Text>
              </View>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => handleViewReceipt(receipt)}
              >
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteReceipt(receipt.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredReceipts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No receipts found</Text>
            <Text style={styles.emptySubtext}>
              {selectedStatus === 'all' 
                ? 'No receipts have been created yet'
                : `No ${selectedStatus} receipts found`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  totalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  receiptsList: {
    flex: 1,
    padding: 16,
  },
  receiptCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
    color: 'white',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  receiptDetails: {
    marginBottom: 12,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionHash: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  hashLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  hashValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
