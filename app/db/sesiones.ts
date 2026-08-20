import type { SQLiteDatabase } from 'expo-sqlite';

export interface Sesion {
  id: number;
  tarea_id: number;
  duracion_minutos: number;
  creado_en: string;
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