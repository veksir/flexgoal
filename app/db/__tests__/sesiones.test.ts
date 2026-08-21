import { crearMeta, listarMetas } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearTarea, listarTareasPorObjetivo } from '../tareas';
import {
  crearSesion,
  listarSesionesPorTarea,
  tiempoTotalPorTarea,
  iniciarSesionActiva,
  obtenerSesionActiva,
  finalizarSesionActiva,
  obtenerConfiguracionPomodoro,
  actualizarConfiguracionPomodoro,
  iniciarPomodoro,
  avanzarFasePomodoro,
  resolverSesionActivaAlAbrir,
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

describe('sesion activa', () => {
  test('obtenerSesionActiva retorna null si no hay ninguna', async () => {
    const db = crearDbPruebas();

    const sesion = await obtenerSesionActiva(db);

    expect(sesion).toBeNull();
  });

  test('iniciarSesionActiva persiste la sesión', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarSesionActiva(db, tareaId);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.tareaId).toBe(tareaId);
  });

  test('finalizarSesionActiva guarda en sesiones y borra la fila', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarSesionActiva(db, tareaId);
    await finalizarSesionActiva(db, tareaId);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).toBeNull();
  });

  test('finalizarSesionActiva descarta si es menor a 1 minuto', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarSesionActiva(db, tareaId);

    // Simular inicio muy reciente (ahora)
    const fila = await db.getFirstAsync<{ tarea_id: number }>(
      'SELECT tarea_id FROM sesion_activa WHERE tarea_id = ?',
      tareaId
    );
    expect(fila).not.toBeNull();

    await finalizarSesionActiva(db, tareaId);

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(0);
    const sesion = await obtenerSesionActiva(db);
    expect(sesion).toBeNull();
  });
});

describe('configuracion pomodoro', () => {
  test('obtenerConfiguracionPomodoro crea valores por defecto si no existe', async () => {
    const db = crearDbPruebas();

    const config = await obtenerConfiguracionPomodoro(db);

    expect(config.duracionTrabajoMinutos).toBe(25);
    expect(config.duracionDescansoMinutos).toBe(5);
  });

  test('actualizarConfiguracionPomodoro persiste nuevos valores', async () => {
    const db = crearDbPruebas();

    await actualizarConfiguracionPomodoro(db, 30, 10);
    const config = await obtenerConfiguracionPomodoro(db);

    expect(config.duracionTrabajoMinutos).toBe(30);
    expect(config.duracionDescansoMinutos).toBe(10);
  });
});

describe('pomodoro', () => {
  test('iniciarPomodoro persiste modo/fase/fin_esperado correctamente', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.tareaId).toBe(tareaId);
    expect(sesion!.modo).toBe('pomodoro');
    expect(sesion!.fase).toBe('trabajo');
    expect(sesion!.finEsperado).not.toBeNull();
    const finEsperado = new Date(sesion!.finEsperado!).getTime();
    const ahora = Date.now();
    expect(finEsperado).toBeGreaterThan(ahora);
    expect(finEsperado).toBeLessThanOrEqual(ahora + 25 * 60000 + 1000);
  });

  test('iniciarPomodoro guarda la configuracion usada', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 30, 10);
    const config = await obtenerConfiguracionPomodoro(db);

    expect(config.duracionTrabajoMinutos).toBe(30);
    expect(config.duracionDescansoMinutos).toBe(10);
  });

  test('avanzarFasePomodoro de trabajo a descanso guarda sesion de tiempo', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    // Simular que el inicio fue hace 25 minutos para que la fase esté vencida
    const hace25Min = new Date(Date.now() - 25 * 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET inicio = ? WHERE tarea_id = ?',
      hace25Min,
      tareaId
    );

    const resultado = await avanzarFasePomodoro(db);
    expect(resultado).not.toBeNull();
    expect(resultado!.tareaId).toBe(tareaId);
    expect(resultado!.minutosTrabajo).toBe(25);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.fase).toBe('descanso');

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(25);
  });

  test('avanzarFasePomodoro de descanso a fin borra sesion activa sin guardar tiempo', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    // Simular fase vencida y avanzar a descanso
    const hace25Min = new Date(Date.now() - 25 * 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET inicio = ? WHERE tarea_id = ?',
      hace25Min,
      tareaId
    );
    await avanzarFasePomodoro(db);

    // Simular que el descanso también venció
    const hace1Min = new Date(Date.now() - 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET fin_esperado = ? WHERE tarea_id = ?',
      hace1Min,
      tareaId
    );

    const resultado = await avanzarFasePomodoro(db);
    expect(resultado).not.toBeNull();
    expect(resultado!.tareaId).toBe(tareaId);
    expect(resultado!.minutosTrabajo).toBe(0);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).toBeNull();

    // Solo debe haber 1 sesión (la del trabajo), no del descanso
    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(25);
  });

  test('resolverSesionActivaAlAbrir resuelve fase vencida de trabajo', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    // Simular que el trabajo ya venció: inicio hace 25 min, fin_esperado hace 1 min
    const hace25Min = new Date(Date.now() - 25 * 60000).toISOString();
    const hace1Min = new Date(Date.now() - 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET inicio = ?, fin_esperado = ? WHERE tarea_id = ?',
      hace25Min,
      hace1Min,
      tareaId
    );

    const sesion = await resolverSesionActivaAlAbrir(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.fase).toBe('descanso');

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(25);
  });

  test('resolverSesionActivaAlAbrir resuelve ambas fases vencidas', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    // Simular que el trabajo venció (fin_esperado en el pasado)
    const hace25Min = new Date(Date.now() - 25 * 60000).toISOString();
    const hace1Min = new Date(Date.now() - 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET inicio = ?, fin_esperado = ? WHERE tarea_id = ?',
      hace25Min,
      hace1Min,
      tareaId
    );

    // Primera resolución: avanza de trabajo a descanso
    const sesion = await resolverSesionActivaAlAbrir(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.fase).toBe('descanso');

    const total = await tiempoTotalPorTarea(db, tareaId);
    expect(total).toBe(25);

    // Ahora simular que el descanso también venció
    const hace6Min = new Date(Date.now() - 6 * 60000).toISOString();
    await db.runAsync(
      'UPDATE sesion_activa SET fin_esperado = ? WHERE tarea_id = ?',
      hace6Min,
      tareaId
    );

    const sesionFinal = await resolverSesionActivaAlAbrir(db);
    expect(sesionFinal).toBeNull();
  });

  test('resolverSesionActivaAlAbrir no modifica sesion no vencida', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarPomodoro(db, tareaId, 25, 5);

    const sesionAntes = await obtenerSesionActiva(db);
    const sesion = await resolverSesionActivaAlAbrir(db);

    expect(sesion).not.toBeNull();
    expect(sesion!.fase).toBe('trabajo');
    expect(sesion!.finEsperado).toBe(sesionAntes!.finEsperado);
  });

  test('sesion libre pre-migracion sigue funcionando con modo libre por defecto', async () => {
    const db = crearDbPruebas();
    const tareaId = await crearTareaAyudante(db, 'Tarea');

    await iniciarSesionActiva(db, tareaId);

    const sesion = await obtenerSesionActiva(db);
    expect(sesion).not.toBeNull();
    expect(sesion!.modo).toBe('libre');
    expect(sesion!.fase).toBeNull();
    expect(sesion!.finEsperado).toBeNull();
  });
});