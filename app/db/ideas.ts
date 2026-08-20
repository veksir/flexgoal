import type { SQLiteDatabase } from 'expo-sqlite';

export interface Idea {
  id: number;
  texto: string;
  creado_en: string;
}

export async function crearIdea(
  db: SQLiteDatabase,
  texto: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO ideas (texto, creado_en) VALUES (?, ?)',
    texto,
    new Date().toISOString()
  );
}

export async function listarIdeas(db: SQLiteDatabase): Promise<Idea[]> {
  const rows = await db.getAllAsync<Idea>(
    'SELECT id, texto, creado_en FROM ideas ORDER BY creado_en DESC'
  );
  return rows;
}

export async function eliminarIdea(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM ideas WHERE id = ?', id);
}