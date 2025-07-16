// src/navigation/BottomTabs.tsx
import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from './RootNavigator';

import DashboardScreen from '../screens/DashboardScreen';
import Dummy           from '../screens/Placeholder';      // only for hiding the Scan tab button
import SettingsScreen  from '../screens/SettingsScreen';
import ScanScreen      from '../screens/ScanScreen';       // you can swap out Dummy for this if you want

const Tab = createBottomTabNavigator<RootStackParamList>();

export default function BottomTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#000',
          tabBarStyle: { height: 72, paddingBottom: 8 },
        }}
      >
        {/* Dashboard (formerly “Home”) */}
        <Tab.Screen
          name="Dashboard"                          // ← matches your RootStackParamList
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={require('../../assets/icons/home.png')}
                style={[styles.icon, { tintColor: color }]}
              />
            ),
          }}
        />

        {/* Scan (hidden, we still navigate to it via the FAB) */}
        <Tab.Screen
          name="Scan"
          component={Dummy}                         // or Swap in ScanScreen if you want
          options={{ tabBarButton: () => null }}
        />

        {/* Settings */}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={require('../../assets/icons/settings.png')}
                style={[styles.icon, { tintColor: color }]}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating “Scan” FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.fab}
        onPress={() => navigation.navigate('Scan')}
      >
        <Image
          source={require('../../assets/icons/scan.png')}
          style={styles.fabIcon}
        />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  fabIcon: {
    width: 40,
    height: 40,
    tintColor: '#000',
  },
});
