import { crearMeta, listarMetas, type Meta } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta, type Objetivo } from '../objetivos';
import {
  crearTarea,
  listarTareasPorObjetivo,
  tareasParaHoy,
  type Tarea,
} from '../tareas';
import { crearDbPruebas } from './testDb';

function fechaOffsetDias(offset: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset);
  return fecha.toISOString().split('T')[0];
}

async function crearJerarquia(
  db: Awaited<ReturnType<typeof crearDbPruebas>>,
  nombreMeta: string,
  nombreObjetivo: string,
  nombreTarea: string,
  fecha?: string,
  estado: 'pendiente' | 'completada' = 'pendiente'
): Promise<void> {
  await crearMeta(db, nombreMeta);
  const metas = await listarMetas(db);
  const meta = metas.find((m) => m.nombre === nombreMeta) as Meta;
  await crearObjetivo(db, meta.id, nombreObjetivo);
  const objetivos = await listarObjetivosPorMeta(db, meta.id);
  const objetivo = objetivos.find((o) => o.nombre === nombreObjetivo) as Objetivo;
  await crearTarea(db, objetivo.id, nombreTarea, fecha);
  if (estado === 'completada') {
    const tareas = await listarTareasPorObjetivo(db, objetivo.id);
    const tarea = tareas.find((t) => t.nombre === nombreTarea) as Tarea;
    await db.runAsync(
      'UPDATE tareas SET estado = ? WHERE id = ?',
      'completada',
      tarea.id
    );
  }
}

describe('tareasParaHoy', () => {
  test('incluye tareas pendientes de hoy y vencidas, ordenadas por fecha (más atrasadas primero)', async () => {
    const db = crearDbPruebas();
    await crearJerarquia(db, 'Meta A', 'Obj A', 'Anteayer', fechaOffsetDias(-2));
    await crearJerarquia(db, 'Meta B', 'Obj B', 'Ayer', fechaOffsetDias(-1));
    await crearJerarquia(db, 'Meta C', 'Obj C', 'Hoy', fechaOffsetDias(0));

    const paraHoy = await tareasParaHoy(db);

    expect(paraHoy.map((t) => t.nombre)).toEqual(['Anteayer', 'Ayer', 'Hoy']);
  });

  test('excluye tareas futuras', async () => {
    const db = crearDbPruebas();
    await crearJerarquia(db, 'Meta A', 'Obj A', 'Hoy', fechaOffsetDias(0));
    await crearJerarquia(db, 'Meta B', 'Obj B', 'Mañana', fechaOffsetDias(1));

    const paraHoy = await tareasParaHoy(db);

    expect(paraHoy.map((t) => t.nombre)).toEqual(['Hoy']);
  });

  test('excluye tareas sin fecha planificada', async () => {
    const db = crearDbPruebas();
    await crearJerarquia(db, 'Meta A', 'Obj A', 'Sin fecha');
    await crearJerarquia(db, 'Meta B', 'Obj B', 'Hoy', fechaOffsetDias(0));

    const paraHoy = await tareasParaHoy(db);

    expect(paraHoy.map((t) => t.nombre)).toEqual(['Hoy']);
  });

  test('excluye tareas completadas aunque tengan fecha de hoy', async () => {
    const db = crearDbPruebas();
    await crearJerarquia(
      db,
      'Meta A',
      'Obj A',
      'Completada',
      fechaOffsetDias(0),
      'completada'
    );

    const paraHoy = await tareasParaHoy(db);

    expect(paraHoy).toHaveLength(0);
  });

  test('incluye el contexto de meta y objetivo en cada tarea', async () => {
    const db = crearDbPruebas();
    await crearJerarquia(db, 'Mi meta', 'Mi objetivo', 'Tarea para hoy', fechaOffsetDias(0));

    const paraHoy = await tareasParaHoy(db);

    expect(paraHoy).toHaveLength(1);
    expect(paraHoy[0].nombreMeta).toBe('Mi meta');
    expect(paraHoy[0].nombreObjetivo).toBe('Mi objetivo');
  });
});