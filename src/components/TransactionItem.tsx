// src/components/TransactionItem.tsx
import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { Feather } from '@expo/vector-icons';

interface Props {
  type: 'deposit' | 'withdraw'
  title: string       // e.g. "Sent to wallet"
  subtitle: string    // e.g. "0.75 POL"
  amount: number      // +200 or –150
  currency?: string   // default "₦"
  onPress?: () => void // Optional press handler
}

export default function TransactionItem({
  type,
  title,
  subtitle,
  amount,
  currency = '₦',
  onPress,
}: Props) {
  const theme = useTheme()
  const isDeposit = type === 'deposit'
  const iconName  = isDeposit ? 'arrow-down-left' : 'arrow-up-right'
  const amountColor = isDeposit ? '#0066FF' : '#D60000'

  // Format with commas and two decimal places
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.row} onPress={onPress} activeOpacity={0.7}>
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

      <Text
        variant="bodyMedium"
        style={[styles.amount, { color: amountColor }]}
      >
        {isDeposit ? '+' : '-'}
        {currency}
        {formatted}
      </Text>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,           // ← match the card’s horizontal padding
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  icon: {
    marginRight: 24,                 // ← same gutter as the row padding
  },
  textBlock: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    color: '#666',
  },
  amount: {
    marginLeft: 'auto',              // ← push to right edge
    textAlign: 'right',
    width:  80,                      // ← fixed width for consistent alignment
  },
})
