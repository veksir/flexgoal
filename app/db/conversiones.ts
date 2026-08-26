import type { SQLiteDatabase } from 'expo-sqlite';
import type { Idea } from './ideas';
import { obtenerPlantilla, type PlantillaMeta } from './plantillasMeta';

export async function convertirIdeaEnMeta(
  db: SQLiteDatabase,
  idea: Idea,
  plantillaId?: string
): Promise<void> {
  const plantilla = plantillaId ? obtenerPlantilla(plantillaId) : undefined;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const resultado = await txn.runAsync(
      'INSERT INTO metas (nombre, creado_en) VALUES (?, ?)',
      idea.texto,
      new Date().toISOString()
    );
    const metaId = Number(resultado.lastInsertRowId);

    if (plantilla) {
      await insertarPlantillaEnTxn(txn, plantilla, metaId);
    }

    await txn.runAsync('DELETE FROM ideas WHERE id = ?', idea.id);
  });
}

async function insertarPlantillaEnTxn(
  txn: SQLiteDatabase,
  plantilla: PlantillaMeta,
  metaId: number
): Promise<void> {
  for (const obj of plantilla.objetivos) {
    const resObj = await txn.runAsync(
      'INSERT INTO objetivos (meta_id, nombre, creado_en) VALUES (?, ?, ?)',
      metaId,
      obj.nombre,
      new Date().toISOString()
    );
    const objetivoId = Number(resObj.lastInsertRowId);

    for (const tarea of obj.tareas) {
      await txn.runAsync(
        'INSERT INTO tareas (objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, prioridad, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)',
        objetivoId,
        tarea.nombre,
        'pendiente',
        null,
        null,
        null,
        new Date().toISOString()
      );
    }
  }
}