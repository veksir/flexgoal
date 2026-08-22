import { crearMeta, listarMetas, type Meta } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import {
  alternarEstadoTarea,
  crearTarea,
  eliminarTarea,
  esDuracionValida,
  esFechaValida,
  listarTareasPorObjetivo,
  actualizarTarea,
} from '../tareas';
import { crearSesion } from '../sesiones';
import { crearDbPruebas } from './testDb';

async function crearMetaConObjetivo(
  db: Awaited<ReturnType<typeof crearDbPruebas>>,
  nombreMeta: string,
  nombreObjetivo: string
): Promise<number> {
  await crearMeta(db, nombreMeta);
  const metas = await listarMetas(db);
  const meta = metas.find((m) => m.nombre === nombreMeta) as Meta;
  await crearObjetivo(db, meta.id, nombreObjetivo);
  const objetivos = await listarObjetivosPorMeta(db, meta.id);
  return objetivos.find((o) => o.nombre === nombreObjetivo)!.id;
}

describe('tareas', () => {
  test('crearTarea guarda una tarea dentro de su objetivo', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(
      db,
      'Meta',
      'Objetivo'
    );

    await crearTarea(db, objetivoId, 'Tarea uno');

    const tareas = await listarTareasPorObjetivo(db, objetivoId);
    expect(tareas).toHaveLength(1);
    expect(tareas[0].nombre).toBe('Tarea uno');
    expect(tareas[0].estado).toBe('pendiente');
  });

  test('tareas de objetivos distintos no se mezclan', async () => {
    const db = crearDbPruebas();
    const objetivoA = await crearMetaConObjetivo(db, 'Meta A', 'Obj A');
    const objetivoB = await crearMetaConObjetivo(db, 'Meta B', 'Obj B');

    await crearTarea(db, objetivoA, 'Tarea de A');
    await crearTarea(db, objetivoA, 'Otra de A');
    await crearTarea(db, objetivoB, 'Tarea de B');

    const tareasA = await listarTareasPorObjetivo(db, objetivoA);
    const tareasB = await listarTareasPorObjetivo(db, objetivoB);

    expect(tareasA).toHaveLength(2);
    expect(tareasA.map((t) => t.nombre)).toEqual(
      expect.arrayContaining(['Tarea de A', 'Otra de A'])
    );
    expect(tareasB).toHaveLength(1);
    expect(tareasB[0].nombre).toBe('Tarea de B');
  });

  test('alternarEstadoTarea cambia el estado pendiente/completada', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea');
    const tareas = await listarTareasPorObjetivo(db, objetivoId);
    const tarea = tareas.find((t) => t.nombre === 'Tarea') as {
      id: number;
    };

    await alternarEstadoTarea(db, tarea.id, 'completada');
    let despues = (await listarTareasPorObjetivo(
      db,
      objetivoId
    )).find((t) => t.id === tarea.id);
    expect(despues?.estado).toBe('completada');

    await alternarEstadoTarea(db, tarea.id, 'pendiente');
    despues = (await listarTareasPorObjetivo(db, objetivoId)).find(
      (t) => t.id === tarea.id
    );
    expect(despues?.estado).toBe('pendiente');
  });

  test('eliminarTarea borra la tarea y sus sesiones en cascada', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea con sesiones');
    const tareas = await listarTareasPorObjetivo(db, objetivoId);
    const tarea = tareas.find((t) => t.nombre === 'Tarea con sesiones') as {
      id: number;
    };
    await crearSesion(db, tarea.id, 25);

    await eliminarTarea(db, tarea.id);

    const tareasRestantes = await listarTareasPorObjetivo(db, objetivoId);
    expect(tareasRestantes).toHaveLength(0);
  });

  test('crearTarea sin prioridad la guarda en NULL', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea sin prioridad');

    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);
    expect(tarea.prioridad).toBeNull();
  });

  test.each(['alta', 'media', 'baja'] as const)(
    'crearTarea con prioridad %s la persiste',
    async (prioridad) => {
      const db = crearDbPruebas();
      const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
      await crearTarea(db, objetivoId, 'Tarea con prioridad', undefined, undefined, prioridad);

      const [tarea] = await listarTareasPorObjetivo(db, objetivoId);
      expect(tarea.prioridad).toBe(prioridad);
    }
  );
});

