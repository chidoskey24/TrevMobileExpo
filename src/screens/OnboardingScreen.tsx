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
        <Text style={styles.welcome}>👋 Welcome to TrevMobile</Text>
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
  },
  welcome: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#111',
    textAlign: 'center',
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
