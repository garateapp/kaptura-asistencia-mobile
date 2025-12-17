import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Attendance, Locacion, Personal, getLocacions, getPendingAttendances, getPersonals } from '@/services/db';

type PendingItem = Attendance & {
  personalNombre: string;
  locacionNombre: string;
};

export default function PendingScreen() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [att, personals, locs] = await Promise.all([
        getPendingAttendances(),
        getPersonals(),
        getLocacions(),
      ]);

      const personalMap = new Map<number, Personal>();
      const locMap = new Map<number, Locacion>();
      personals.forEach((p) => personalMap.set(p.id, p));
      locs.forEach((l) => locMap.set(l.id, l));

      const merged: PendingItem[] = att.map((a) => ({
        ...a,
        personalNombre: personalMap.get(a.personal_id)?.nombre ?? 'Desconocido',
        locacionNombre: locMap.get(a.location_id)?.nombre ?? 'Sin locación',
      }));
      setPending(merged);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pendientes</ThemedText>
      <ThemedText style={styles.helper}>
        Se mostrarán hasta que el botón de sincronizar los envíe al servidor.
      </ThemedText>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.local_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListEmptyComponent={<ThemedText>No hay asistencias pendientes.</ThemedText>}
        renderItem={({ item }) => (
          <ThemedView style={styles.item}>
            <View style={styles.itemHeader}>
              <ThemedText type="subtitle">{item.personalNombre}</ThemedText>
              <ThemedText style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </ThemedText>
            </View>
            <ThemedText>{item.locacionNombre}</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    padding: 16,
  },
  helper: {
    lineHeight: 20,
  },
  item: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
});
