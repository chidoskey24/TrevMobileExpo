// src/screens/DepositScreen.tsx
import React, { useState } from 'react'
import { View, StyleSheet, Image, Pressable } from 'react-native'
import { Text, Snackbar } from 'react-native-paper'
import * as Clipboard from 'expo-clipboard'

export default function DepositScreen() {
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  // replace this with your real address or pass it in
  const walletAddress = '0xabd0b6BFe7Fb5c7310288dF0aD2d71356cf007ff'  

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(walletAddress)
    setSnackbarVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* replace with your QR image */}
      <Image
        source={require('../../assets/qr-code.png')}
        style={styles.qr}
        resizeMode="contain"
      />

      <Pressable onPress={copyToClipboard}>
        <Text style={styles.address}>{walletAddress}</Text>
      </Pressable>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
      >
        Copied to clipboard!
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF',
  },
  qr: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  address: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
