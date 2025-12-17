import * as SQLite from 'expo-sqlite';

// Tipos (Se mantienen igual)
export type Locacion = {
  id: number;
  nombre: string;
  locacion_padre_id?: number | null;
};

export type Personal = {
  id: number;
  nombre: string;
  codigo: string;
  rut: string;
};

export type Attendance = {
  local_id: number;
  personal_id: number;
  location_id: number;
  timestamp: string;
  is_synced: number;
};

// 1. Abrir la base de datos de forma Síncrona (Nueva API)
const db = SQLite.openDatabaseSync('kptura.db');

// 2. Crear Tablas (execAsync permite ejecutar múltiples queries juntas)
export const createTables = async () => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS locacions (
        id INTEGER PRIMARY KEY,
        nombre TEXT,
        locacion_padre_id INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS personals (
        id INTEGER PRIMARY KEY,
        nombre TEXT,
        codigo TEXT,
        rut TEXT
      );
      
      CREATE TABLE IF NOT EXISTS attendances (
        local_id INTEGER PRIMARY KEY AUTOINCREMENT,
        personal_id INTEGER,
        location_id INTEGER,
        timestamp TEXT,
        is_synced INTEGER DEFAULT 0
      );
    `);
    console.log('Tablas creadas/verificadas');
  } catch (error) {
    console.error('Error creando tablas:', error);
  }
};

// 3. Upsert Locaciones
export const upsertLocacions = async (items: Locacion[]) => {
  // Para inserciones masivas, usamos un statement preparado o un loop con runAsync
  for (const loc of items) {
    await db.runAsync(
      'INSERT OR REPLACE INTO locacions (id, nombre, locacion_padre_id) VALUES (?, ?, ?)',
      [loc.id, loc.nombre, loc.locacion_padre_id ?? null]
    );
  }
};

// 4. Upsert Personal
export const upsertPersonals = async (items: Personal[]) => {
  for (const p of items) {
    await db.runAsync(
      'INSERT OR REPLACE INTO personals (id, nombre, codigo, rut) VALUES (?, ?, ?, ?)',
      [p.id, p.nombre, p.codigo, p.rut]
    );
  }
};

// 5. Obtener Locaciones (getAllAsync devuelve array directo)
export const getLocacions = async (): Promise<Locacion[]> => {
  return await db.getAllAsync<Locacion>('SELECT * FROM locacions ORDER BY nombre');
};

// 6. Obtener Personal
export const getPersonals = async (): Promise<Personal[]> => {
  return await db.getAllAsync<Personal>('SELECT * FROM personals ORDER BY nombre');
};

// 7. Insertar Asistencia
export const insertAttendance = async ({
  personalId,
  locationId,
  timestamp,
}: {
  personalId: number;
  locationId: number;
  timestamp: string;
}) => {
  await db.runAsync(
    'INSERT INTO attendances (personal_id, location_id, timestamp, is_synced) VALUES (?, ?, ?, 0)',
    [personalId, locationId, timestamp]
  );
};

// 8. Obtener Pendientes
export const getPendingAttendances = async (): Promise<Attendance[]> => {
  return await db.getAllAsync<Attendance>(
    'SELECT * FROM attendances WHERE is_synced = 0 ORDER BY timestamp DESC'
  );
};

// 9. Marcar como Sincronizados
export const markAttendancesSynced = async (localIds: number[]) => {
  if (localIds.length === 0) return;
  const placeholders = localIds.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE attendances SET is_synced = 1 WHERE local_id IN (${placeholders})`,
    localIds
  );
};

// 10. Contar Pendientes (getFirstAsync para un solo resultado)
export const getPendingCount = async () => {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM attendances WHERE is_synced = 0'
  );
  return result?.count ?? 0;
};

export const clearAttendances = async () => {
  await db.runAsync('DELETE FROM attendances');
};

export const hasAttendanceWithinWindow = async (
  personalId: number,
  locationId: number,
  isoTimestamp: string,
  windowHours = 2
) => {
  const end = new Date(isoTimestamp);
  const start = new Date(end.getTime() - windowHours * 60 * 60 * 1000);
  const result = await db.getFirstAsync<{ count: number }>(
    `
    SELECT COUNT(*) as count
    FROM attendances
    WHERE personal_id = ?
      AND location_id = ?
      AND timestamp BETWEEN ? AND ?
  `,
    [personalId, locationId, start.toISOString(), end.toISOString()]
  );
  return (result?.count ?? 0) > 0;
};

export const hasAttendanceForDay = async (
  personalId: number,
  locationId: number,
  isoDate: string
) => {
  const result = await db.getFirstAsync<{ count: number }>(
    `
    SELECT COUNT(*) as count
    FROM attendances
    WHERE personal_id = ?
      AND location_id = ?
      AND date(timestamp) = date(?)
  `,
    [personalId, locationId, isoDate]
  );
  return (result?.count ?? 0) > 0;
};
