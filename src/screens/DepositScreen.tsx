import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAccount } from 'wagmi';

// if desired, you can prefix with "ethereum:" to comply with EIP-681
function buildQrValue(address?: string) {
  if (!address) return '';
  return `ethereum:${address}`;
}

export default function DepositRequestScreen() {
  const { address, isConnecting } = useAccount();

  const qrValue = buildQrValue(address);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Receive POL</Text>
      {isConnecting && !address ? (
        <ActivityIndicator size="large" />
      ) : address ? (
        <QRCode value={qrValue} size={250} />
      ) : (
        <Text style={styles.noAddress}>Connect a wallet to generate QR</Text>
      )}
      <Text style={styles.instruction}>Scan with sender’s wallet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: { fontSize: 20, marginBottom: 20 },
  noAddress: { color: '#999', marginVertical: 16 },
  instruction: { marginTop: 20, color: '#666' },
});
