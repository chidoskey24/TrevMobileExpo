// src/screens/TransactionsScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTxStore } from '../store/txStore';
import { useAppStore } from '../store/useAppStore';
import TransactionItem from '../components/TransactionItem';
import { pdfService } from '../lib/pdfService';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function TransactionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const txData = useTxStore(s => s.txs);
  const userName = useAppStore(s => s.user?.name ?? 'User');
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);

  const renderTransaction = ({ item }: { item: any }) => (
    <TransactionItem {...item} />
  );

  const handleDownloadPDF = async () => {
    if (txData.length === 0) {
      Alert.alert('No Transactions', 'There are no transactions to download.');
      return;
    }

    setIsGeneratingStatement(true);
    
    try {
      const csvContent = await pdfService.generateTransactionStatement({
        transactions: txData,
        userName: userName,
      });
      
      Alert.alert(
        'Statement Generated',
        `Transaction statement has been generated successfully!\n\nCheck the console logs for the CSV content.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to generate statement: ${error}`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Transaction Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {txData.length} transaction{txData.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={handleDownloadPDF}
          disabled={isGeneratingStatement || txData.length === 0}
        >
          {isGeneratingStatement ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <Text style={styles.downloadIcon}>📥</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={txData}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transactions will appear here once you start using the app
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    paddingBottom: 7,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
