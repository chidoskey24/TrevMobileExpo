// App.tsx
import 'react-native-gesture-handler';            // 🦶 react-navigation requirement
import 'react-native-url-polyfill/auto';          // 🌐 URL polyfill for AppKit
import './src/crypto-polyfill';                   // 🏝️ expo-crypto getRandomValues shim
import '@walletconnect/react-native-compat';      // 🔌 WalletConnect compat layer

import { Buffer } from 'buffer';
import process from 'process';
global.Buffer = Buffer;
global.process = process;

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { WagmiProvider } from 'wagmi';
import { mainnet, polygonAmoy } from '@wagmi/core/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createAppKit,
  defaultWagmiConfig,
  AppKit,
} from '@reown/appkit-wagmi-react-native';

import RootNavigator from './src/navigation/RootNavigator';

// ───────── AppKit setup ─────────
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
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// must be called at top level (before your component renders)
createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: polygonAmoy,
});

const queryClient = new QueryClient();

// ───────── App component ─────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>
            <RootNavigator />
            </NavigationContainer>
            {/* renders the AppKit connect modal behind the scenes */}
            <AppKit />
        </QueryClientProvider>
        </WagmiProvider>
    </GestureHandlerRootView>
  );
}
