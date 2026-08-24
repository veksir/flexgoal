import type { SQLiteDatabase } from 'expo-sqlite';
import type { Tarea } from './tareas';
import { nombreDia } from './disponibilidad';

export interface DiaCarga {
  fecha: string;
  diaSemana: number;
  nombreDia: string;
  tareas: Tarea[];
  minutosPlanificados: number;
  minutosDisponibles: number;
  diferencia: number;
  estaSobrecargado: boolean;
}

function fechaADiaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  return d.getDay();
}

function horasAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function semanaDesde(fechaInicio: string): string[] {
  const [anio, mes, dia] = fechaInicio.split('-').map(Number);
  const base = new Date(anio, mes - 1, dia);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  });
}

export function inicioDeSemana(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  const diff = d.getDay();
  d.setDate(d.getDate() - diff);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function calcularCargaDia(
  db: SQLiteDatabase,
  fecha: string
): Promise<DiaCarga> {
  const diaSemana = fechaADiaSemana(fecha);

  const tareas = await db.getAllAsync<Tarea>(
    `SELECT id, objetivo_id, nombre, estado, fecha_planificada,
            duracion_estimada_minutos, prioridad, creado_en
     FROM tareas
     WHERE fecha_planificada = ? AND estado = 'pendiente'`,
    fecha
  );

  let minutosPlanificados = 0;
  for (const tarea of tareas) {
    if (tarea.duracion_estimada_minutos != null) {
      minutosPlanificados += tarea.duracion_estimada_minutos;
    }
  }

  const bloques = await db.getAllAsync<{ hora_inicio: string; hora_fin: string }>(
    'SELECT hora_inicio, hora_fin FROM disponibilidad WHERE dia_semana = ?',
    diaSemana
  );

  let minutosDisponibles = 0;
  for (const bloque of bloques) {
    minutosDisponibles +=
      horasAMinutos(bloque.hora_fin) - horasAMinutos(bloque.hora_inicio);
  }

  const diferencia = minutosPlanificados - minutosDisponibles;

  return {
    fecha,
    diaSemana,
    nombreDia: nombreDia(diaSemana),
    tareas,
    minutosPlanificados,
    minutosDisponibles,
    diferencia,
    estaSobrecargado: minutosDisponibles > 0 && diferencia > 0,
  };
}

export async function calcularCargaSemana(
  db: SQLiteDatabase,
  fechaInicio: string
): Promise<DiaCarga[]> {
  const fechas = semanaDesde(fechaInicio);
  const resultados: DiaCarga[] = [];
  for (const fecha of fechas) {
    resultados.push(await calcularCargaDia(db, fecha));
  }
  return resultados;
}

export interface VistaPreviaSobrecarga {
  minutosPlanificados: number;
  minutosDisponibles: number;
  diferencia: number;
  estaSobrecargado: boolean;
}

export async function calcularVistaPreviaSobrecarga(
  db: SQLiteDatabase,
  fecha: string,
  minutosAdicionales: number,
  excluirTareaId?: number
): Promise<VistaPreviaSobrecarga> {
  const carga = await calcularCargaDia(db, fecha);

  let minutosPlanificados = carga.minutosPlanificados;

  if (excluirTareaId != null) {
    const tareaExistente = carga.tareas.find((t) => t.id === excluirTareaId);
    if (tareaExistente && tareaExistente.duracion_estimada_minutos != null) {
      minutosPlanificados -= tareaExistente.duracion_estimada_minutos;
    }
  }

  minutosPlanificados += minutosAdicionales;
  const diferencia = minutosPlanificados - carga.minutosDisponibles;

  return {
    minutosPlanificados,
    minutosDisponibles: carga.minutosDisponibles,
    diferencia,
    estaSobrecargado: carga.minutosDisponibles > 0 && diferencia > 0,
  };
}
