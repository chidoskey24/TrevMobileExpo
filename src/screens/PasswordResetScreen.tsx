// src/screens/PasswordResetScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput as RNTextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';

/* ------------------------------------------------------------------ */
/* Email validation helper                                            */
/* ------------------------------------------------------------------ */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export default function PasswordResetScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = isValidEmail(email);
  const showEmailError = emailTouched && email.trim() !== '' && !emailValid;
  const canSubmit = emailValid;

  const handleSend = () => {
    if (!canSubmit) return;
    /* TODO: wire to backend → then maybe navigate back or show toast */
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Password Reset</Text>
      <Text style={styles.caption}>
        Enter the email associated with your account and we’ll send a reset link
        to you.
      </Text>

      <RNTextInput
        mode="flat"
        placeholder="Email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        autoFocus
        value={email}
        onChangeText={setEmail}
        onBlur={() => setEmailTouched(true)}
        textColor="#000"
        selectionColor="#000"
        underlineColor="transparent"         // hide inactive underline
        activeUnderlineColor="transparent"   // hide active underline
        style={[
          styles.input,
          showEmailError && styles.inputError,
        ]}
      />
      {showEmailError && (
        <Text style={styles.errorText}>Please enter a valid email address</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSend}
        disabled={!canSubmit}
        style={[
          styles.primaryBtn,
          !canSubmit && { opacity: 0.4 },
        ]}
        contentStyle={styles.btnContent}
        labelStyle={styles.primaryLabel}
      >
        Send Reset Link
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111',
  },
  caption: {
    fontSize: 14,
    color: '#4E4E4E',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000',
    marginBottom: 8,
    // borderWidth: 0 is fine, but Paper's flat mode already removes borders
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 32,
    backgroundColor: '#000000',
  },
  btnContent: {
    height: 56,
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
