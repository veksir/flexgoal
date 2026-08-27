import type { SQLiteDatabase } from 'expo-sqlite';

export interface Sesion {
  id: number;
  tarea_id: number;
  duracion_minutos: number;
  creado_en: string;
}

export type ModoSesion = 'libre' | 'pomodoro';
export type FasePomodoro = 'trabajo' | 'descanso';

export interface SesionActiva {
  tareaId: number;
  inicio: string;
  modo: ModoSesion;
  fase: FasePomodoro | null;
  finEsperado: string | null;
}

export interface ConfiguracionPomodoro {
  duracionTrabajoMinutos: number;
  duracionDescansoMinutos: number;
}

export async function crearSesion(
  db: SQLiteDatabase,
  tareaId: number,
  duracionMinutos: number
): Promise<void> {
  if (duracionMinutos < 1) {
    return;
  }
  await db.runAsync(
    'INSERT INTO sesiones (tarea_id, duracion_minutos, creado_en) VALUES (?, ?, ?)',
    tareaId,
    duracionMinutos,
    new Date().toISOString()
  );
}

export async function tiempoTotalPorTarea(
  db: SQLiteDatabase,
  tareaId: number
): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number | null }>(
    'SELECT COALESCE(SUM(duracion_minutos), 0) AS total FROM sesiones WHERE tarea_id = ?',
    tareaId
  );
  return fila?.total ?? 0;
}

export async function listarSesionesPorTarea(
  db: SQLiteDatabase,
  tareaId: number
): Promise<Sesion[]> {
  return db.getAllAsync<Sesion>(
    'SELECT id, tarea_id, duracion_minutos, creado_en FROM sesiones WHERE tarea_id = ? ORDER BY creado_en DESC',
    tareaId
  );
}

export async function iniciarSesionActiva(
  db: SQLiteDatabase,
  tareaId: number
): Promise<void> {
  await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', tareaId);
  await db.runAsync(
    'INSERT INTO sesion_activa (tarea_id, inicio) VALUES (?, ?)',
    tareaId,
    new Date().toISOString()
  );
}

export async function obtenerSesionActiva(
  db: SQLiteDatabase
): Promise<SesionActiva | null> {
  const fila = await db.getFirstAsync<{
    tarea_id: number;
    inicio: string;
    modo: string;
    fase: string | null;
    fin_esperado: string | null;
  }>(
    'SELECT tarea_id, inicio, modo, fase, fin_esperado FROM sesion_activa ORDER BY id DESC LIMIT 1'
  );
  if (!fila) {
    return null;
  }
  return {
    tareaId: fila.tarea_id,
    inicio: fila.inicio,
    modo: fila.modo as ModoSesion,
    fase: fila.fase as FasePomodoro | null,
    finEsperado: fila.fin_esperado,
  };
}

export async function finalizarSesionActiva(
  db: SQLiteDatabase,
  tareaId: number
): Promise<void> {
  const fila = await db.getFirstAsync<{ inicio: string }>(
    'SELECT inicio FROM sesion_activa WHERE tarea_id = ?',
    tareaId
  );
  if (!fila) {
    return;
  }
  const inicio = new Date(fila.inicio).getTime();
  const ahora = Date.now();
  const minutos = Math.round((ahora - inicio) / 60000);
  if (minutos >= 1) {
    await crearSesion(db, tareaId, minutos);
  }
  await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', tareaId);
}

export async function obtenerConfiguracionPomodoro(
  db: SQLiteDatabase
): Promise<ConfiguracionPomodoro> {
  const fila = await db.getFirstAsync<{
    duracion_trabajo_minutos: number;
    duracion_descanso_minutos: number;
  }>('SELECT duracion_trabajo_minutos, duracion_descanso_minutos FROM configuracion_pomodoro WHERE id = 1');
  if (fila) {
    return {
      duracionTrabajoMinutos: fila.duracion_trabajo_minutos,
      duracionDescansoMinutos: fila.duracion_descanso_minutos,
    };
  }
  await db.runAsync(
    'INSERT INTO configuracion_pomodoro (id, duracion_trabajo_minutos, duracion_descanso_minutos) VALUES (1, 25, 5)'
  );
  return { duracionTrabajoMinutos: 25, duracionDescansoMinutos: 5 };
}

export async function actualizarConfiguracionPomodoro(
  db: SQLiteDatabase,
  trabajoMin: number,
  descansoMin: number
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO configuracion_pomodoro (id, duracion_trabajo_minutos, duracion_descanso_minutos) VALUES (1, ?, ?)',
    trabajoMin,
    descansoMin
  );
}

export async function iniciarPomodoro(
  db: SQLiteDatabase,
  tareaId: number,
  trabajoMin: number,
  descansoMin: number
): Promise<void> {
  await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', tareaId);
  const ahora = new Date();
  const finEsperado = new Date(ahora.getTime() + trabajoMin * 60000);
  await db.runAsync(
    'INSERT INTO sesion_activa (tarea_id, inicio, modo, fase, fin_esperado) VALUES (?, ?, ?, ?, ?)',
    tareaId,
    ahora.toISOString(),
    'pomodoro',
    'trabajo',
    finEsperado.toISOString()
  );
  await actualizarConfiguracionPomodoro(db, trabajoMin, descansoMin);
}

export async function avanzarFasePomodoro(
  db: SQLiteDatabase
): Promise<{ tareaId: number; minutosTrabajo: number } | null> {
  const fila = await db.getFirstAsync<{
    id: number;
    tarea_id: number;
    inicio: string;
    fase: string;
    fin_esperado: string;
  }>(
    'SELECT id, tarea_id, inicio, fase, fin_esperado FROM sesion_activa WHERE modo = ? LIMIT 1',
    'pomodoro'
  );
  if (!fila) {
    return null;
  }

  if (fila.fase === 'trabajo') {
    const inicioMs = new Date(fila.inicio).getTime();
    const ahora = Date.now();
    const minutos = Math.round((ahora - inicioMs) / 60000);
    if (minutos >= 1) {
      await crearSesion(db, fila.tarea_id, minutos);
    }
    const config = await obtenerConfiguracionPomodoro(db);
    const finDescanso = new Date(ahora + config.duracionDescansoMinutos * 60000);
    await db.runAsync(
      'UPDATE sesion_activa SET fase = ?, fin_esperado = ? WHERE id = ?',
      'descanso',
      finDescanso.toISOString(),
      fila.id
    );
    return { tareaId: fila.tarea_id, minutosTrabajo: minutos };
  }

  if (fila.fase === 'descanso') {
    await db.runAsync('DELETE FROM sesion_activa WHERE id = ?', fila.id);
    return { tareaId: fila.tarea_id, minutosTrabajo: 0 };
  }

  return null;
}

export async function resolverSesionActivaAlAbrir(
  db: SQLiteDatabase
): Promise<SesionActiva | null> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sesion = await obtenerSesionActiva(db);
    if (!sesion || sesion.modo !== 'pomodoro' || !sesion.finEsperado) {
      return sesion;
    }

    const ahora = Date.now();
    const finEsperadoMs = new Date(sesion.finEsperado).getTime();

    if (ahora < finEsperadoMs) {
      return sesion;
    }

    await avanzarFasePomodoro(db);
  }
}
