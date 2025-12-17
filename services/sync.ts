import axios from 'axios';
import Constants from 'expo-constants';

import {
  Locacion,
  Personal,
  getPendingAttendances,
  markAttendancesSynced,
  upsertLocacions,
  upsertPersonals
} from './db';

const API_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'https://net.greenexweb.cl/api/v1';

type SyncDataResponse = {
  locacions: Locacion[];
  personals: Personal[];
};

export const pullBaseData = async () => {
  const { data } = await axios.get<SyncDataResponse>(`${API_URL}/sync-data`);
  await upsertLocacions(data.locacions ?? []);
  await upsertPersonals(data.personals ?? []);

  return {
    locacions: data.locacions?.length ?? 0,
    personals: data.personals?.length ?? 0,
  };
};

export const pushAttendances = async () => {
  const pending = await getPendingAttendances();
  if (!pending.length) {
    return { pushed: 0 };
  }

  const payload = pending.map((att) => ({
    personal_id: att.personal_id,
    location_id: att.location_id,
    timestamp: att.timestamp,
    local_id: att.local_id,
  }));

  await axios.post(`${API_URL}/attendances/bulk`, payload);
  await markAttendancesSynced(pending.map((p) => p.local_id));

  return { pushed: pending.length };
};

export const syncAll = async () => {
  const push = await pushAttendances();
  const pull = await pullBaseData();

  return {
    push,
    pull,
    timestamp: new Date().toISOString(),
  };
};

export type SyncResult = Awaited<ReturnType<typeof syncAll>>;
