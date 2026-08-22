import type { SQLiteDatabase } from 'expo-sqlite';

export interface BloqueDisponibilidad {
  id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export function nombreDia(dia: number): string {
  return DIAS_SEMANA[dia] ?? `Día ${dia}`;
}

function esHoraValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export async function agregarBloqueDisponibilidad(
  db: SQLiteDatabase,
  diaSemana: number,
  horaInicio: string,
  horaFin: string
): Promise<{ ok: boolean; error?: string }> {
  if (diaSemana < 0 || diaSemana > 6) {
    return { ok: false, error: 'Día de la semana inválido.' };
  }
  if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) {
    return { ok: false, error: 'Formato de hora inválido (use HH:MM).' };
  }
  if (horaInicio >= horaFin) {
    return {
      ok: false,
      error: 'La hora de fin debe ser posterior a la hora de inicio.',
    };
  }
  await db.runAsync(
    'INSERT INTO disponibilidad (dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?)',
    diaSemana,
    horaInicio,
    horaFin
  );
  return { ok: true };
}

export async function listarDisponibilidad(
  db: SQLiteDatabase
): Promise<BloqueDisponibilidad[]> {
  return db.getAllAsync<BloqueDisponibilidad>(
    'SELECT id, dia_semana, hora_inicio, hora_fin FROM disponibilidad ORDER BY dia_semana, hora_inicio'
  );
}

export async function eliminarBloqueDisponibilidad(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM disponibilidad WHERE id = ?', id);
}
