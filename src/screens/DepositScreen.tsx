import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAccount } from 'wagmi';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useTxStore } from '../store/txStore';

// if desired, you can prefix with "ethereum:" to comply with EIP-681
function buildQrValue(address?: string) {
  if (!address) return '';
  return `ethereum:${address}`;
}

export default function DepositRequestScreen() {
  const { address, isConnecting } = useAccount();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addTx = useTxStore(s => s.addTx);

  const qrValue = buildQrValue(address);

  /* ─── simulate incoming deposit ─── */
  useEffect(() => {
    if (!address) return;

    // random delay between 5–10 seconds
    const delayMs = 5000 + Math.random() * 5000;
    const timer = setTimeout(async () => {
      const polAmt = Number((Math.random() * (0.5 - 0.01) + 0.01).toFixed(4));

      // fetch price for NGN conversion
      let naira = polAmt;
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
        const priceJson = await res.json();
        const polPrice = priceJson['matic-network']?.ngn ?? 0;
        naira = polAmt * polPrice;
      } catch {}

      addTx({
        id: Date.now().toString(),
        type: 'deposit',
        title: 'Deposit',
        subtitle: `${polAmt.toFixed(4)} POL`,
        amount: naira,
        currency: '₦',
      });

      Alert.alert('Deposit received', `${polAmt.toFixed(4)} POL`);
      navigation.goBack();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [address]);

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
