/**
 * Integración con Gemini para generar estructura (objetivos + tareas)
 * a partir de una idea. Portado de la app móvil (ia/gemini.ts) al
 * modelo de datos de este diseño — misma estrategia de prompt, mismos
 * tipos de error, mismo timeout.
 *
 * La clave de API nunca se manda a ningún servidor propio: se guarda
 * localmente (cifrada con el llavero del sistema cuando corre dentro
 * de Electron) y las llamadas van directo del cliente a la API de
 * Google. No hay backend de flexgoal en el medio.
 */

const MODELO = 'gemini-3.6-flash'
const TIMEOUT_MS = 30000
const CLAVE_LOCALSTORAGE = 'flexgoal:gemini-key:v1'

export class ErrorClaveNoConfigurada extends Error {
  constructor() {
    super('No se configuró una clave de API de Gemini')
    this.name = 'ErrorClaveNoConfigurada'
  }
}

export class ErrorSinConexion extends Error {
  constructor() {
    super('No hay conexión a internet')
    this.name = 'ErrorSinConexion'
  }
}

export class ErrorRespuestaIA extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorRespuestaIA'
  }
}

/* ----------------------------------------------------------------
   Almacenamiento de la clave de API.
   Dentro de Electron: cifrada con el llavero del sistema operativo
   (ver electron/main.js, safeStorage). Fuera de Electron (dev en
   navegador con `npm run dev` sin `electron:dev`): localStorage, con
   la misma advertencia que ya mostraba la app — no hay forma de
   cifrar algo en el navegador sin backend propio.
   ---------------------------------------------------------------- */

function puenteDisponible(): boolean {
  return typeof window !== 'undefined' && Boolean(window.flexgoalDesktop)
}

export async function obtenerClaveAPI(): Promise<string | null> {
  if (puenteDisponible()) {
    return window.flexgoalDesktop!.obtenerClaveGemini()
  }
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CLAVE_LOCALSTORAGE)
}

export async function guardarClaveAPI(clave: string): Promise<void> {
  if (puenteDisponible()) {
    await window.flexgoalDesktop!.guardarClaveGemini(clave)
    return
  }
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CLAVE_LOCALSTORAGE, clave)
}

export async function borrarClaveAPI(): Promise<void> {
  if (puenteDisponible()) {
    await window.flexgoalDesktop!.borrarClaveGemini()
    return
  }
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CLAVE_LOCALSTORAGE)
}

/** true si la clave vive cifrada en el llavero del sistema (Electron),
 * false si vive en localStorage sin cifrar (dev en navegador). La UI
 * de Ajustes usa esto para mostrar la advertencia correcta. */
export function claveEstaCifrada(): boolean {
  return puenteDisponible()
}

/* ----------------------------------------------------------------
   Generación de estructura desde una idea.
   ---------------------------------------------------------------- */

export interface PropuestaTarea {
  titulo: string
  estimacionMin: number
}

export interface PropuestaObjetivo {
  titulo: string
  criterioExito: string
  tareas: PropuestaTarea[]
}

export interface PropuestaIA {
  objetivos: PropuestaObjetivo[]
}

export interface ConfiguracionIA {
  cantidadObjetivos: number
  tareasPorObjetivo: number
}

const CONFIGURACION_DEFAULT: ConfiguracionIA = {
  cantidadObjetivos: 3,
  tareasPorObjetivo: 3,
}

function promptEstructura(
  ideaTitulo: string,
  ideaNotas: string | undefined,
  config: ConfiguracionIA,
): string {
  return `Sos un experto en planificación de aprendizaje y proyectos. A partir de la siguiente idea, generá una estructura completa y realmente útil para lograrla.

Idea: ${ideaTitulo}
${ideaNotas ? `Contexto adicional: ${ideaNotas}` : ''}

Generá EXACTAMENTE ${config.cantidadObjetivos} objetivos concretos y medibles. Cada objetivo necesita un "criterioExito": una frase corta que describa cómo se sabe que el objetivo está listo (ejemplo: "Escalas mayores a 80 bpm sin trabarme"). Cada objetivo debe tener EXACTAMENTE ${config.tareasPorObjetivo} tareas específicas y accionables, cada una con una estimación realista en minutos (5 a 180).

Responde SOLO con un JSON válido, sin texto adicional ni bloques de código:
{
  "objetivos": [
    {
      "titulo": "Objetivo concreto y medible",
      "criterioExito": "Cómo se sabe que está listo",
      "tareas": [
        { "titulo": "Tarea específica con acción y recurso", "estimacionMin": 60 }
      ]
    }
  ]
}`
}

