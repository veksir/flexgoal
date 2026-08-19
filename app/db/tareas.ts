import { getDb } from './database';

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

export async function crearTarea(
  objetivoId: number,
  nombre: string,
  fechaPlanificada?: string,
  duracionEstimadaMinutos?: number
): Promise<void> {
  const db = await getDb();
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

export async function listarTareasPorObjetivo(objetivoId: number): Promise<Tarea[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Tarea>(
    'SELECT id, objetivo_id, nombre, estado, fecha_planificada, duracion_estimada_minutos, creado_en FROM tareas WHERE objetivo_id = ? ORDER BY creado_en DESC',
    objetivoId
  );
  return rows;
}

export async function alternarEstadoTarea(
  tareaId: number,
  nuevoEstado: EstadoTarea
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tareas SET estado = ? WHERE id = ?', nuevoEstado, tareaId);
}

export async function eliminarTarea(id: number): Promise<void> {
  const db = await getDb();
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
