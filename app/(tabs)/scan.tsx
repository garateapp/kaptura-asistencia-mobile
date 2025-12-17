import { Audio } from 'expo-av';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import {
  Locacion,
  Personal,
  getLocacions,
  getPersonals,
  hasAttendanceForDay,
  hasAttendanceWithinWindow,
  insertAttendance,
} from '@/services/db';

const parsePersonalId = (data: string): string | null => {
  try {
    const url = new URL(data);
    return url.searchParams.get('person_id');
  } catch {
    return data;
  }
};

const normalizeRut = (rut?: string | null) =>
  rut ? rut.replace(/[^0-9kK]/g, '').toLowerCase() : '';

const BRAND_GREEN = '#038c34';
const BRAND_ORANGE = '#fe790f';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locaciones, setLocaciones] = useState<Locacion[]>([]);
  const [personales, setPersonales] = useState<Personal[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [scannedToday, setScannedToday] = useState<Set<string>>(new Set());
  const soundRef = useRef<Audio.Sound | null>(null);

  const BEEP_URI =
    'data:audio/wav;base64,UklGRqQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YUiQAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA';

  useEffect(() => {
    getLocacions().then(setLocaciones).catch(() => setLocaciones([]));
    getPersonals().then(setPersonales).catch(() => setPersonales([]));

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: BEEP_URI }, { volume: 0.8 });
        soundRef.current = sound;
      } catch (err) {
        console.warn('No se pudo cargar beep', err);
      }
    };
    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const locacionMap = useMemo(() => new Map(locaciones.map((l) => [l.id, l])), [locaciones]);

  const formatLocacionName = (loc: Locacion) => {
    const parent = loc.locacion_padre_id ? locacionMap.get(loc.locacion_padre_id) : undefined;
    return parent ? `${parent.nombre} - ${loc.nombre}` : loc.nombre;
  };

  const playBeep = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (err) {
      console.warn('No se pudo reproducir beep', err);
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      playBeep();
      if (!selectedLocationId) {
        Alert.alert('Selecciona locacion', 'Debes elegir una locacion antes de escanear.');
        return;
      }

      const raw = parsePersonalId(result.data);
      if (!raw) {
        Alert.alert('QR invalido', 'No se encontro el parametro de personal en el QR.');
        return;
      }

      const personal = personales.find((p) => normalizeRut(p.rut) === normalizeRut(raw));

      if (!personal) {
        Alert.alert('No encontrado', 'El personal no esta cargado en el dispositivo.');
        return;
      }

      const todayIso = new Date().toISOString();
      const duplicateKey = `${personal.id}:${selectedLocationId}:${todayIso.slice(0, 10)}`;
      if (scannedToday.has(duplicateKey)) {
        Alert.alert('Duplicado', 'Ya escaneaste a esta persona en esta locacion hoy.');
        return;
      }

      const hasRecent = await hasAttendanceWithinWindow(
        personal.id,
        selectedLocationId,
        todayIso,
        2
      );
      if (hasRecent) {
        Alert.alert('Duplicado', 'Ya hay un registro en las ultimas 2 horas para esta locacion.');
        setScannedToday((prev) => new Set(prev).add(duplicateKey));
        return;
      }

      const alreadyExists = await hasAttendanceForDay(
        personal.id,
        selectedLocationId,
        todayIso
      );
      if (alreadyExists) {
        Alert.alert('Duplicado', 'Ya existe un registro de hoy para esta persona y locacion.');
        setScannedToday((prev) => new Set(prev).add(duplicateKey));
        return;
      }

      await insertAttendance({
        personalId: personal.id,
        locationId: selectedLocationId,
        timestamp: todayIso,
      });
      setScannedToday((prev) => new Set(prev).add(duplicateKey));
      const locName = formatLocacionName(locacionMap.get(selectedLocationId)!);
      setLastMessage(`Marcado ${personal.nombre} en locacion ${locName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar asistencia';
      Alert.alert('Error', message);
    } finally {
      setTimeout(() => setIsScanning(false), 900);
    }
  };

  const selectedLocationName = useMemo(() => {
    if (!selectedLocationId) return 'Sin seleccionar';
    const loc = locacionMap.get(selectedLocationId);
    return loc ? formatLocacionName(loc) : 'Sin seleccionar';
  }, [locacionMap, selectedLocationId]);

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Solicitando permisos de camara...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Necesitamos permiso para usar la camara.</ThemedText>
        <ThemedButton title="Dar permiso" onPress={requestPermission} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.hero}>
      
        <View style={styles.heroText}>
          <ThemedText type="title" style={styles.title}>
            Tomar asistencia
          </ThemedText>
          <ThemedText style={styles.helper}>1) Selecciona locacion 2) Escanea QR.</ThemedText>
        </View>
      
      </View>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Locacion seleccionada</ThemedText>
        <ThemedText style={styles.selected}>{selectedLocationName}</ThemedText>
        <FlatList
          data={locaciones}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locations}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedLocationId;
            return (
              <Pressable
                onPress={() => setSelectedLocationId(item.id)}
                style={[styles.locationChip, isSelected && styles.locationChipActive]}>
                <ThemedText style={isSelected ? styles.locationTextActive : undefined}>
                  {formatLocacionName(item)}
                </ThemedText>
              </Pressable>
            );
          }}
          ListEmptyComponent={<ThemedText>No hay locaciones cargadas.</ThemedText>}
        />
      </ThemedView>

      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      </View>

      {lastMessage && (
        <ThemedView style={styles.feedback}>
          <ThemedText>{lastMessage}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#f7f9f7',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e8f5ed',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d6eadd',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: BRAND_GREEN,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  icon: {
    width: 48,
    height: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  section: {
    gap: 8,
  },
  selected: {
    fontWeight: '600',
  },
  locations: {
    gap: 8,
    paddingVertical: 4,
  },
  locationChip: {
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationChipActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  locationTextActive: {
    color: '#fff',
  },
  helper: {
    lineHeight: 20,
    color: '#3c3c3c',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 280,
  },
  feedback: {
    borderWidth: 1,
    borderColor: BRAND_ORANGE,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff8f1',
  },
});
