import { crearIdea, listarIdeas } from '../ideas';
import { convertirIdeaEnMeta, type PropuestaEstructura } from '../conversiones';
import { listarMetas } from '../metas';
import { listarObjetivosPorMeta } from '../objetivos';
import { listarTareasPorObjetivo } from '../tareas';
import { crearDbPruebas } from './testDb';

describe('convertirIdeaEnMeta con propuesta IA', () => {
  test('con propuesta IA crea meta, objetivos y tareas correctamente', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Aprender guitarra');
    const [idea] = await listarIdeas(db);

    const propuesta: PropuestaEstructura = {
      objetivos: [
        { nombre: 'Fundamentos', tareas: [{ nombre: 'Investigar recursos' }] },
        { nombre: 'Práctica', tareas: [{ nombre: 'Definir horario' }] },
      ],
    };

    await convertirIdeaEnMeta(db, idea, undefined, propuesta);

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);
    expect(metas[0].nombre).toBe('Aprender guitarra');

    const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
    expect(objetivos).toHaveLength(2);

    for (const obj of objetivos) {
      const tareas = await listarTareasPorObjetivo(db, obj.id);
      expect(tareas).toHaveLength(1);
      expect(tareas[0].estado).toBe('pendiente');
    }
  });

  test('propuesta IA con múltiples tareas por objetivo', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Proyecto app');
    const [idea] = await listarIdeas(db);

    const propuesta: PropuestaEstructura = {
      objetivos: [
        {
          nombre: 'Planificación',
          tareas: [{ nombre: 'Definir alcance' }, { nombre: 'Hacer wireframe' }],
        },
        {
          nombre: 'Desarrollo',
          tareas: [{ nombre: 'Configurar entorno' }, { nombre: 'Crear DB' }, { nombre: 'API' }],
        },
      ],
    };

    await convertirIdeaEnMeta(db, idea, undefined, propuesta);

    const [meta] = await listarMetas(db);
    const objetivos = await listarObjetivosPorMeta(db, meta.id);
    expect(objetivos).toHaveLength(2);

    const planificacion = objetivos.find((o) => o.nombre === 'Planificación');
    const desarrollo = objetivos.find((o) => o.nombre === 'Desarrollo');

    const tareasPlan = await listarTareasPorObjetivo(db, planificacion!.id);
    const tareasDes = await listarTareasPorObjetivo(db, desarrollo!.id);

    expect(tareasPlan).toHaveLength(2);
    expect(tareasDes).toHaveLength(3);
  });

  test('propuesta IA borra la idea de la bandeja', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Idea a borrar');
    const [idea] = await listarIdeas(db);

    const propuesta: PropuestaEstructura = {
      objetivos: [
        { nombre: 'Paso 1', tareas: [{ nombre: 'Hacer algo' }] },
        { nombre: 'Paso 2', tareas: [{ nombre: 'Hacer otra cosa' }] },
      ],
    };

    await convertirIdeaEnMeta(db, idea, undefined, propuesta);

    const ideas = await listarIdeas(db);
    expect(ideas).toHaveLength(0);
  });

  test('propuesta IA con 0 objetivos crea meta vacía (degradación graceful)', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Idea sin objetivos');
    const [idea] = await listarIdeas(db);

    const propuestaVacia = {
      objetivos: [],
    } as unknown as PropuestaEstructura;

    await convertirIdeaEnMeta(db, idea, undefined, propuestaVacia);

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);

    const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
    expect(objetivos).toHaveLength(0);

    const ideas = await listarIdeas(db);
    expect(ideas).toHaveLength(0);
  });

  test('sin propuesta ni plantilla crea meta vacía', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Meta vacía');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea);

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);

    const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
    expect(objetivos).toHaveLength(0);
  });
});
