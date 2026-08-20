import { crearMeta, listarMetas } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearTarea, listarTareasPorObjetivo } from '../tareas';
import {
  crearSesion,
  listarSesionesPorTarea,
  tiempoTotalPorTarea,
} from '../sesiones';
import { crearDbPruebas, esperar } from './testDb';

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

  test('listarSesionesPorTarea ordena de la más reciente a la más antigua', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await crearSesion(db, tareaId, 25);
    await esperar(5);
    await crearSesion(db, tareaId, 40);
    await esperar(5);
    await crearSesion(db, tareaId, 55);

    const sesiones = await listarSesionesPorTarea(db, tareaId);

    expect(sesiones).toHaveLength(3);
    expect(sesiones.map((s) => s.duracion_minutos)).toEqual([55, 40, 25]);
  });

  test('listarSesionesPorTarea retorna lista vacía si la tarea no tiene sesiones', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    const sesiones = await listarSesionesPorTarea(db, tareaId);

    expect(sesiones).toEqual([]);
  });
});