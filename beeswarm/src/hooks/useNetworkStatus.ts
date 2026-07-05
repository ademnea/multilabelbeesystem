
import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial network status
    const checkNetworkStatus = async () => {
      const status = await Network.getNetworkStateAsync();
      setIsOffline(!status.isConnected);
    };

    checkNetworkStatus();

    // Listen for network status changes
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, []);

  return { isOffline };
}
