import {
  agregarBloqueDisponibilidad,
  listarDisponibilidad,
  eliminarBloqueDisponibilidad,
} from '../disponibilidad';
import { crearDbPruebas } from './testDb';

describe('disponibilidad', () => {
  test('agregarBloqueDisponibilidad guarda un bloque válido', async () => {
    const db = crearDbPruebas();

    const resultado = await agregarBloqueDisponibilidad(db, 1, '09:00', '12:00');

    expect(resultado.ok).toBe(true);
    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(1);
    expect(bloques[0].dia_semana).toBe(1);
    expect(bloques[0].hora_inicio).toBe('09:00');
    expect(bloques[0].hora_fin).toBe('12:00');
  });

  test('agregarBloqueDisponibilidad rechaza hora_fin <= hora_inicio', async () => {
    const db = crearDbPruebas();

    const r1 = await agregarBloqueDisponibilidad(db, 1, '20:00', '18:00');
    expect(r1.ok).toBe(false);
    expect(r1.error).toContain('fin debe ser posterior');

    const r2 = await agregarBloqueDisponibilidad(db, 1, '18:00', '18:00');
    expect(r2.ok).toBe(false);

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(0);
  });

  test('agregarBloqueDisponibilidad rechaza formato de hora inválido', async () => {
    const db = crearDbPruebas();

    const r1 = await agregarBloqueDisponibilidad(db, 1, 'abc', '12:00');
    expect(r1.ok).toBe(false);
    expect(r1.error).toContain('Formato');

    const r2 = await agregarBloqueDisponibilidad(db, 1, '09:00', '25:00');
    expect(r2.ok).toBe(false);

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(0);
  });

  test('agregarBloqueDisponibilidad rechaza día de semana inválido', async () => {
    const db = crearDbPruebas();

    const r = await agregarBloqueDisponibilidad(db, 7, '09:00', '12:00');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Día');
  });

  test('múltiples bloques en el mismo día coexisten', async () => {
    const db = crearDbPruebas();

    await agregarBloqueDisponibilidad(db, 1, '09:00', '12:00');
    await agregarBloqueDisponibilidad(db, 1, '18:00', '21:00');

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(2);
    expect(bloques[0].hora_inicio).toBe('09:00');
    expect(bloques[1].hora_inicio).toBe('18:00');
  });

  test('listarDisponibilidad ordena por día y luego por hora', async () => {
    const db = crearDbPruebas();

    await agregarBloqueDisponibilidad(db, 3, '18:00', '20:00');
    await agregarBloqueDisponibilidad(db, 1, '09:00', '12:00');
    await agregarBloqueDisponibilidad(db, 1, '14:00', '16:00');

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(3);
    expect(bloques[0].dia_semana).toBe(1);
    expect(bloques[0].hora_inicio).toBe('09:00');
    expect(bloques[1].dia_semana).toBe(1);
    expect(bloques[1].hora_inicio).toBe('14:00');
    expect(bloques[2].dia_semana).toBe(3);
  });

  test('eliminarBloqueDisponibilidad borra el bloque correctamente', async () => {
    const db = crearDbPruebas();

    await agregarBloqueDisponibilidad(db, 1, '09:00', '12:00');
    await agregarBloqueDisponibilidad(db, 1, '18:00', '21:00');
    const bloques = await listarDisponibilidad(db);

    await eliminarBloqueDisponibilidad(db, bloques[0].id);

    const restantes = await listarDisponibilidad(db);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].hora_inicio).toBe('18:00');
  });

  test('listarDisponibilidad retorna lista vacía si no hay bloques', async () => {
    const db = crearDbPruebas();

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toEqual([]);
  });

  test('bloques en días diferentes coexisten', async () => {
    const db = crearDbPruebas();

    await agregarBloqueDisponibilidad(db, 1, '09:00', '12:00');
    await agregarBloqueDisponibilidad(db, 5, '14:00', '18:00');
    await agregarBloqueDisponibilidad(db, 0, '10:00', '13:00');

    const bloques = await listarDisponibilidad(db);
    expect(bloques).toHaveLength(3);
  });
});
