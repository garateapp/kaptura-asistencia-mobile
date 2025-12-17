import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPendingCount } from '@/services/db';

type Action = {
  title: string;
  description: string;
  href: string;
  icon: 'camera.viewfinder' | 'list.bullet' | 'arrow.triangle.2.circlepath';
};

const actions: Action[] = [
  {
    title: 'Tomar asistencia',
    description: 'Selecciona locación y escanea el QR del personal.',
    href: '/scan',
    icon: 'camera.viewfinder',
  },
  {
    title: 'Pendientes',
    description: 'Revisa las asistencias que aún no se sincronizan.',
    href: '/pendientes',
    icon: 'list.bullet',
  },
  {
    title: 'Sincronizar',
    description: 'Envía pendientes y descarga catálogos actualizados.',
    href: '/sync',
    icon: 'arrow.triangle.2.circlepath',
  },
];

export default function HomeScreen() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    getPendingCount().then(setPending).catch(() => setPending(0));
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Kptura Asistencia</ThemedText>
      <ThemedText style={styles.subtitle}>
        Flujo offline: captura primero, sincroniza cuando tengas señal.
      </ThemedText>

      <ThemedView style={styles.pendingCard}>
        <ThemedText type="subtitle">Pendientes sin enviar</ThemedText>
        <ThemedText style={styles.pendingNumber}>{pending}</ThemedText>
        <ThemedText style={styles.pendingHint}>Se guardan en SQLite hasta sincronizar.</ThemedText>
      </ThemedView>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Link key={action.href} href={action.href} asChild>
            <Pressable style={styles.card}>
              <IconSymbol name={action.icon} size={32} color="#007aff" />
              <View style={styles.cardBody}>
                <ThemedText type="subtitle">{action.title}</ThemedText>
                <ThemedText>{action.description}</ThemedText>
              </View>
            </Pressable>
          </Link>
        ))}
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
  subtitle: {
    lineHeight: 20,
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  pendingNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  pendingHint: {
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
});
