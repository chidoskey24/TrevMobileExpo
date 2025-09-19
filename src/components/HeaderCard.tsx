// src/components/HeaderCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather as BellIcon, FontAwesome as AvatarIcon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTxStore } from '../store/txStore';
import { useAppStore } from '../store/useAppStore';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hasUnread = useTxStore(s=>s.hasUnread);
  const avatarUri = useAppStore(s=>s.user?.avatarUri);

  return (
    <View style={styles.card}>
      {/* top row */}
      <View style={styles.row}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <AvatarIcon name="user-circle-o" size={56} color="#FFF" />
          )}
        </TouchableOpacity>
        <View style={styles.gap}>
          <Text style={styles.hello}>Hello</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        <View style={styles.flex} />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View>
            <BellIcon name="bell" size={26} color="#FFF" />
            {hasUnread && <View style={styles.dot} />}
          </View>
        </TouchableOpacity>
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
    paddingTop: 40,
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
  dot: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 5,
    width: 10,
    height: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
