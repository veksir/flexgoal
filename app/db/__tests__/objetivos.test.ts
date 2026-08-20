import { crearMeta, listarMetas, type Meta } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import { crearDbPruebas, esperar } from './testDb';

async function crearMetaAyudante(
  db: Awaited<ReturnType<typeof crearDbPruebas>>,
  nombre: string
): Promise<Meta> {
  await crearMeta(db, nombre);
  const metas = await listarMetas(db);
  return metas.find((m) => m.nombre === nombre) as Meta;
}

describe('objetivos', () => {
  test('crearObjetivo guarda un objetivo dentro de su meta', async () => {
    const db = crearDbPruebas();
    const meta = await crearMetaAyudante(db, 'Meta con objetivo');

    await crearObjetivo(db, meta.id, 'Objetivo uno');

    const objetivos = await listarObjetivosPorMeta(db, meta.id);
    expect(objetivos).toHaveLength(1);
    expect(objetivos[0].nombre).toBe('Objetivo uno');
    expect(objetivos[0].meta_id).toBe(meta.id);
  });

  test('objetivos de metas distintas no se mezclan', async () => {
    const db = crearDbPruebas();
    const metaA = await crearMetaAyudante(db, 'Meta A');
    await esperar(5);
    const metaB = await crearMetaAyudante(db, 'Meta B');

    await crearObjetivo(db, metaA.id, 'Objetivo de A');
    await crearObjetivo(db, metaA.id, 'Otro de A');
    await crearObjetivo(db, metaB.id, 'Objetivo de B');

    const objetivosA = await listarObjetivosPorMeta(db, metaA.id);
    const objetivosB = await listarObjetivosPorMeta(db, metaB.id);

    expect(objetivosA).toHaveLength(2);
    expect(objetivosA.map((o) => o.nombre)).toEqual(
      expect.arrayContaining(['Objetivo de A', 'Otro de A'])
    );
    expect(objetivosB).toHaveLength(1);
    expect(objetivosB[0].nombre).toBe('Objetivo de B');
  });

  test('listarObjetivosPorMeta devuelve lista vacía si la meta no tiene objetivos', async () => {
    const db = crearDbPruebas();
    const meta = await crearMetaAyudante(db, 'Meta sin objetivos');

    const objetivos = await listarObjetivosPorMeta(db, meta.id);

    expect(objetivos).toHaveLength(0);
  });
});