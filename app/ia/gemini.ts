import * as SecureStore from 'expo-secure-store';

const CLAVE_API_KEY = 'gemini_api_key';
const MODELO = 'gemini-3.6-flash';
const TIMEOUT_MS = 30000;

export interface PropuestaTarea {
  nombre: string;
  duracion_estimada_minutos?: number;
}

export interface PropuestaObjetivo {
  nombre: string;
  tareas: PropuestaTarea[];
}

export interface PropuestaIA {
  objetivos: PropuestaObjetivo[];
}

export class ErrorClaveNoConfigurada extends Error {
  constructor() {
    super('No se configuró una clave de API de Gemini');
    this.name = 'ErrorClaveNoConfigurada';
  }
}

export class ErrorSinConexion extends Error {
  constructor() {
    super('No hay conexión a internet');
    this.name = 'ErrorSinConexion';
  }
}

export class ErrorRespuestaIA extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorRespuestaIA';
  }
}

export async function obtenerClaveAPI(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_API_KEY);
}

export async function guardarClaveAPI(clave: string): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_API_KEY, clave);
}

export async function borrarClaveAPI(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_API_KEY);
}

export async function listarModelosDisponibles(): Promise<string> {
  const clave = await obtenerClaveAPI();
  if (!clave) return 'No hay clave configurada';

  try {
    const respuesta = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        headers: { 'x-goog-api-key': clave },
      }
    );
    if (!respuesta.ok) return `Error ${respuesta.status}`;
    const datos = await respuesta.json();
    const modelos = (datos.models || [])
      .map((m: { name: string }) => m.name.replace('models/', ''))
      .filter((n: string) => n.includes('flash') || n.includes('pro'))
      .join(', ');
    return modelos || 'No se encontraron modelos';
  } catch {
    return 'Error al conectar';
  }
}

export interface ConfiguracionIA {
  cantidadObjetivos: number;
  tareasPorObjetivo: number;
}

const CONFIGURACION_DEFAULT: ConfiguracionIA = {
  cantidadObjetivos: 4,
  tareasPorObjetivo: 3,
};

export async function generarEstructuraDesdeIdea(
  textoIdea: string,
  configuracion?: Partial<ConfiguracionIA>
): Promise<PropuestaIA> {
  const clave = await obtenerClaveAPI();
  if (!clave) {
    throw new ErrorClaveNoConfigurada();
  }

  const config = { ...CONFIGURACION_DEFAULT, ...configuracion };
  const { cantidadObjetivos, tareasPorObjetivo } = config;

  const prompt = `Sos un experto en planificación de aprendizaje y proyectos. A partir de la siguiente idea, generá una estructura completa y detallada que sea realmente útil para lograr el objetivo.

Idea: ${textoIdea}

Generá EXACTAMENTE ${cantidadObjetivos} objetivos concretos y medibles. Cada objetivo debe tener EXACTAMENTE ${tareasPorObjetivo} tareas ESPECÍFICAS y ACCIONABLES. Las tareas deben describir exactamente qué hacer, con qué herramientas o recursos.

Cada tarea debe incluir una estimación realista de tiempo en minutos. Ejemplos:
- Tutorial rápido: 30 min
- Práctica con ejercicios: 60-90 min
- Proyecto pequeño: 120-180 min
- Investigación profunda: 90-120 min

Responde SOLO con un JSON válido:
{
  "objetivos": [
    {
      "nombre": "Objetivo concreto y medible",
      "tareas": [
        { "nombre": "Tarea específica con acción y recurso", "duracion_estimada_minutos": 60 }
      ]
    }
  ]
}`;

  let respuesta: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clave,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorRespuestaIA('La IA tardó demasiado en responder');
    }
    throw new ErrorSinConexion();
  }

  if (!respuesta.ok) {
    let detalle = '';
    try {
      const errorBody = await respuesta.json();
      detalle = JSON.stringify(errorBody);
    } catch {
      detalle = 'No se pudo leer el cuerpo del error';
    }
    if (respuesta.status === 400) {
      throw new ErrorRespuestaIA(`Solicitud inválida (400): ${detalle}`);
    }
    if (respuesta.status === 403) {
      throw new ErrorClaveNoConfigurada();
    }
    if (respuesta.status === 404) {
      throw new ErrorRespuestaIA(`Modelo no encontrado (404): ${detalle}`);
    }
    throw new ErrorRespuestaIA(`Error ${respuesta.status}: ${detalle}`);
  }

  const datos = await respuesta.json();
  const textoRespuesta =
    datos?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoRespuesta || typeof textoRespuesta !== 'string') {
    throw new ErrorRespuestaIA('La IA no devolvió una respuesta válida');
  }

  return parsearRespuesta(textoRespuesta, config);
}

