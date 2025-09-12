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

// ───────── AppKit setup ─────────

// Suppress WalletConnect duplicate listener warning during dev reloads
LogBox.ignoreLogs(['emitting session_request']);

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
  createAppKit({
    projectId,
    wagmiConfig,
    metadata,
    defaultChain: polygonAmoy,
  });
  (global as any)._appkitInitialized = true;
}

const queryClient = new QueryClient();

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
