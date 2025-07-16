// src/navigation/RootNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

import OnboardingScreen   from '../screens/OnboardingScreen';
import SignInScreen       from '../screens/SignInScreen';
import SignUpScreen       from '../screens/SignUpScreen';
import PasswordResetScreen from '../screens/PasswordResetScreen';
import BottomTabs         from './BottomTabs';
import ScanScreen         from '../screens/ScanScreen';
import ResultScreen       from '../screens/ResultScreen';
import SettingsScreen     from '../screens/SettingsScreen';

/* ---------------- auth flow params ---------------- */
export type AuthStackParamList = {
  Onboarding    : undefined;
  SignIn        : undefined;
  SignUp        : undefined;
  PasswordReset : undefined;
};

/* ---------------- app flow params ---------------- */
export type AppStackParamList = {
  Dashboard : undefined;
  Scan      : undefined;
  Result    : { data: string };
  Settings  : undefined;
};

/* merge for typing */
export type RootStackParamList = AuthStackParamList & AppStackParamList;

/* ─── stack creators ───────────────────────────────── */
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack  = createNativeStackNavigator<AppStackParamList>();

/* ─── Auth navigator ────────────────────────────────── */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Onboarding"    component={OnboardingScreen} />
      <AuthStack.Screen name="SignIn"        component={SignInScreen} />
      <AuthStack.Screen name="SignUp"        component={SignUpScreen} />
      <AuthStack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </AuthStack.Navigator>
  );
}

/* ─── App navigator ─────────────────────────────────── */
function AppNavigator() {
  return (
    <AppStack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
      <AppStack.Screen name="Dashboard" component={BottomTabs} />
      <AppStack.Screen name="Scan"      component={ScanScreen}    />
      <AppStack.Screen name="Result"    component={ResultScreen}  />
      <AppStack.Screen name="Settings"  component={SettingsScreen}/>
    </AppStack.Navigator>
  );
}

/* ─── Root navigator ────────────────────────────────── */
export default function RootNavigator() {
  const hydrated = useAppStore((s) => s._hasHydrated);
  const user     = useAppStore((s) => s.user);

  if (!hydrated) {
    // give MMKV/Zustand a moment to rehydrate
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // once hydrated, choose the correct flow
  return user ? <AppNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
