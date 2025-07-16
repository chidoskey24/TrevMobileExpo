// src/components/HeaderCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather as BellIcon, FontAwesome as AvatarIcon } from '@expo/vector-icons';

interface Props {
  userName:     string;
  nairaBalance: string;
  tokenBalance: string;
}

export default function HeaderCard({
  userName,
  nairaBalance,
  tokenBalance,
}: Props) {
  return (
    <View style={styles.card}>
      {/* top row */}
      <View style={styles.row}>
      <AvatarIcon name="user-circle-o" size={56} color="#FFF" />
        <View style={styles.gap}>
          <Text style={styles.hello}>Hello</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        <View style={styles.flex} />
        <BellIcon     name="bell"            size={26} color="#FFF" />
      </View>

      {/* balance row */}
      <View style={styles.balanceRow}>
        <Text style={[styles.balance, styles.nairaFont]}>{nairaBalance}</Text>
        <Text style={[styles.balance, styles.tokenFont]}>{tokenBalance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 24,
    paddingTop: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gap: {
    marginLeft: 12,
  },
  flex: {
    flex: 1,
  },
  hello: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.7,
  },
  name: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  balance: {
    color: '#FFF',
    fontWeight: '700',
  },
  nairaFont: {
    fontSize: 34,
  },
  tokenFont: {
    fontSize: 23,
  },
});