export async function corregirEstructura(
  textoIdea: string,
  propuestaActual: PropuestaIA,
  feedback: string,
  configuracion?: Partial<ConfiguracionIA>
): Promise<PropuestaIA> {
  const clave = await obtenerClaveAPI();
  if (!clave) {
    throw new ErrorClaveNoConfigurada();
  }

  const config = { ...CONFIGURACION_DEFAULT, ...configuracion };
  const { tareasPorObjetivo } = config;

  const prompt = `Sos un experto en planificación. El usuario te pide correcciones sobre una estructura previa.

Idea original: ${textoIdea}

ESTRUCTURA ACTUAL:
${JSON.stringify(propuestaActual, null, 2)}

CORRECCIÓN DEL USUARIO:
${feedback}

Reorganizá la estructura según el pedido del usuario. Mantené los objetivos y tareas que el usuario marcó como aceptados (si los hay). Generá EXACTAMENTE la misma cantidad de objetivos y tareas por objetivo que la estructura actual.

Cada tarea debe incluir duracion_estimada_minutos.

Responde SOLO con un JSON válido:
{
  "objetivos": [
    {
      "nombre": "Objetivo concreto y medible",
      "tareas": [
        { "nombre": "Tarea específica", "duracion_estimada_minutos": 60 }
      ]
    }
  ]
}`;

  let respuesta: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clave,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorRespuestaIA('La IA tardó demasiado en responder');
    }
    throw new ErrorSinConexion();
  }

  if (!respuesta.ok) {
    let detalle = '';
    try {
      const errorBody = await respuesta.json();
      detalle = JSON.stringify(errorBody);
    } catch {
      detalle = 'No se pudo leer el cuerpo del error';
    }
    if (respuesta.status === 400) {
      throw new ErrorRespuestaIA(`Solicitud inválida (400): ${detalle}`);
    }
    if (respuesta.status === 403) {
      throw new ErrorClaveNoConfigurada();
    }
    if (respuesta.status === 404) {
      throw new ErrorRespuestaIA(`Modelo no encontrado (404): ${detalle}`);
    }
    throw new ErrorRespuestaIA(`Error ${respuesta.status}: ${detalle}`);
  }

  const datos = await respuesta.json();
  const textoRespuesta =
    datos?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoRespuesta || typeof textoRespuesta !== 'string') {
    throw new ErrorRespuestaIA('La IA no devolvió una respuesta válida');
  }

  return parsearRespuesta(textoRespuesta, config);
}

function parsearRespuesta(texto: string, configuracion?: ConfiguracionIA): PropuestaIA {
  const config = { ...CONFIGURACION_DEFAULT, ...configuracion };
  const { cantidadObjetivos, tareasPorObjetivo } = config;

  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new ErrorRespuestaIA('La respuesta de la IA no contiene JSON válido');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new ErrorRespuestaIA('La respuesta de la IA no es JSON válido');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as Record<string, unknown>).objetivos)
  ) {
    throw new ErrorRespuestaIA('La respuesta no tiene la estructura esperada');
  }

  const objetivos = (parsed as Record<string, unknown>)
    .objetivos as Array<Record<string, unknown>>;

  if (objetivos.length < 1 || objetivos.length > cantidadObjetivos + 2) {
    throw new ErrorRespuestaIA(
      `Se esperaban hasta ${cantidadObjetivos} objetivos, la IA devolvió ${objetivos.length}`
    );
  }

  const objetivosValidados: PropuestaObjetivo[] = [];

  for (const obj of objetivos) {
    if (!obj.nombre || typeof obj.nombre !== 'string' || !obj.nombre.trim()) {
      throw new ErrorRespuestaIA('Un objetivo no tiene nombre válido');
    }
    if (!Array.isArray(obj.tareas) || obj.tareas.length < 1 || obj.tareas.length > tareasPorObjetivo + 2) {
      throw new ErrorRespuestaIA(
        `El objetivo "${obj.nombre}" debe tener hasta ${tareasPorObjetivo} tareas`
      );
    }
    const tareasValidadas: PropuestaTarea[] = [];
    for (const tarea of obj.tareas) {
      if (!tarea.nombre || typeof tarea.nombre !== 'string' || !tarea.nombre.trim()) {
        throw new ErrorRespuestaIA('Una tarea no tiene nombre válido');
      }
      const tareaValidada: PropuestaTarea = {
        nombre: (tarea.nombre as string).trim(),
      };
      if (typeof tarea.duracion_estimada_minutos === 'number' && tarea.duracion_estimada_minutos > 0) {
        tareaValidada.duracion_estimada_minutos = Math.round(tarea.duracion_estimada_minutos);
      }
      tareasValidadas.push(tareaValidada);
    }
    objetivosValidados.push({
      nombre: (obj.nombre as string).trim(),
      tareas: tareasValidadas,
    });
  }

  return { objetivos: objetivosValidados };
}
