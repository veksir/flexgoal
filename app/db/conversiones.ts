import { getDb } from './database';
import type { Idea } from './ideas';

export async function convertirIdeaEnMeta(idea: Idea): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      'INSERT INTO metas (nombre, creado_en) VALUES (?, ?)',
      idea.texto,
      new Date().toISOString()
    );
    await txn.runAsync('DELETE FROM ideas WHERE id = ?', idea.id);
  });
}