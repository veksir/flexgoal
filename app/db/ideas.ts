import { getDb } from './database';

export interface Idea {
  id: number;
  texto: string;
  creado_en: string;
}

export async function crearIdea(texto: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO ideas (texto, creado_en) VALUES (?, ?)',
    texto,
    new Date().toISOString()
  );
}

export async function listarIdeas(): Promise<Idea[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Idea>(
    'SELECT id, texto, creado_en FROM ideas ORDER BY creado_en DESC'
  );
  return rows;
}

export async function eliminarIdea(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ideas WHERE id = ?', id);
}