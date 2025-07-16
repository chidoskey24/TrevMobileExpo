// src/screens/SettingsScreen.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';             // for logout
import {
  useAppKit,
  useWalletInfo,
  useAppKitState,
} from '@reown/appkit-wagmi-react-native';

export default function SettingsScreen() {
  // AppKit hooks
  const { open, close }   = useAppKit();
  const { walletInfo }    = useWalletInfo();
  const { open: isModalOpen } = useAppKitState();

  // Zustand logout
  const resetUser = useAppStore((s) => s.resetUser);

  // Derived flags
  const account = walletInfo?.address as string | undefined;
  const connected = Boolean(account);

  // Handlers
  const handleWalletPress = () => {
    connected ? close() : open();
  };

  const handleLogout = () => {
    resetUser();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Account</Text>

      {/* Profile row */}
      <TouchableOpacity style={styles.row}>
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
            {connected ? 'Disconnect wallet' : 'Link wallet'}
          </Text>
          <Text style={styles.rowSub}>
            {connected
              ? `${account!.slice(0, 6)}…${account!.slice(-4)}`
              : 'MetaMask, Rainbow …'}
          </Text>
        </View>
        {isModalOpen && <ActivityIndicator />}
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
  header:    { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  rowSub:   { fontSize: 12, color: '#666' },

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
