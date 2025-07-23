import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const CONTRACT_URI = 
  'ethereum:0x4a4258641b0f1c456CFEE6a16d04678d4e993AC7@80002/deposit()';

export default function DepositRequestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scan to Deposit</Text>
      <QRCode
        value={CONTRACT_URI}
        size={250}
      />
      <Text style={styles.instruction}>
        Point your wallet’s QR scanner here
      </Text>
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
  instruction: { marginTop: 20, color: '#666' },
});
