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
  Modal,
  Dimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useReceiptStore } from '../store/receiptStore';
import { receiptService } from '../lib/receiptService';
import { ReceiptRecord } from '../lib/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Receipts'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'Receipts'>;

const { width: screenWidth } = Dimensions.get('window');

export default function ReceiptsScreen({ route }: Props) {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'queued' | 'failed'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const viewShotRef = React.useRef<ViewShot>(null);
  
  const { receipts, isLoading, refreshReceipts } = useReceiptStore();

  useEffect(() => {
    refreshReceipts();
  }, []);
  
  // Handle opening receipt from navigation params
  useEffect(() => {
    if (route.params?.receiptId) {
      const receipt = receipts.find(r => r.id === route.params.receiptId);
      if (receipt) {
        handleViewReceipt(receipt);
      }
    }
  }, [route.params?.receiptId, receipts]);

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

  const handleViewReceipt = (receipt: ReceiptRecord) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const handleShareReceipt = async () => {
    if (!selectedReceipt || !viewShotRef.current) return;

    try {
      const ref = viewShotRef.current;
      if (!ref) return;
      const uri = await (ref as any).capture();
      if (!uri) return;
      
      console.log('Captured image URI:', uri);
      
      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      // Share the image using expo-sharing
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Receipt #${selectedReceipt.id.slice(-8)} - ₦${selectedReceipt.amount.toLocaleString()}`,
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedReceipt(null);
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

      {/* Full-Screen Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeReceiptModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedReceipt && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeReceiptModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Receipt Details</Text>
                <TouchableOpacity onPress={handleShareReceipt} style={styles.shareButton}>
                  <Text style={styles.shareButtonText}>📤</Text>
                </TouchableOpacity>
              </View>

              {/* Receipt Content */}
              <ScrollView style={styles.modalContent}>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                  <View style={styles.receiptContainer}>
                    {/* Receipt Header */}
                    <View style={styles.receiptHeaderSection}>
                      <Text style={styles.receiptTitle}>TrevMobile</Text>
                      <Text style={styles.receiptSubtitle}>Payment Receipt</Text>
                    </View>

                    {/* Receipt Content */}
                    <View style={styles.receiptContentSection}>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Receipt ID:</Text>
                        <Text style={styles.receiptValue}>#{selectedReceipt.id.slice(-8)}</Text>
                      </View>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Date:</Text>
                        <Text style={styles.receiptValue}>
                          {new Date(selectedReceipt.createdAt).toLocaleDateString()} at{' '}
                          {new Date(selectedReceipt.createdAt).toLocaleTimeString()}
                        </Text>
                      </View>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Driver:</Text>
                        <Text style={styles.receiptValue}>{selectedReceipt.driverName}</Text>
                      </View>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Amount:</Text>
                        <Text style={[styles.receiptValue, styles.amountValue]}>
                          ₦{selectedReceipt.amount.toLocaleString()}
                        </Text>
                      </View>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Payment Method:</Text>
                        <Text style={styles.receiptValue}>{selectedReceipt.paymentMethod}</Text>
                      </View>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReceipt.status) }]}>
                          <Text style={styles.statusIcon}>{getStatusIcon(selectedReceipt.status)}</Text>
                          <Text style={styles.statusText}>{selectedReceipt.status.toUpperCase()}</Text>
                        </View>
                      </View>

                      {selectedReceipt.transactionHash && (
                        <View style={[styles.receiptRow, { marginBottom: -130 }]}>
                          <Text style={styles.receiptLabel}>Transaction Hash:</Text>
                          <Text style={styles.hashValue}>{selectedReceipt.transactionHash}</Text>
                        </View>
                      )}

                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Trip Details:</Text>
                        <Text style={styles.receiptValue}>From: Scan Location{'\n'}To: Payment Destination</Text>
                      </View>
                    </View>

                    {/* Receipt Footer */}
                    <View style={styles.receiptFooter}>
                      <Text style={styles.thankYouText}>Thank you for using TrevMobile!</Text>
                    </View>
                  </View>
                </ViewShot>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  receiptContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  receiptHeaderSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  receiptTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  receiptSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  receiptContentSection: {
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16 ,
    paddingVertical: 4,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontStyle: 'italic',
  },
});
