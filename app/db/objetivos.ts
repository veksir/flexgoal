import { getDb } from './database';

export interface Objetivo {
  id: number;
  meta_id: number;
  nombre: string;
  creado_en: string;
}

export async function crearObjetivo(metaId: number, nombre: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO objetivos (meta_id, nombre, creado_en) VALUES (?, ?, ?)',
    metaId,
    nombre,
    new Date().toISOString()
  );
}

export async function listarObjetivosPorMeta(metaId: number): Promise<Objetivo[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Objetivo>(
    'SELECT id, meta_id, nombre, creado_en FROM objetivos WHERE meta_id = ? ORDER BY creado_en DESC',
    metaId
  );
  return rows;
}