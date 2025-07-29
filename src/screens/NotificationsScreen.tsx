import React from 'react';
import { SafeAreaView, FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTxStore } from '../store/txStore';
import TransactionItem from '../components/TransactionItem';

import { useEffect } from 'react';

export default function NotificationsScreen() {
  const txs = useTxStore((s) => s.txs);
  const markAllRead = useTxStore(s=>s.markAllRead);

  useEffect(() => {
    markAllRead();
  }, []);

  // Only deposit and withdraw types (store already only has these)
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {txs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem {...item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 60,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 