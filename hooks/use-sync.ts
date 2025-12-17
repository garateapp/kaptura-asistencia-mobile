import NetInfo from '@react-native-community/netinfo';
import { useCallback, useState } from 'react';

import { SyncResult, syncAll } from '@/services/sync';

type SyncHook = {
  isSyncing: boolean;
  lastResult: SyncResult | null;
  sync: () => Promise<SyncResult>;
};

export const useSync = (): SyncHook => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error('No hay conexión a internet. Intenta nuevamente cuando tengas señal.');
    }

    setIsSyncing(true);
    try {
      const result = await syncAll();
      setLastResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { isSyncing, lastResult, sync };
};
