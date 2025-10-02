// src/screens/SettingsScreen.tsx

import * as React from 'react';
import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';             // for logout
import { useOfflineTxStore } from '../store/offlineTxStore';
import { testOfflineSystem, cleanupTestData } from '../lib/testOfflineSystem';
import { apiServer } from '../lib/apiServer';
import {
  useAppKit,
  useAppKitState,
} from '@reown/appkit-wagmi-react-native';
import { useAccount } from 'wagmi';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function SettingsScreen() {
  const [isTesting, setIsTesting] = useState(false);
  const [isStartingServer, setIsStartingServer] = useState(false);
  
  // AppKit hooks
  const { open, close }   = useAppKit();
  const { open: isModalOpen } = useAppKitState();
  const { address } = useAccount();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Zustand logout
  const resetUser = useAppStore((s) => s.resetUser);
  
  // Offline store
  const { unsyncedCount, syncPendingTransactions } = useOfflineTxStore();

  // Derived flags
  const connected = Boolean(address);

  // Handlers
  const handleWalletPress = () => {
    open(); // always open modal; inside modal user can disconnect if desired
  };

  const handleLogout = () => {
    resetUser();
  };

  const handleTestOfflineSystem = async () => {
    setIsTesting(true);
    try {
      const result = await testOfflineSystem();
      Alert.alert(
        result.success ? 'Test Passed' : 'Test Failed',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run test: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCleanupTestData = async () => {
    try {
      await cleanupTestData();
      Alert.alert('Cleanup Complete', 'Test data has been removed');
    } catch (error) {
      Alert.alert('Cleanup Error', `Failed to cleanup: ${error}`);
    }
  };

  const handleStartApiServer = async () => {
    setIsStartingServer(true);
    try {
      await apiServer.start();
      Alert.alert('API Server Started', 'Admin dashboard can now connect to the mobile app');
    } catch (error) {
      Alert.alert('Server Error', `Failed to start API server: ${error}`);
    } finally {
      setIsStartingServer(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Account</Text>

      {/* Profile row */}
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Profile')}>
        <IconButton icon="account" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Profile</Text>
          <Text style={styles.rowSub}>Add your name & email</Text>
        </View>
      </TouchableOpacity>

      {/* Wallet row */}
      <TouchableOpacity style={styles.row} onPress={handleWalletPress}>
        <IconButton icon="qrcode-scan" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>
            {connected ? 'Wallet connected' : 'Link wallet'}
          </Text>
          <Text style={styles.rowSub}>
            {connected ? `${address!.slice(0, 6)}…${address!.slice(-4)}` : 'MetaMask, Rainbow …'}
          </Text>
        </View>
        {isModalOpen && <ActivityIndicator />}
      </TouchableOpacity>

      {/* Sync Status row */}
      <View style={styles.row}>
        <IconButton icon="sync" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Sync Status</Text>
          <Text style={styles.rowSub}>
            {unsyncedCount > 0 ? `${unsyncedCount} pending sync` : 'All synced'}
          </Text>
        </View>
        {unsyncedCount > 0 && (
          <TouchableOpacity onPress={syncPendingTransactions}>
            <Text style={styles.syncButton}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Test Offline System row */}
      <TouchableOpacity style={styles.row} onPress={handleTestOfflineSystem}>
        <IconButton icon="test-tube" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Test Offline System</Text>
          <Text style={styles.rowSub}>Run offline functionality tests</Text>
        </View>
        {isTesting && <ActivityIndicator />}
      </TouchableOpacity>

      {/* Cleanup Test Data row */}
      <TouchableOpacity style={styles.row} onPress={handleCleanupTestData}>
        <IconButton icon="delete" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Cleanup Test Data</Text>
          <Text style={styles.rowSub}>Remove test transactions</Text>
        </View>
      </TouchableOpacity>

      {/* Receipts row */}
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Receipts')}>
        <IconButton icon="receipt" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Receipts</Text>
          <Text style={styles.rowSub}>View payment receipts and history</Text>
        </View>
      </TouchableOpacity>

      {/* API Server row */}
      <TouchableOpacity style={styles.row} onPress={handleStartApiServer}>
        <IconButton icon="server" size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Start API Server</Text>
          <Text style={styles.rowSub}>Enable admin dashboard connection</Text>
        </View>
        {isStartingServer && <ActivityIndicator />}
      </TouchableOpacity>

      {/* Log-out button */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutLabel}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 70 },
  header:    { fontSize: 20, fontWeight: '700', marginBottom: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  rowSub:   { fontSize: 12, color: '#666' },

  syncButton: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logout: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: '#d33',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 25,
  },
  logoutLabel: { color: '#d33', fontWeight: '700', fontSize: 15 },
});
