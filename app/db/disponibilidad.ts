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

export function normalizarHora(hora: string): string | null {
  const match = hora.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function horaAAuxiliar(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
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
  const inicio = normalizarHora(horaInicio);
  const fin = normalizarHora(horaFin);
  if (!inicio || !fin) {
    return { ok: false, error: 'Formato de hora inválido (use H:MM o HH:MM).' };
  }
  if (inicio >= fin) {
    return {
      ok: false,
      error: 'La hora de fin debe ser posterior a la hora de inicio.',
    };
  }
  const existentes = await db.getAllAsync<{ hora_inicio: string; hora_fin: string }>(
    'SELECT hora_inicio, hora_fin FROM disponibilidad WHERE dia_semana = ?',
    diaSemana
  );
  const inicioMin = horaAAuxiliar(inicio);
  const finMin = horaAAuxiliar(fin);
  for (const existente of existentes) {
    const eInicio = horaAAuxiliar(existente.hora_inicio);
    const eFin = horaAAuxiliar(existente.hora_fin);
    if (inicioMin < eFin && eInicio < finMin) {
      return {
        ok: false,
        error: `Se cruza con el bloque existente ${existente.hora_inicio}—${existente.hora_fin}.`,
      };
    }
  }
  await db.runAsync(
    'INSERT INTO disponibilidad (dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?)',
    diaSemana,
    inicio,
    fin
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
