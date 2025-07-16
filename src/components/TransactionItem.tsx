// src/components/TransactionItem.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { Feather } from '@expo/vector-icons';

interface Props {
  type: 'deposit' | 'withdraw'
  title: string       // e.g. “Sent to wallet”
  subtitle: string    // e.g. “0.75 POL”
  amount: number      // +200 or –150
  currency?: string   // default “₦”
}

export default function TransactionItem({
  type,
  title,
  subtitle,
  amount,
  currency = '₦',
}: Props) {
  const theme = useTheme()
  const isDeposit = type === 'deposit'
  const iconName  = isDeposit ? 'arrow-down-left' : 'arrow-up-right'
  const amountColor = isDeposit ? theme.colors.primary : '#D60000'

  // Format with commas and two decimal places
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return (
    <View style={styles.row}>
      <Feather
        name={iconName}
        size={24}
        color={theme.colors.onSurface}
        style={styles.icon}
      />

      <View style={styles.textBlock}>
        <Text variant="bodyMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <Text variant="bodyMedium" style={[styles.amount, { color: amountColor }]}>
        {isDeposit ? '+' : '-'}
        {currency}
        {formatted}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  icon: {
    marginRight: 16,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    // variant already gives you the correct font, this is only for override
    marginBottom: 2,
  },
  subtitle: {
    color: '#666',
  },
  amount: {
    textAlign: 'right',
    minWidth: 80,
  },
})
