import type { SQLiteDatabase } from 'expo-sqlite';

export interface Sesion {
  id: number;
  tarea_id: number;
  duracion_minutos: number;
  creado_en: string;
}

export interface SesionActiva {
  tareaId: number;
  inicio: string;
}

export async function crearSesion(
  db: SQLiteDatabase,
  tareaId: number,
  duracionMinutos: number
): Promise<void> {
  if (duracionMinutos < 1) {
    return;
  }
  await db.runAsync(
    'INSERT INTO sesiones (tarea_id, duracion_minutos, creado_en) VALUES (?, ?, ?)',
    tareaId,
    duracionMinutos,
    new Date().toISOString()
  );
}

export async function tiempoTotalPorTarea(
  db: SQLiteDatabase,
  tareaId: number
): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number | null }>(
    'SELECT COALESCE(SUM(duracion_minutos), 0) AS total FROM sesiones WHERE tarea_id = ?',
    tareaId
  );
  return fila?.total ?? 0;
}

export async function listarSesionesPorTarea(
  db: SQLiteDatabase,
  tareaId: number
): Promise<Sesion[]> {
  return db.getAllAsync<Sesion>(
    'SELECT id, tarea_id, duracion_minutos, creado_en FROM sesiones WHERE tarea_id = ? ORDER BY creado_en DESC',
    tareaId
  );
}

export async function iniciarSesionActiva(
  db: SQLiteDatabase,
  tareaId: number
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sesion_activa (tarea_id, inicio) VALUES (?, ?)',
    tareaId,
    new Date().toISOString()
  );
}

export async function obtenerSesionActiva(
  db: SQLiteDatabase
): Promise<SesionActiva | null> {
  const fila = await db.getFirstAsync<{ tarea_id: number; inicio: string }>(
    'SELECT tarea_id, inicio FROM sesion_activa LIMIT 1'
  );
  if (!fila) {
    return null;
  }
  return { tareaId: fila.tarea_id, inicio: fila.inicio };
}

export async function finalizarSesionActiva(
  db: SQLiteDatabase,
  tareaId: number
): Promise<void> {
  const fila = await db.getFirstAsync<{ inicio: string }>(
    'SELECT inicio FROM sesion_activa WHERE tarea_id = ?',
    tareaId
  );
  if (!fila) {
    return;
  }
  const inicio = new Date(fila.inicio).getTime();
  const ahora = Date.now();
  const minutos = Math.round((ahora - inicio) / 60000);
  if (minutos >= 1) {
    await crearSesion(db, tareaId, minutos);
  }
  await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', tareaId);
}