// Declaración de tipos para el puente expuesto por electron/preload.js.
// En desarrollo dentro del navegador (npm run dev sin Electron),
// `window.flexgoalDesktop` no existe — el código que lo usa siempre
// debe verificar con `typeof window !== 'undefined' && window.flexgoalDesktop`
// antes de llamarlo, y tener un fallback (ver lib/flexgoal/ia.ts).
export interface FlexgoalDesktopBridge {
  guardarClaveGemini: (clave: string) => Promise<true>
  obtenerClaveGemini: () => Promise<string | null>
  borrarClaveGemini: () => Promise<true>
}

declare global {
  interface Window {
    flexgoalDesktop?: FlexgoalDesktopBridge
  }
}

export {}
