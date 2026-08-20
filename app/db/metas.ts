import type { SQLiteDatabase } from 'expo-sqlite';
import type { Prioridad } from './tareas';

export interface Meta {
  id: number;
  nombre: string;
  estado: string;
  categoria: string | null;
  prioridad: Prioridad | null;
  creado_en: string;
}

export async function crearMeta(
  db: SQLiteDatabase,
  nombre: string,
  categoria?: string | null
): Promise<void> {
  await db.runAsync(
    'INSERT INTO metas (nombre, categoria, creado_en) VALUES (?, ?, ?)',
    nombre,
    categoria ?? null,
    new Date().toISOString()
  );
}

export async function listarMetas(db: SQLiteDatabase): Promise<Meta[]> {
  const rows = await db.getAllAsync<Meta>(
    'SELECT id, nombre, estado, categoria, prioridad, creado_en FROM metas ORDER BY creado_en DESC'
  );
  return rows;
}

export async function actualizarCategoriaMeta(
  db: SQLiteDatabase,
  metaId: number,
  categoria: string | null
): Promise<void> {
  await db.runAsync(
    'UPDATE metas SET categoria = ? WHERE id = ?',
    categoria,
    metaId
  );
}

export async function actualizarPrioridadMeta(
  db: SQLiteDatabase,
  metaId: number,
  prioridad: Prioridad | null
): Promise<void> {
  await db.runAsync(
    'UPDATE metas SET prioridad = ? WHERE id = ?',
    prioridad,
    metaId
  );
}

export async function actualizarEstadoMeta(
  db: SQLiteDatabase,
  metaId: number,
  nuevoEstado: string
): Promise<void> {
  await db.runAsync(
    'UPDATE metas SET estado = ? WHERE id = ?',
    nuevoEstado,
    metaId
  );
}

export interface ProgresoMeta {
  estimadoTotal: number | null;
  realTotal: number;
}

export async function progresoPorMeta(
  db: SQLiteDatabase,
  metaId: number
): Promise<ProgresoMeta> {
  const fila = await db.getFirstAsync<{
    estimado_total: number | null;
    real_total: number | null;
  }>(
    `SELECT
      (SELECT SUM(t.duracion_estimada_minutos)
       FROM tareas t
       JOIN objetivos o ON t.objetivo_id = o.id
       WHERE o.meta_id = ?) AS estimado_total,
      (SELECT SUM(s.duracion_minutos)
       FROM sesiones s
       JOIN tareas t ON s.tarea_id = t.id
       JOIN objetivos o ON t.objetivo_id = o.id
       WHERE o.meta_id = ?) AS real_total`,
    metaId,
    metaId
  );
  return {
    estimadoTotal: fila?.estimado_total ?? null,
    realTotal: fila?.real_total ?? 0,
  };
}