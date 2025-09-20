// src/components/SyncStatus.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOfflineTxStore } from '../store/offlineTxStore';

interface SyncStatusProps {
  showDetails?: boolean;
}

export default function SyncStatus({ showDetails = false }: SyncStatusProps) {
  const { 
    isOnline, 
    unsyncedCount, 
    isLoading, 
    syncPendingTransactions 
  } = useOfflineTxStore();

  const handleManualSync = async () => {
    if (isOnline && unsyncedCount > 0) {
      await syncPendingTransactions();
    }
  };

  if (!showDetails && unsyncedCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusIndicator}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }
            ]} 
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {unsyncedCount > 0 && (
          <View style={styles.syncInfo}>
            <Text style={styles.syncText}>
              {unsyncedCount} pending sync
            </Text>
            {isOnline && (
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={handleManualSync}
                disabled={isLoading}
              >
                <Text style={styles.syncButtonText}>
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>
            Offline-first: Transactions are saved locally and synced when online
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
});