async function llamarGemini(clave: string, prompt: string): Promise<string> {
  let respuesta: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': clave,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorRespuestaIA('La IA tardó demasiado en responder')
    }
    throw new ErrorSinConexion()
  }

  if (!respuesta.ok) {
    if (respuesta.status === 403) throw new ErrorClaveNoConfigurada()
    let detalle = ''
    try {
      detalle = JSON.stringify(await respuesta.json())
    } catch {
      detalle = 'No se pudo leer el cuerpo del error'
    }
    throw new ErrorRespuestaIA(`Error ${respuesta.status}: ${detalle}`)
  }

  const datos = await respuesta.json()
  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!texto || typeof texto !== 'string') {
    throw new ErrorRespuestaIA('La IA no devolvió una respuesta válida')
  }
  return texto
}

function parsearPropuesta(texto: string, config: ConfiguracionIA): PropuestaIA {
  const limpio = texto.replace(/```json\s*|\s*```/g, '').trim()
  let json: unknown
  try {
    json = JSON.parse(limpio)
  } catch {
    throw new ErrorRespuestaIA('La IA no devolvió un JSON válido')
  }

  const objetivosRaw = (json as { objetivos?: unknown })?.objetivos
  if (!Array.isArray(objetivosRaw) || objetivosRaw.length === 0) {
    throw new ErrorRespuestaIA('La respuesta no tiene objetivos')
  }

  const objetivos: PropuestaObjetivo[] = objetivosRaw.slice(0, config.cantidadObjetivos + 2).map((o) => {
    const obj = o as Record<string, unknown>
    const tareasRaw = Array.isArray(obj.tareas) ? obj.tareas : []
    return {
      titulo: String(obj.titulo ?? 'Objetivo sin nombre'),
      criterioExito: String(obj.criterioExito ?? ''),
      tareas: tareasRaw.slice(0, config.tareasPorObjetivo + 2).map((t) => {
        const tarea = t as Record<string, unknown>
        const min = Number(tarea.estimacionMin)
        return {
          titulo: String(tarea.titulo ?? 'Tarea sin nombre'),
          estimacionMin: Number.isFinite(min) && min > 0 ? Math.round(min) : 30,
        }
      }),
    }
  })

  return { objetivos }
}

export async function generarEstructuraDesdeIdea(
  ideaTitulo: string,
  ideaNotas?: string,
  configuracion?: Partial<ConfiguracionIA>,
): Promise<PropuestaIA> {
  const clave = await obtenerClaveAPI()
  if (!clave) throw new ErrorClaveNoConfigurada()

  const config = { ...CONFIGURACION_DEFAULT, ...configuracion }
  const texto = await llamarGemini(clave, promptEstructura(ideaTitulo, ideaNotas, config))
  return parsearPropuesta(texto, config)
}

export async function corregirEstructura(
  ideaTitulo: string,
  propuestaActual: PropuestaIA,
  feedback: string,
  configuracion?: Partial<ConfiguracionIA>,
): Promise<PropuestaIA> {
  const clave = await obtenerClaveAPI()
  if (!clave) throw new ErrorClaveNoConfigurada()

  const config = { ...CONFIGURACION_DEFAULT, ...configuracion }
  const prompt = `Sos un experto en planificación. El usuario pide correcciones sobre una estructura previa.

Idea original: ${ideaTitulo}

ESTRUCTURA ACTUAL:
${JSON.stringify(propuestaActual, null, 2)}

CORRECCIÓN DEL USUARIO:
${feedback}

Reorganizá la estructura según el pedido, manteniendo el formato. Generá la misma cantidad de objetivos y tareas por objetivo que la estructura actual, salvo que el pedido del usuario indique explícitamente sumar o quitar.

Responde SOLO con un JSON válido, sin texto adicional:
{
  "objetivos": [
    { "titulo": "...", "criterioExito": "...", "tareas": [ { "titulo": "...", "estimacionMin": 60 } ] }
  ]
}`

  const texto = await llamarGemini(clave, prompt)
  return parsearPropuesta(texto, config)
}
