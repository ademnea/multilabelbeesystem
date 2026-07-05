
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { THEME } from '../theme';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are offline. Showing cached data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: THEME.accent,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
