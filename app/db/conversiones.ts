import type { SQLiteDatabase } from 'expo-sqlite';
import type { Idea } from './ideas';

export async function convertirIdeaEnMeta(
  db: SQLiteDatabase,
  idea: Idea
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      'INSERT INTO metas (nombre, creado_en) VALUES (?, ?)',
      idea.texto,
      new Date().toISOString()
    );
    await txn.runAsync('DELETE FROM ideas WHERE id = ?', idea.id);
  });
}