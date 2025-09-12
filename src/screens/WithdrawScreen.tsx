// src/screens/WithdrawScreen.tsx
import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { TextInput, Button, Snackbar, Text } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTxStore } from '../store/txStore'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Withdraw'>

export default function WithdrawScreen() {
  const navigation = useNavigation<NavProp>()
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const addTx = useTxStore(s => s.addTx)

  const handleConfirm = async () => {
    const polAmount = parseFloat(amount)
    if (!address.trim() || !polAmount || polAmount <= 0) return

    // simulate network delay + price fetch
    let ngnValue = polAmount
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn')
      const priceJson = await res.json()
      const polPrice = priceJson['matic-network']?.ngn ?? 0
      ngnValue = polAmount * polPrice
    } catch {}

    // append tx to global store
    addTx({
      id: Date.now().toString(),
      type: 'withdraw',
      title: 'Withdrawal',
      subtitle: `${polAmount.toFixed(4)} POL`,
      amount: -ngnValue,
      currency: '₦',
    })

    setSnackbarVisible(true)
    setTimeout(() => {
      setSnackbarVisible(false)
      navigation.goBack()
    }, 1200)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={styles.heading}>Withdraw Funds</Text>

      <TextInput
        mode="flat"
        label="Recipient Wallet Address"
        placeholder="0x..."
        placeholderTextColor="#666"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        textColor="#000"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        mode="flat"
        label="Amount"
        placeholder="100.00"
        placeholderTextColor="#666"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        textColor="#000"
        keyboardType="numeric"
      />

      <Button
        mode="contained"
        onPress={handleConfirm}
        disabled={!address.trim() || !amount.trim()}
        contentStyle={styles.btnContent}
        style={styles.primaryBtn}
        labelStyle={styles.primaryLabel}
      >
        Confirm
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        style={styles.snackbar}
      >
        Withdrawal requested
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F3F3',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 28,
    backgroundColor: '#000',
    marginTop: 8,
  },
  btnContent: {
    height: 50,
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: '#000',
  },
})
