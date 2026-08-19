import { getDb } from './database';

export interface Meta {
  id: number;
  nombre: string;
  estado: string;
  creado_en: string;
}

export async function crearMeta(nombre: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO metas (nombre, creado_en) VALUES (?, ?)',
    nombre,
    new Date().toISOString()
  );
}

export async function listarMetas(): Promise<Meta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Meta>(
    'SELECT id, nombre, estado, creado_en FROM metas ORDER BY creado_en DESC'
  );
  return rows;
}

export interface ProgresoMeta {
  estimadoTotal: number | null;
  realTotal: number;
}

export async function progresoPorMeta(metaId: number): Promise<ProgresoMeta> {
  const db = await getDb();
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
