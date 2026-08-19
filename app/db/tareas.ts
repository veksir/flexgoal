import { getDb } from './database';

export type EstadoTarea = 'pendiente' | 'completada';

export interface Tarea {
  id: number;
  objetivo_id: number;
  nombre: string;
  estado: EstadoTarea;
  creado_en: string;
}

export async function crearTarea(objetivoId: number, nombre: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO tareas (objetivo_id, nombre, estado, creado_en) VALUES (?, ?, ?, ?)',
    objetivoId,
    nombre,
    'pendiente',
    new Date().toISOString()
  );
}

export async function listarTareasPorObjetivo(objetivoId: number): Promise<Tarea[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Tarea>(
    'SELECT id, objetivo_id, nombre, estado, creado_en FROM tareas WHERE objetivo_id = ? ORDER BY creado_en DESC',
    objetivoId
  );
  return rows;
}

export async function alternarEstadoTarea(
  tareaId: number,
  nuevoEstado: EstadoTarea
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tareas SET estado = ? WHERE id = ?', nuevoEstado, tareaId);
}
