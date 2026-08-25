import type { SQLiteDatabase } from 'expo-sqlite';

export type EstadoTarea = 'pendiente' | 'completada';
export type Prioridad = 'alta' | 'media' | 'baja';

export interface Tarea {
  id: number;
  objetivo_id: number;
  nombre: string;
  estado: EstadoTarea;
  fecha_planificada: string | null;
  duracion_estimada_minutos: number | null;
  prioridad: Prioridad | null;
  creado_en: string;
}

export interface TareaConContexto extends Tarea {
  nombreMeta: string;
  nombreObjetivo: string;
}

export async function crearTarea(
  db: SQLiteDatabase,
  objetivoId: number,
  nombre: string,
  fechaPlanificada?: string,
  duracionEstimadaMinutos?: number,
  prioridad?: Prioridad | null
): Promise<void> {
  await db.runAsync(
    'INSERT INTO tareas (objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, prioridad, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)',
    objetivoId,
    nombre,
    'pendiente',
    fechaPlanificada ?? null,
    duracionEstimadaMinutos ?? null,
    prioridad ?? null,
    new Date().toISOString()
  );
}

export async function listarTareasPorObjetivo(
  db: SQLiteDatabase,
  objetivoId: number
): Promise<Tarea[]> {
  const rows = await db.getAllAsync<Tarea>(
    'SELECT id, objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, prioridad, creado_en FROM tareas WHERE objetivo_id = ? ORDER BY creado_en DESC',
    objetivoId
  );
  return rows;
}

export async function tareasParaHoy(
  db: SQLiteDatabase
): Promise<TareaConContexto[]> {
  const hoy = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync<TareaConContexto>(
    `SELECT
      t.id,
      t.objetivo_id,
      t.nombre,
      t.estado,
      t.fecha_planificada,
      t.duracion_estimada_minutos,
      t.prioridad,
      t.creado_en,
      o.nombre AS nombreObjetivo,
      m.nombre AS nombreMeta
    FROM tareas t
    JOIN objetivos o ON t.objetivo_id = o.id
    JOIN metas m ON o.meta_id = m.id
    WHERE t.estado = 'pendiente'
      AND t.fecha_planificada IS NOT NULL
      AND t.fecha_planificada <= ?
    ORDER BY t.fecha_planificada ASC, t.creado_en ASC`,
    hoy
  );
  return rows;
}

export async function alternarEstadoTarea(
  db: SQLiteDatabase,
  tareaId: number,
  nuevoEstado: EstadoTarea
): Promise<void> {
  await db.runAsync(
    'UPDATE tareas SET estado = ? WHERE id = ?',
    nuevoEstado,
    tareaId
  );
}

export interface CambiosTarea {
  nombre?: string;
  fechaPlanificada?: string | null;
  duracionEstimadaMinutos?: number | null;
  prioridad?: Prioridad | null;
}

export async function actualizarTarea(
  db: SQLiteDatabase,
  tareaId: number,
  cambios: CambiosTarea
): Promise<void> {
  if (cambios.nombre !== undefined) {
    const nombreLimpio = cambios.nombre.trim();
    if (!nombreLimpio) {
      throw new Error('El nombre de la tarea no puede estar vacío');
    }
  }
  if (
    cambios.fechaPlanificada !== undefined &&
    cambios.fechaPlanificada !== null &&
    cambios.fechaPlanificada !== ''
  ) {
    if (!esFechaValida(cambios.fechaPlanificada)) {
      throw new Error('Fecha inválida. Usa el formato AAAA-MM-DD.');
    }
  }
  if (
    cambios.duracionEstimadaMinutos !== undefined &&
    cambios.duracionEstimadaMinutos !== null
  ) {
    if (
      !Number.isInteger(cambios.duracionEstimadaMinutos) ||
      cambios.duracionEstimadaMinutos <= 0
    ) {
      throw new Error('Duración inválida. Usa un número entero de minutos mayor a 0.');
    }
  }

  const campos: string[] = [];
  const valores: (string | number | null)[] = [];

  if (cambios.nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(cambios.nombre.trim());
  }
  if (cambios.fechaPlanificada !== undefined) {
    campos.push('fecha_planificada = ?');
    valores.push(cambios.fechaPlanificada || null);
  }
  if (cambios.duracionEstimadaMinutos !== undefined) {
    campos.push('duracion_estimada_minutos = ?');
    valores.push(cambios.duracionEstimadaMinutos ?? null);
  }
  if (cambios.prioridad !== undefined) {
    campos.push('prioridad = ?');
    valores.push(cambios.prioridad ?? null);
  }

  if (campos.length === 0) {
    return;
  }

  valores.push(tareaId);
  await db.runAsync(
    `UPDATE tareas SET ${campos.join(', ')} WHERE id = ?`,
    ...valores
  );
}

export async function eliminarTarea(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM sesiones WHERE tarea_id = ?', id);
    await txn.runAsync('DELETE FROM tareas WHERE id = ?', id);
  });
}

export function esFechaValida(texto: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(texto);
}

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function esDuracionValida(texto: string): boolean {
  return /^\d+$/.test(texto) && parseInt(texto, 10) > 0;
}

export function formatearDuracion(minutos: number): string {
  return `${minutos} min`;
}

export function calcularDiferencia(
  estimado: number | null,
  real: number
): number | null {
  if (estimado === null) {
    return null;
  }
  return real - estimado;
}

export function formatearDiferencia(diferencia: number): string {
  if (diferencia === 0) {
    return '0 min';
  }
  const signo = diferencia > 0 ? '+' : '-';
  return `${signo}${Math.abs(diferencia)} min`;
}

export type InteraccionTarea = 'libre' | 'sesion_propia' | 'bloqueada';

export function puedeInteractuarConTarea(
  tareaId: number,
  sesionActiva: { tareaId: number } | null
): InteraccionTarea {
  if (!sesionActiva) {
    return 'libre';
  }
  if (sesionActiva.tareaId === tareaId) {
    return 'sesion_propia';
  }
  return 'bloqueada';
}