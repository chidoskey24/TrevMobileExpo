// src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAppStore } from '../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const setUser    = useAppStore(s => s.setUser);

  // local form state
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');

  const allFilled = 
    name.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    password.trim() !== '';

  const handleCreate = () => {
    // TODO: actually call your backend...
    setUser({
      id:    '1',
      name:  name.trim(),
      email: email.trim(),
    });
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <RNTextInput
        placeholder="Name"
        placeholderTextColor="#666"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <RNTextInput
        placeholder="Email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <RNTextInput
        placeholder="Phone"
        placeholderTextColor="#666"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />
      <RNTextInput
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        mode="contained"
        contentStyle={{ height: 50 }}
        style={[
          styles.primaryBtn,
          !allFilled && { opacity: 0.5 },
        ]}
        labelStyle={styles.primaryLabel}
        onPress={handleCreate}
        disabled={!allFilled}
      >
        Create Account
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 15,
    color: '#000',
  },
  primaryBtn: {
    borderRadius: 28,
    backgroundColor: '#000',
    marginTop: 8,
  },
  primaryLabel: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    color: '#fff',
  },
});
