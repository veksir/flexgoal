import { crearMeta, listarMetas } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearTarea } from '../tareas';
import { agregarBloqueDisponibilidad } from '../disponibilidad';
import {
  calcularCargaDia,
  calcularCargaSemana,
  calcularVistaPreviaSobrecarga,
  inicioDeSemana,
} from '../carga';
import { crearDbPruebas } from './testDb';

async function prepararDatos(db: ReturnType<typeof crearDbPruebas>) {
  await crearMeta(db, 'Meta test');
  const [meta] = await listarMetas(db);
  await crearObjetivo(db, meta.id, 'Objetivo test');
  const [objetivo] = await listarObjetivosPorMeta(db, meta.id);
  return { metaId: meta.id, objetivoId: objetivo.id };
}

function diaDeLaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

describe('inicioDeSemana', () => {
  test('retorna el domingo de la semana de la fecha dada', () => {
    expect(inicioDeSemana('2026-08-21')).toBe('2026-08-16');
    expect(inicioDeSemana('2026-08-16')).toBe('2026-08-16');
    expect(inicioDeSemana('2026-08-22')).toBe('2026-08-16');
  });
});

describe('calcularCargaDia', () => {
  test('dia sin tareas ni disponibilidad retorna 0 en todo', async () => {
    const db = crearDbPruebas();

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.tareas).toHaveLength(0);
    expect(carga.minutosPlanificados).toBe(0);
    expect(carga.minutosDisponibles).toBe(0);
    expect(carga.diferencia).toBe(0);
  });

  test('suma duracion_estimada de tareas planificadas ese dia', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Tarea 1', '2026-08-21', 60);
    await crearTarea(db, objetivoId, 'Tarea 2', '2026-08-21', 90);

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.tareas).toHaveLength(2);
    expect(carga.minutosPlanificados).toBe(150);
  });

  test('tareas sin duracion estimada no se incluyen en el total', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Con estimación', '2026-08-21', 60);
    await crearTarea(db, objetivoId, 'Sin estimación', '2026-08-21');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.tareas).toHaveLength(2);
    expect(carga.minutosPlanificados).toBe(60);
  });

  test('tareas completadas no se incluyen', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Pendiente', '2026-08-21', 60);
    const tareaCompletada = await crearTarea(db, objetivoId, 'Completada', '2026-08-21', 30);
    await db.runAsync("UPDATE tareas SET estado = 'completada' WHERE nombre = 'Completada'");

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.tareas).toHaveLength(1);
    expect(carga.minutosPlanificados).toBe(60);
  });

  test('suma bloques de disponibilidad del dia de la semana', async () => {
    const db = crearDbPruebas();
    const diaSemana = diaDeLaSemana('2026-08-21');

    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');
    await agregarBloqueDisponibilidad(db, diaSemana, '14:00', '17:00');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.minutosDisponibles).toBe(360);
  });

  test('tareas en otro dia no se incluyen', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Otro dia', '2026-08-22', 60);

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.tareas).toHaveLength(0);
    expect(carga.minutosPlanificados).toBe(0);
  });

  test('disponibilidad en otro dia de la semana no se incluye', async () => {
    const db = crearDbPruebas();
    const otroDia = (diaDeLaSemana('2026-08-21') + 1) % 7;

    await agregarBloqueDisponibilidad(db, otroDia, '09:00', '12:00');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.minutosDisponibles).toBe(0);
  });

  test('diferencia es planificado menos disponible', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Tarea', '2026-08-21', 300);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.minutosPlanificados).toBe(300);
    expect(carga.minutosDisponibles).toBe(180);
    expect(carga.diferencia).toBe(120);
  });
});

