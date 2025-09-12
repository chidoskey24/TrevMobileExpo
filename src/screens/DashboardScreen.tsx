// ─── src/screens/DashboardScreen.tsx ─────────────────────────────
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderCard from '../components/HeaderCard';
import { useAppStore } from '../store/useAppStore';
import TransactionItem from '../components/TransactionItem';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { polygonAmoy } from '@wagmi/core/chains';
import { useTxStore } from '../store/txStore';

export default function DashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const userName = useAppStore(s=>s.user?.name ?? 'Trevor');

    /* ───────────────── wallet balance ───────────────── */
    const { address } = useAccount();

    const { data: balanceData } = useBalance({
      address,
      chainId: polygonAmoy.id,
      query: {
        enabled: !!address,
        refetchInterval: 5_000,          // refresh every 5 s
        refetchIntervalInBackground: true
      },
    });

    // Fetch POL price (matic-network) in NGN from CoinGecko
    const { data: priceData } = useQuery({
      queryKey: ['polPriceNgn'],
      queryFn: async () => {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=ngn'
        );
        return res.json() as Promise<Record<string, { ngn: number }>>;
      },
      staleTime: 60_000, // cache for 1 minute
    });

    const polPrice  = (priceData as any)?.['matic-network']?.ngn ?? 0;
    const polBalance = Number(balanceData?.formatted ?? '0');
    const nairaValue = polBalance * polPrice;

    const isReady = !!address && !!balanceData && polPrice !== 0;

    /* ───────────────── dummy tx data (static for now) ───────────── */
    const txData = useTxStore(s=>s.txs);


  return (
    <SafeAreaView style={styles.root}>
      <HeaderCard
        userName={userName}
        nairaBalance={isReady ? `₦${nairaValue.toFixed(2)}` : '₦…'}
        tokenBalance={isReady ? `${polBalance.toFixed(4)} POL` : '… POL'}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.leftBtn]} onPress={() => navigation.navigate('Deposit')}>
            <Text style={styles.actionLabel}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.rightBtn]} onPress={() => navigation.navigate('Withdraw')}>
            <Text style={styles.actionLabel}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.txCard}>
        <Text style={styles.txHeader}>Transactions</Text>

        {txData.map(tx => (
            <TransactionItem key={tx.id} {...tx} />
        ))}
      </View>
      {/*  TODO: Deposit / Withdraw buttons and Tx list  */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  marginTop: 24,
  paddingHorizontal: 24,
},

actionBtn: {
  flex: 1,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
},

leftBtn:  { marginRight: 8 },
rightBtn: { marginLeft: 8 },

actionLabel: {
  color: '#FFF',
  fontWeight: '700',
  fontSize: 16,
},

txCard: {
  margin: 24,
  backgroundColor: '#FFF',
  borderRadius: 24,
  paddingBottom: 8,
  elevation: 3,               // Android shadow
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
},
txHeader: {
  fontSize: 17,
  fontWeight: '700',
  margin: 18,
},
});