describe('validación de formatos', () => {
  test('esFechaValida acepta AAAA-MM-DD', () => {
    expect(esFechaValida('2026-08-19')).toBe(true);
  });

  test('esFechaValida rechaza formatos inválidos', () => {
    expect(esFechaValida('19/08/2026')).toBe(false);
    expect(esFechaValida('2026-8-19')).toBe(false);
    expect(esFechaValida('')).toBe(false);
    expect(esFechaValida('texto')).toBe(false);
  });

  test('esDuracionValida acepta enteros positivos', () => {
    expect(esDuracionValida('25')).toBe(true);
    expect(esDuracionValida('120')).toBe(true);
  });

  test('esDuracionValida rechaza 0, negativos y decimales', () => {
    expect(esDuracionValida('0')).toBe(false);
    expect(esDuracionValida('-10')).toBe(false);
    expect(esDuracionValida('1.5')).toBe(false);
    expect(esDuracionValida('')).toBe(false);
    expect(esDuracionValida('abc')).toBe(false);
  });
});

describe('actualizarTarea', () => {
  test('actualiza el nombre de una tarea', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea original');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, { nombre: 'Tarea renombrada' });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.nombre).toBe('Tarea renombrada');
  });

  test('actualiza la fecha planificada', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea', '2026-08-20');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, { fechaPlanificada: '2026-09-01' });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.fecha_planificada).toBe('2026-09-01');
  });

  test('quita la fecha planificada con null', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea', '2026-08-20');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, { fechaPlanificada: null });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.fecha_planificada).toBeNull();
  });

  test('actualiza la duracion estimada', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea', undefined, 30);
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, { duracionEstimadaMinutos: 60 });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.duracion_estimada_minutos).toBe(60);
  });

  test('actualiza la prioridad', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, { prioridad: 'alta' });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.prioridad).toBe('alta');
  });

  test('actualiza varios campos a la vez', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Original', '2026-08-20', 30, 'baja');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await actualizarTarea(db, tarea.id, {
      nombre: 'Nuevo nombre',
      fechaPlanificada: '2026-10-01',
      duracionEstimadaMinutos: 90,
      prioridad: 'media',
    });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.nombre).toBe('Nuevo nombre');
    expect(actualizada.fecha_planificada).toBe('2026-10-01');
    expect(actualizada.duracion_estimada_minutos).toBe(90);
    expect(actualizada.prioridad).toBe('media');
  });

  test('rechaza nombre vacio', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await expect(
      actualizarTarea(db, tarea.id, { nombre: '   ' })
    ).rejects.toThrow('El nombre de la tarea no puede estar vacío');
  });

  test('rechaza fecha con formato invalido', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await expect(
      actualizarTarea(db, tarea.id, { fechaPlanificada: '20/08/2026' })
    ).rejects.toThrow('Fecha inválida');
  });

  test('rechaza duracion invalida', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea');
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);

    await expect(
      actualizarTarea(db, tarea.id, { duracionEstimadaMinutos: -5 })
    ).rejects.toThrow('Duración inválida');
  });

  test('las sesiones de la tarea no se alteran al editar', async () => {
    const db = crearDbPruebas();
    const objetivoId = await crearMetaConObjetivo(db, 'Meta', 'Obj');
    await crearTarea(db, objetivoId, 'Tarea', undefined, 30);
    const [tarea] = await listarTareasPorObjetivo(db, objetivoId);
    await crearSesion(db, tarea.id, 20);

    await actualizarTarea(db, tarea.id, { nombre: 'Renombrada' });
    const [actualizada] = await listarTareasPorObjetivo(db, objetivoId);

    expect(actualizada.nombre).toBe('Renombrada');
    const sesiones = await db.getAllAsync<{ tarea_id: number }>(
      'SELECT tarea_id FROM sesiones WHERE tarea_id = ?',
      tarea.id
    );
    expect(sesiones).toHaveLength(1);
  });
});