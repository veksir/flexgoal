import { getDb } from './database';

export interface Sesion {
  id: number;
  tarea_id: number;
  duracion_minutos: number;
  creado_en: string;
}

export async function crearSesion(
  tareaId: number,
  duracionMinutos: number
): Promise<void> {
  if (duracionMinutos < 1) {
    return;
  }
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sesiones (tarea_id, duracion_minutos, creado_en) VALUES (?, ?, ?)',
    tareaId,
    duracionMinutos,
    new Date().toISOString()
  );
}

export async function tiempoTotalPorTarea(tareaId: number): Promise<number> {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ total: number | null }>(
    'SELECT COALESCE(SUM(duracion_minutos), 0) AS total FROM sesiones WHERE tarea_id = ?',
    tareaId
  );
  return fila?.total ?? 0;
}
