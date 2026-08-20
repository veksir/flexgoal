import type { SQLiteDatabase } from 'expo-sqlite';

export type EstadoTarea = 'pendiente' | 'completada';

export interface Tarea {
  id: number;
  objetivo_id: number;
  nombre: string;
  estado: EstadoTarea;
  fecha_planificada: string | null;
  duracion_estimada_minutos: number | null;
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
  duracionEstimadaMinutos?: number
): Promise<void> {
  await db.runAsync(
    'INSERT INTO tareas (objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, creado_en) VALUES (?, ?, ?, ?, ?, ?)',
    objetivoId,
    nombre,
    'pendiente',
    fechaPlanificada ?? null,
    duracionEstimadaMinutos ?? null,
    new Date().toISOString()
  );
}

export async function listarTareasPorObjetivo(
  db: SQLiteDatabase,
  objetivoId: number
): Promise<Tarea[]> {
  const rows = await db.getAllAsync<Tarea>(
    'SELECT id, objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, creado_en FROM tareas WHERE objetivo_id = ? ORDER BY creado_en DESC',
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