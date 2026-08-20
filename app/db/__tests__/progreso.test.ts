import { crearMeta, listarMetas, progresoPorMeta } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearTarea, listarTareasPorObjetivo } from '../tareas';
import { crearSesion } from '../sesiones';
import { crearDbPruebas } from './testDb';

async function crearJerarquiaCompleta(
  db: Awaited<ReturnType<typeof crearDbPruebas>>,
  nombreMeta: string,
  nombreTarea: string,
  duracionEstimada: number
): Promise<number> {
  await crearMeta(db, nombreMeta);
  const [meta] = await listarMetas(db);
  await crearObjetivo(db, meta.id, 'Objetivo');
  const [objetivo] = await listarObjetivosPorMeta(db, meta.id);
  await crearTarea(db, objetivo.id, nombreTarea, undefined, duracionEstimada);
  const [tarea] = await listarTareasPorObjetivo(db, objetivo.id);
  return meta.id;
}

describe('progresoPorMeta', () => {
  test('agrega el estimado a través de Objetivo → Tarea', async () => {
    const db = crearDbPruebas();
    const metaId = await crearJerarquiaCompleta(db, 'Meta', 'Tarea', 60);

    const progreso = await progresoPorMeta(db, metaId);

    expect(progreso.estimadoTotal).toBe(60);
    expect(progreso.realTotal).toBe(0);
  });

  test('agrega el tiempo real a través de Objetivo → Tarea → Sesión', async () => {
    const db = crearDbPruebas();
    const metaId = await crearJerarquiaCompleta(db, 'Meta', 'Tarea', 120);
    const [meta] = await listarMetas(db);
    const [objetivo] = await listarObjetivosPorMeta(db, meta.id);
    const [tarea] = await listarTareasPorObjetivo(db, objetivo.id);
    await crearSesion(db, tarea.id, 30);
    await crearSesion(db, tarea.id, 45);

    const progreso = await progresoPorMeta(db, metaId);

    expect(progreso.estimadoTotal).toBe(120);
    expect(progreso.realTotal).toBe(75);
  });

  test('suma estimados y reales de todas las tareas de la meta', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'Meta');
    const [meta] = await listarMetas(db);
    await crearObjetivo(db, meta.id, 'Objetivo');
    const [objetivo] = await listarObjetivosPorMeta(db, meta.id);
    await crearTarea(db, objetivo.id, 'Tarea 1', undefined, 30);
    await crearTarea(db, objetivo.id, 'Tarea 2', undefined, 90);
    const tareas = await listarTareasPorObjetivo(db, objetivo.id);
    await crearSesion(db, tareas[0].id, 10);
    await crearSesion(db, tareas[1].id, 20);

    const progreso = await progresoPorMeta(db, meta.id);

    expect(progreso.estimadoTotal).toBe(120);
    expect(progreso.realTotal).toBe(30);
  });

  test('devuelve 0/null si la meta no tiene tareas con datos', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'Meta vacía');
    const [meta] = await listarMetas(db);

    const progreso = await progresoPorMeta(db, meta.id);

    expect(progreso.estimadoTotal).toBeNull();
    expect(progreso.realTotal).toBe(0);
  });
});