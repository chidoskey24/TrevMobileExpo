// src/screens/SettingsScreen.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';             // for logout
import {
  useAppKit,
  useAppKitState,
} from '@reown/appkit-wagmi-react-native';
import { useAccount } from 'wagmi';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function SettingsScreen() {
  // AppKit hooks
  const { open, close }   = useAppKit();
  const { open: isModalOpen } = useAppKitState();
  const { address } = useAccount();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Zustand logout
  const resetUser = useAppStore((s) => s.resetUser);

  // Derived flags
  const connected = Boolean(address);

  // Handlers
  const handleWalletPress = () => {
    open(); // always open modal; inside modal user can disconnect if desired
  };

  const handleLogout = () => {
    resetUser();
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
