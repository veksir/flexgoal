import { actualizarEstadoMeta, crearMeta, listarMetas } from '../metas';
import { crearDbPruebas, esperar } from './testDb';

describe('metas', () => {
  test('crearMeta guarda con estado activa por defecto', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'Meta nueva');

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);
    expect(metas[0].nombre).toBe('Meta nueva');
    expect(metas[0].estado).toBe('activa');
  });

  test('listarMetas ordena de más reciente a más antigua', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'primera');
    await esperar(5);
    await crearMeta(db, 'segunda');

    const metas = await listarMetas(db);

    expect(metas.map((m) => m.nombre)).toEqual(['segunda', 'primera']);
  });

  test('actualizarEstadoMeta cambia el estado de una meta', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'Meta que pausaré');
    const [meta] = await listarMetas(db);

    await actualizarEstadoMeta(db, meta.id, 'pausada');

    const [actualizada] = await listarMetas(db);
    expect(actualizada.estado).toBe('pausada');
  });

  test('actualizarEstadoMeta no afecta a otras metas', async () => {
    const db = crearDbPruebas();
    await crearMeta(db, 'meta uno');
    await esperar(5);
    await crearMeta(db, 'meta dos');
    const metas = await listarMetas(db);
    const metaUno = metas.find((m) => m.nombre === 'meta uno') as {
      id: number;
    };
    const metaDos = metas.find((m) => m.nombre === 'meta dos') as {
      id: number;
    };

    await actualizarEstadoMeta(db, metaUno.id, 'completada');

    const metasFinales = await listarMetas(db);
    expect(metasFinales.find((m) => m.id === metaUno.id)?.estado).toBe(
      'completada'
    );
    expect(metasFinales.find((m) => m.id === metaDos.id)?.estado).toBe(
      'activa'
    );
  });
});