import type { SQLiteDatabase } from 'expo-sqlite';

export interface Objetivo {
  id: number;
  meta_id: number;
  nombre: string;
  creado_en: string;
}

export async function crearObjetivo(
  db: SQLiteDatabase,
  metaId: number,
  nombre: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO objetivos (meta_id, nombre, creado_en) VALUES (?, ?, ?)',
    metaId,
    nombre,
    new Date().toISOString()
  );
}

export async function listarObjetivosPorMeta(
  db: SQLiteDatabase,
  metaId: number
): Promise<Objetivo[]> {
  const rows = await db.getAllAsync<Objetivo>(
    'SELECT id, meta_id, nombre, creado_en FROM objetivos WHERE meta_id = ? ORDER BY creado_en ASC',
    metaId
  );
  return rows;
}