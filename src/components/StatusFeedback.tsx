// src/components/StatusFeedback.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useReceiptStore } from '../store/receiptStore';
import { useOfflineTxStore } from '../store/offlineTxStore';

export interface StatusFeedbackProps {
  driverId: string;
  showDetails?: boolean;
}

export default function StatusFeedback({ driverId, showDetails = false }: StatusFeedbackProps) {
  const [showModal, setShowModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  
  const { receipts } = useReceiptStore();
  const { isOnline, unsyncedCount } = useOfflineTxStore();

  // Get driver's latest receipt
  const driverReceipts = receipts.filter(receipt => receipt.driverId === driverId);
  const latestReceipt = driverReceipts.length > 0 ? driverReceipts[0] : null;

  // Get status counts
  const statusCounts = driverReceipts.reduce((acc, receipt) => {
    acc[receipt.status] = (acc[receipt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paidCount = statusCounts.paid || 0;
  const queuedCount = statusCounts.queued || 0;
  const failedCount = statusCounts.failed || 0;

  // Determine overall status
  const getOverallStatus = () => {
    if (queuedCount > 0) return 'queued';
    if (failedCount > 0) return 'failed';
    if (paidCount > 0) return 'paid';
    return 'none';
  };

  const overallStatus = getOverallStatus();

  // Pulse animation for queued status
  useEffect(() => {
    if (overallStatus === 'queued') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [overallStatus, pulseAnim]);

  // Slide animation for modal
  useEffect(() => {
    if (showModal) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showModal, slideAnim]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'queued': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✓';
      case 'queued': return '⏳';
      case 'failed': return '✗';
      default: return '?';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payment Successful';
      case 'queued': return 'Payment Queued';
      case 'failed': return 'Payment Failed';
      default: return 'No Recent Payments';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'paid': return 'Your payment has been processed successfully';
      case 'queued': return 'Your payment is waiting to be processed';
      case 'failed': return 'Your payment could not be processed';
      default: return 'No recent payment activity';
    }
  };

  if (overallStatus === 'none' && !showDetails) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.statusContainer, { borderColor: getStatusColor(overallStatus) }]}
        onPress={() => setShowModal(true)}
      >
        <Animated.View
          style={[
            styles.statusIndicator,
            { 
              backgroundColor: getStatusColor(overallStatus),
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <Text style={styles.statusIcon}>{getStatusIcon(overallStatus)}</Text>
        </Animated.View>
        
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(overallStatus) }]}>
            {getStatusText(overallStatus)}
          </Text>
          <Text style={styles.statusDescription}>
            {getStatusDescription(overallStatus)}
          </Text>
        </View>

        {queuedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{queuedCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Status Details Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
                opacity: slideAnim,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Status</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Connection Status */}
            <View style={styles.connectionStatus}>
              <View style={[styles.connectionDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.connectionText}>
                {isOnline ? 'Online' : 'Offline'} • {unsyncedCount} pending sync
              </Text>
            </View>

            {/* Status Summary */}
            <View style={styles.statusSummary}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{paidCount}</Text>
                <Text style={styles.summaryLabel}>Paid</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{queuedCount}</Text>
                <Text style={styles.summaryLabel}>Queued</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#F44336' }]}>{failedCount}</Text>
                <Text style={styles.summaryLabel}>Failed</Text>
              </View>
            </View>

            {/* Recent Receipts */}
            {driverReceipts.length > 0 && (
              <View style={styles.recentReceipts}>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                {driverReceipts.slice(0, 3).map((receipt) => (
                  <View key={receipt.id} style={styles.receiptItem}>
                    <View style={[styles.receiptStatus, { backgroundColor: getStatusColor(receipt.status) }]}>
                      <Text style={styles.receiptStatusIcon}>{getStatusIcon(receipt.status)}</Text>
                    </View>
                    <View style={styles.receiptInfo}>
                      <Text style={styles.receiptAmount}>₦{receipt.amount.toLocaleString()}</Text>
                      <Text style={styles.receiptDate}>
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.receiptStatusText, { color: getStatusColor(receipt.status) }]}>
                      {receipt.status.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#666',
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentReceipts: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  receiptStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptStatusIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  receiptStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
