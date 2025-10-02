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
import DepositScreen      from '../screens/DepositScreen';
import WithdrawScreen     from '../screens/WithdrawScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';

/* ---------------- auth flow params ---------------- */
export type AuthStackParamList = {
  Onboarding    : undefined;
  SignIn        : undefined;
  SignUp        : undefined;
  PasswordReset : undefined;
};

/* ---------------- app flow params ---------------- */
export type AppStackParamList = {
  Tabs      : undefined;   // hosts the bottom tab navigator
  Scan      : undefined;
  Result    : { data: string };
  Settings  : undefined;
  Deposit   : undefined;
  Withdraw  : undefined;
  Notifications: undefined;
  Profile   : undefined;
  Transactions: undefined;
  Receipts: undefined;
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
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      {/* Avoid duplicating a route name that also exists inside the tab navigator */}
      <AppStack.Screen name="Tabs" component={BottomTabs} />
      <AppStack.Screen name="Scan"      component={ScanScreen}    />
      <AppStack.Screen name="Result"    component={ResultScreen}  />
      <AppStack.Screen name="Settings"  component={SettingsScreen}/>
      <AppStack.Screen name="Deposit"   component={DepositScreen}  />
      <AppStack.Screen name="Withdraw"  component={WithdrawScreen} />
      <AppStack.Screen name="Notifications" component={NotificationsScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="Transactions" component={TransactionsScreen} />
      <AppStack.Screen name="Receipts" component={ReceiptsScreen} />
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
