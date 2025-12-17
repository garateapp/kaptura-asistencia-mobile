import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { useSync } from '@/hooks/use-sync';
import { getPendingCount } from '@/services/db';

export default function SyncScreen() {
  const { isSyncing, lastResult, sync } = useSync();
  const [pending, setPending] = useState(0);

  const refreshPending = () => {
    getPendingCount().then(setPending).catch(() => setPending(0));
  };

  useEffect(() => {
    refreshPending();
  }, []);

  useEffect(() => {
    refreshPending();
  }, [lastResult]);

  const handleSync = async () => {
    try {
      const result = await sync();
      Alert.alert(
        'Sincronizado',
        `Enviados: ${result.push.pushed}\nLocaciones: ${result.pull.locacions}\nPersonals: ${result.pull.personals}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo sincronizar';
      Alert.alert('Error', message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sincronizar</ThemedText>
      <ThemedText style={styles.helper}>
        Envía asistencias pendientes y descarga catálogos cuando tengas conexión.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Pendientes por enviar</ThemedText>
        <ThemedText style={styles.pendingNumber}>{pending}</ThemedText>
        <ThemedText style={styles.helperSmall}>Confirmamos red antes de sincronizar.</ThemedText>
      </ThemedView>

      {lastResult && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Última sincronización</ThemedText>
          <ThemedText>{new Date(lastResult.timestamp).toLocaleString()}</ThemedText>
          <ThemedText>
            Enviados: {lastResult.push.pushed} · Locaciones: {lastResult.pull.locacions} ·
            Personal: {lastResult.pull.personals}
          </ThemedText>
        </ThemedView>
      )}

      <View style={styles.actions}>
        <ThemedButton title={isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'} onPress={handleSync} disabled={isSyncing} />
        <ThemedButton title="Refrescar pendientes" onPress={refreshPending} disabled={isSyncing} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  helper: {
    lineHeight: 20,
  },
  helperSmall: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  pendingNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
});
