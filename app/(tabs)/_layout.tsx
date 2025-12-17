import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppHeader } from '@/components/app-header';

const BRAND_GREEN = '#038c34';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const headerBase = {
    headerStyle: { backgroundColor: '#fff' },
    headerTintColor: BRAND_GREEN,
    headerTitleAlign: 'center' as const,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          ...headerBase,
          headerTitle: () => <AppHeader title="Inicio" subtitle="Panel principal" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Asistencia',
          ...headerBase,
          headerTitle: () => <AppHeader title="Asistencia" subtitle="Escaneo QR" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.viewfinder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pendientes"
        options={{
          title: 'Pendientes',
          ...headerBase,
          headerTitle: () => <AppHeader title="Pendientes" subtitle="Por sincronizar" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sincronizar',
          ...headerBase,
          headerTitle: () => <AppHeader title="Sincronizar" subtitle="Envio/descarga" />,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="arrow.triangle.2.circlepath" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
