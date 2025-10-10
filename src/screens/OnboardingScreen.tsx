// src/screens/OnboardingScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* top spacer – can be empty */}
      <View />

      {/* middle content */}
      <View style={styles.centerBlock}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.appName}>TrevMobile</Text>
        <Text style={styles.subtitle}>Your gateway to seamless blockchain payments</Text>
      </View>

      {/* bottom button */}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('SignIn')}
        style={styles.cta}
        labelStyle={styles.ctaText}
      >
        Get Started
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  centerBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '300',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
    maxWidth: 280,
  },
  cta: {
    alignSelf: 'stretch',   // makes the button fill the width
    borderRadius: 28,
    paddingVertical: 14,     // bump up for better tap area
    backgroundColor: '#000',
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFF',
  },
});
