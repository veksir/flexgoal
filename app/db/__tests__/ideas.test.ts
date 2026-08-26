import {
  crearIdea,
  eliminarIdea,
  listarIdeas,
  type Idea,
} from '../ideas';
import { convertirIdeaEnMeta } from '../conversiones';
import { listarMetas } from '../metas';
import { crearDbPruebas, esperar } from './testDb';

describe('ideas', () => {
  test('crearIdea guarda y listarIdeas la devuelve', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Aprender a tocar guitarra');

    const ideas = await listarIdeas(db);

    expect(ideas).toHaveLength(1);
    expect(ideas[0].texto).toBe('Aprender a tocar guitarra');
  });

  test('listarIdeas ordena de más antigua a más reciente', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'primera');
    await esperar(5);
    await crearIdea(db, 'segunda');

    const ideas = await listarIdeas(db);

    expect(ideas.map((i) => i.texto)).toEqual(['primera', 'segunda']);
  });

  test('eliminarIdea borra solo la idea indicada', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'a borrar');
    await crearIdea(db, 'a conservar');
    const ideas = await listarIdeas(db);
    const aBorrar = ideas.find((i) => i.texto === 'a borrar') as Idea;

    await eliminarIdea(db, aBorrar.id);

    const restantes = await listarIdeas(db);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].texto).toBe('a conservar');
  });

  test('convertirIdeaEnMeta elimina la idea y crea la meta', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Meta de prueba');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea);

    const ideas = await listarIdeas(db);
    const metas = await listarMetas(db);
    expect(ideas).toHaveLength(0);
    expect(metas).toHaveLength(1);
    expect(metas[0].nombre).toBe('Meta de prueba');
    expect(metas[0].estado).toBe('activa');
  });

  test('convertirIdeaEnMeta es atómica: si algo falla no queda huérfana ni la idea ni la meta', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Meta que fallará al insertar');
    const [idea] = await listarIdeas(db);

    const ideaConTextoInvalido: Idea = {
      ...idea,
      texto: null as unknown as string,
    };

    await expect(convertirIdeaEnMeta(db, ideaConTextoInvalido)).rejects.toThrow();

    const ideas = await listarIdeas(db);
    const metas = await listarMetas(db);
    expect(ideas).toHaveLength(1);
    expect(metas).toHaveLength(0);
  });
});