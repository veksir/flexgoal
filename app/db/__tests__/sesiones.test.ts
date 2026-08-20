import { crearMeta, listarMetas } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearTarea, listarTareasPorObjetivo } from '../tareas';
import { crearSesion, tiempoTotalPorTarea } from '../sesiones';
import { crearDbPruebas } from './testDb';

async function crearTareaAyudante(
  db: Awaited<ReturnType<typeof crearDbPruebas>>,
  nombreTarea: string
): Promise<number> {
  await crearMeta(db, 'Meta');
  const [meta] = await listarMetas(db);
  await crearObjetivo(db, meta.id, 'Objetivo');
  const [objetivo] = await listarObjetivosPorMeta(db, meta.id);
  await crearTarea(db, objetivo.id, nombreTarea);
  const [tarea] = await listarTareasPorObjetivo(db, objetivo.id);
  return tarea.id;
}

describe('sesiones', () => {
  test('sesiones menores a un minuto no se guardan', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await crearSesion(db, tareaId, 0);

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(0);
  });

  test('tiempoTotalPorTarea suma correctamente con 2+ sesiones', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await crearSesion(db, tareaId, 25);
    await crearSesion(db, tareaId, 40);
    await crearSesion(db, tareaId, 55);

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(120);
  });

  test('tiempoTotalPorTarea es 0 si la tarea no tiene sesiones', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    const total = await tiempoTotalPorTarea(db, tareaId);

    expect(total).toBe(0);
  });
});