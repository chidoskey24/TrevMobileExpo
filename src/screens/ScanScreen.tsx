// src/screens/ScanScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Easing, TouchableOpacity, Modal } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/RootNavigator';
import DepositContractAbi from '../../abi/DepositContract.json';
import { useWriteContract } from 'wagmi';
import { formatEther } from 'viem';
import { useTxStore } from '../store/txStore';
import { parseEther } from 'viem';
import { useWalletClient, usePublicClient } from 'wagmi';
import { polygonAmoy } from 'viem/chains';
import { receiptService } from '../lib/receiptService';
import { useAppStore } from '../store/useAppStore';
import StatusFeedback from '../components/StatusFeedback';
import { useOfflineTxStore } from '../store/offlineTxStore';
import { contractGateway } from '../lib/contractGateway';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Scan'>;

export default function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
  const user = useAppStore(s => s.user);
  const { isOnline } = useOfflineTxStore();

  // clients from wagmi (must be at top level, not inside useEffect)
  const publicClient = usePublicClient({ chainId: polygonAmoy.id });
  const { data: walletClient } = useWalletClient({ chainId: polygonAmoy.id });

  // 3️⃣ Effect to show confirmation when scanData changes
  useEffect(() => {
    if (scanData) {
      setScanned(true);
      setShowConfirmation(true);
    }
  }, [scanData]);

  // 4️⃣ Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!scanData) return;
    
    setIsProcessing(true);
    try {
      // Check if device is online
      if (!isOnline) {
        // Queue payment for offline processing
        await handleOfflinePayment();
        return;
      }

      // Use contract gateway to submit payment
      const paymentRequest = {
        contractAddress: scanData.contract,
        recipientAddress: scanData.recipient,
        amount: scanData.amt,
        driverId: user?.id || 'unknown',
        driverName: user?.name || 'Unknown Driver',
        paymentMethod: 'Blockchain (POL)',
        tripDetails: {
          from: 'Scan Location',
          to: 'Payment Destination',
        },
      };

      const result = await contractGateway.submitPayment(paymentRequest, publicClient, walletClient);
      
      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Save tx locally for dashboard list
      const amountEth = Number(formatEther(scanData.amt));
      let naira = amountEth;
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
        const priceJson = await res.json();
        const polPrice = priceJson['matic-network']?.ngn ?? 0;
        naira = amountEth * polPrice;
      } catch {}
      
      await addTx({
        id: result.transactionHash!,
        type: 'withdraw',
        title: 'Paid',
        subtitle: `${amountEth.toFixed(4)} POL`,
        amount: -naira,
        currency: '₦',
      });

      // Show success message with status feedback
      Alert.alert(
        'Payment Successful', 
        `Transaction sent: ${result.transactionHash}\n\nYour payment has been processed and a receipt has been generated.`,
        [
          {
            text: 'View Status',
            onPress: () => {
              // Navigate to dashboard to show status feedback
              navigation.navigate('Tabs');
            }
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('Tabs')
          }
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Payment Failed', (err as any)?.shortMessage ?? 'Unknown error');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
      setScanned(false);
      setScanData(null);
    }
  };

  // 5️⃣ Handle offline payment queuing
  const handleOfflinePayment = async () => {
    if (!scanData) return;

    try {
      const amountEth = Number(formatEther(scanData.amt));
      let naira = amountEth;
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn');
        const priceJson = await res.json();
        const polPrice = priceJson['matic-network']?.ngn ?? 0;
        naira = amountEth * polPrice;
      } catch {}

      // Use contract gateway to queue payment
      const paymentRequest = {
        contractAddress: scanData.contract,
        recipientAddress: scanData.recipient,
        amount: scanData.amt,
        driverId: user?.id || 'unknown',
        driverName: user?.name || 'Unknown Driver',
        paymentMethod: 'Blockchain (POL) - Offline',
        tripDetails: {
          from: 'Scan Location',
          to: 'Payment Destination',
        },
      };

      const queuedPaymentId = await contractGateway.queuePayment(paymentRequest);
      
      // Add to transaction store (offline)
      await addTx({
        id: queuedPaymentId,
        type: 'withdraw',
        title: 'Queued Payment',
        subtitle: `${amountEth.toFixed(4)} POL`,
        amount: -naira,
        currency: '₦',
      });

      Alert.alert(
        'Payment Queued',
        `Your payment of ₦${naira.toFixed(2)} has been queued for processing when you come back online.\n\nPayment ID: ${queuedPaymentId.slice(-8)}`,
        [
          {
            text: 'View Status',
            onPress: () => navigation.navigate('Tabs')
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('Tabs')
          }
        ]
      );
    } catch (error) {
      console.error('Failed to queue offline payment:', error);
      Alert.alert('Error', 'Failed to queue payment for offline processing');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
      setScanned(false);
      setScanData(null);
    }
  };

  // 6️⃣ Handle payment cancellation
  const handleCancelPayment = () => {
    setShowConfirmation(false);
    setScanned(false);
    setScanData(null);
  };

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

      <View style={styles.header}>
        <Text style={styles.headerText}>Scan QR code</Text>
      </View>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelPayment}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            
            {scanData && (
              <View style={styles.paymentDetails}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {Number(formatEther(scanData.amt)).toFixed(4)} POL
                </Text>
                
                <Text style={styles.detailLabel}>Recipient:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                  {scanData.recipient}
                </Text>
                
                <Text style={styles.detailLabel}>Contract:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                  {scanData.contract}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelPayment}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmPayment}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  paymentDetails: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

function toWeiString(decimalStr: string): string {
  // parseEther returns a bigint; convert to string for the URL
  return parseEther(decimalStr).toString();
}
