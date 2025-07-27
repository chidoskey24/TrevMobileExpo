// src/screens/ScanScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Easing } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import DepositContractAbi from '../../abi/DepositContract.json';
import { useWriteContract } from 'wagmi';
import { formatEther } from 'viem';
import { useTxStore } from '../store/txStore';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Scan'>;

export default function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<{
    contract: string;
    recipient: string;
    amt: bigint;
  } | null>(null);

  // 1️⃣ Ask for camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // 2️⃣ Animated value for laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // 3️⃣ Start laser line animation once at mount
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [scanLineAnim]);

  // 4️⃣ Get the writeContract function from wagmi
  const { writeContractAsync } = useWriteContract();
  const addTx = useTxStore(s=>s.addTx);

  // 3️⃣ Effect to send transaction when scanData changes
  useEffect(() => {
    if (scanData && writeContractAsync) {
      (async () => {
        try {
          setScanned(true);
          const txHash = await writeContractAsync({
            address: scanData.contract as `0x${string}`,
            abi: DepositContractAbi.abi,
            functionName: 'deposit',
            args: [scanData.recipient, scanData.amt],
            value: scanData.amt,
            chainId: 80002,
          });
          // Save tx locally for dashboard list
          const amountEth = Number(formatEther(scanData.amt));
          // fetch POL price in NGN
          let naira = amountEth;
          try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
            const priceJson = await res.json();
            const polPrice = priceJson['matic-network']?.ngn ?? 0;
            naira = amountEth * polPrice;
          } catch {}
          addTx({
            id: txHash as string,
            type: 'withdraw',
            title: 'Paid',
            subtitle: `${amountEth.toFixed(2)} POL`,
            amount: -naira,
            currency: '₦',
          });

          Alert.alert('Transaction sent', typeof txHash === 'string' ? txHash : JSON.stringify(txHash));
          navigation.navigate('Dashboard');
        } catch (err: any) {
          Alert.alert('Transaction error', err?.message || 'Unknown error');
          navigation.navigate('Dashboard');
        } finally {
          setScanned(false);
          setScanData(null);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanData]);

  // 5️⃣ Interpolated translateY for laser line (within 250px frame)
  const lineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 248], // frame height (250) - laser height (2)
  });

  // 6️⃣ Handler fires when any code (1D, QR, etc.) is scanned
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    try {
      const url = new URL(data);
      const contract = url.searchParams.get('contract');
      const fnSig = url.searchParams.get('fn'); // must be deposit(address,uint256)
      const recipient = url.searchParams.get('to');
      const amtStr = url.searchParams.get('amt');
      if (!contract || !fnSig || !recipient || !amtStr) throw new Error('Missing params');
      if (fnSig !== 'deposit(address,uint256)') throw new Error('Invalid function');
      const amt = BigInt(amtStr);
      setScanData({ contract, recipient, amt });
    } catch (err) {
      console.error(err);
      Alert.alert('Scan error', 'Could not parse QR code');
    }
  };

  // 7️⃣ Render loading / error states
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera.</Text>
      </View>
    );
  }

  // 8️⃣ Render the camera preview full-screen with overlay
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
      />
      {/* Overlay with scanning frame */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <Animated.View style={[styles.laserLine, { transform: [{ translateY: lineTranslateY }] }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'red',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