describe('calcularCargaSemana', () => {
  test('retorna 7 dias con datos correctos', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Lunes', '2026-08-17', 60);
    await crearTarea(db, objetivoId, 'Martes', '2026-08-18', 90);

    const resultado = await calcularCargaSemana(db, '2026-08-16');

    expect(resultado).toHaveLength(7);
    expect(resultado[0].fecha).toBe('2026-08-16');
    expect(resultado[1].fecha).toBe('2026-08-17');
    expect(resultado[1].minutosPlanificados).toBe(60);
    expect(resultado[2].fecha).toBe('2026-08-18');
    expect(resultado[2].minutosPlanificados).toBe(90);
  });

  test('dias sin datos tienen totales en 0', async () => {
    const db = crearDbPruebas();

    const resultado = await calcularCargaSemana(db, '2026-08-16');

    for (const dia of resultado) {
      expect(dia.minutosPlanificados).toBe(0);
      expect(dia.minutosDisponibles).toBe(0);
    }
  });

  test('estaSobrecargado es true cuando hay disponibilidad y se excede', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Tarea', '2026-08-21', 300);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.estaSobrecargado).toBe(true);
  });

  test('estaSobrecargado es false cuando no se excede la disponibilidad', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Tarea', '2026-08-21', 120);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.estaSobrecargado).toBe(false);
  });

  test('estaSobrecargado es false cuando no hay disponibilidad declarada', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Tarea', '2026-08-21', 300);

    const carga = await calcularCargaDia(db, '2026-08-21');

    expect(carga.estaSobrecargado).toBe(false);
  });

  test('calcularCargaSemana incluye estaSobrecargado', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-17');

    await crearTarea(db, objetivoId, 'Tarea', '2026-08-17', 300);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');

    const resultado = await calcularCargaSemana(db, '2026-08-16');

    expect(resultado[1].estaSobrecargado).toBe(true);
  });
});

describe('calcularVistaPreviaSobrecarga', () => {
  test('sin disponibilidad declarada nunca marca sobrecarga', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);

    await crearTarea(db, objetivoId, 'Existente', '2026-08-21', 60);

    const resultado = await calcularVistaPreviaSobrecarga(db, '2026-08-21', 120);

    expect(resultado.estaSobrecargado).toBe(false);
    expect(resultado.minutosDisponibles).toBe(0);
  });

  test('con disponibilidad, suma minutos adicionales y detecta sobrecarga', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Existente', '2026-08-21', 120);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '11:00');

    const resultado = await calcularVistaPreviaSobrecarga(db, '2026-08-21', 60);

    expect(resultado.minutosPlanificados).toBe(180);
    expect(resultado.minutosDisponibles).toBe(120);
    expect(resultado.diferencia).toBe(60);
    expect(resultado.estaSobrecargado).toBe(true);
  });

  test('con disponibilidad, sin exceder no marca sobrecarga', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Existente', '2026-08-21', 60);
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '12:00');

    const resultado = await calcularVistaPreviaSobrecarga(db, '2026-08-21', 60);

    expect(resultado.minutosPlanificados).toBe(120);
    expect(resultado.minutosDisponibles).toBe(180);
    expect(resultado.estaSobrecargado).toBe(false);
  });

  test('excluirTareaId resta la contribución de esa tarea', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await crearTarea(db, objetivoId, 'Original', '2026-08-21', 120);
    const [tarea] = await db.getAllAsync<{ id: number }>(
      "SELECT id FROM tareas WHERE nombre = 'Original'"
    );
    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '11:00');

    const resultado = await calcularVistaPreviaSobrecarga(
      db,
      '2026-08-21',
      30,
      tarea.id
    );

    expect(resultado.minutosPlanificados).toBe(30);
    expect(resultado.minutosDisponibles).toBe(120);
    expect(resultado.estaSobrecargado).toBe(false);
  });

  test('excluirTareaId sin tarea existente solo suma los adicionales', async () => {
    const db = crearDbPruebas();
    const diaSemana = diaDeLaSemana('2026-08-21');

    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '11:00');

    const resultado = await calcularVistaPreviaSobrecarga(
      db,
      '2026-08-21',
      60,
      9999
    );

    expect(resultado.minutosPlanificados).toBe(60);
    expect(resultado.minutosDisponibles).toBe(120);
    expect(resultado.estaSobrecargado).toBe(false);
  });

  test('limite exacto sin exceder no marca sobrecarga', async () => {
    const db = crearDbPruebas();
    const { objetivoId } = await prepararDatos(db);
    const diaSemana = diaDeLaSemana('2026-08-21');

    await agregarBloqueDisponibilidad(db, diaSemana, '09:00', '11:00');

    const resultado = await calcularVistaPreviaSobrecarga(db, '2026-08-21', 120);

    expect(resultado.minutosPlanificados).toBe(120);
    expect(resultado.minutosDisponibles).toBe(120);
    expect(resultado.diferencia).toBe(0);
    expect(resultado.estaSobrecargado).toBe(false);
  });
});
