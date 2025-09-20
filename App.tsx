// App.tsx
import 'react-native-gesture-handler';            // 🦶 react-navigation requirement
import 'react-native-url-polyfill/auto';          // 🌐 URL polyfill for AppKit
import './src/store/crypto-polyfill';             // 🏝️ expo-crypto getRandomValues shim
import '@walletconnect/react-native-compat';      // 🔌 WalletConnect compat layer

import { Buffer } from 'buffer';
import process from 'process';
global.Buffer = Buffer;
global.process = process;

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { LogBox } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { WagmiProvider } from 'wagmi';
import { polygonAmoy } from '@wagmi/core/chains';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createAppKit,
  defaultWagmiConfig,
  AppKit,
} from '@reown/appkit-wagmi-react-native';

import RootNavigator from './src/navigation/RootNavigator';
import OfflineInitializer from './src/components/OfflineInitializer';

// ───────── AppKit setup ─────────

// Suppress WalletConnect warnings during dev reloads
LogBox.ignoreLogs([
  'emitting session_request',
  'Restore will override',
  'subscription:',
  'WalletConnect',
]);

const projectId = '32a6f24de0a63b0c51920ddf492e834f';
const metadata = {
  name: 'TrevMobile',
  description: 'My TrevMobile App',
  url: 'https://trevmobile.com',
  icons: ['https://trevmobile.com/icon.png'],
  redirect: {
    native:    'trevmobile://',
    universal: 'https://trevmobile.com',
  },
};
// Use Polygon PoS Amoy testnet only
const chains = [polygonAmoy] as const;
const ALCHEMY_KEY = 'V9xIui7urqLjt-AxQVDkywiH9ztrcoal'; // TODO replace with your key

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  transports: {
    [polygonAmoy.id]: http(
      `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    ),
  },
});

// Ensure createAppKit is invoked only once (prevents duplicate listeners after Fast Refresh)
if (!(global as any)._appkitInitialized) {
  try {
    createAppKit({
      projectId,
      wagmiConfig,
      metadata,
      defaultChain: polygonAmoy,
      // Add storage configuration to prevent session restoration issues
      storage: {
        getItem: async (key: string) => {
          try {
            return null; // Disable persistent storage to prevent restoration conflicts
          } catch (error) {
            console.warn('Storage getItem error:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          // No-op to prevent storage issues
        },
        removeItem: async (key: string) => {
          // No-op to prevent storage issues
        },
      },
    });
    (global as any)._appkitInitialized = true;
    console.log('✅ AppKit initialized successfully');
  } catch (error) {
    console.error('❌ AppKit initialization failed:', error);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Cleanup function for WalletConnect sessions
const cleanupWalletConnect = () => {
  try {
    // Clear any existing WalletConnect sessions
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.includes('walletconnect') || key.includes('wc@')) {
          window.localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn('WalletConnect cleanup error:', error);
  }
};

// Run cleanup on app start
cleanupWalletConnect();

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000',
  },
};

// ───────── App component ─────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <OfflineInitializer />
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
              {/* AppKit modal */}
              <AppKit />
            </QueryClientProvider>
          </WagmiProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
