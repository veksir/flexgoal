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