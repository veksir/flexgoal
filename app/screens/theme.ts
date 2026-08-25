// Sistema de diseño de Flexgoal.
//
// Objetivo: dar una base consistente de espaciado, radios y elevación para
// que toda la app se sienta como un producto único y moderno, sin introducir
// una paleta de color nueva ni cambiar la tipografía (se respeta la fuente
// del sistema y los tamaños ya definidos). Todos los colores de aquí son los
// que la app ya usaba, simplemente centralizados para no repetir literales
// de color sueltos por archivo.

export const color = {
  // Neutros
  fondo: '#fff',
  fondoSutil: '#f8f9fa',
  fondoTab: '#f1f3f5',
  borde: '#eee',
  bordeFuerte: '#ced4da',
  bordeInput: '#ccc',
  textoPrimario: '#1a1a1a',
  textoSecundario: '#495057',
  textoTerciario: '#666',
  textoDeshabilitado: '#999',
  textoInactivo: '#888',
  overlay: 'rgba(0, 0, 0, 0.5)',
  sombra: '#000',

  // Semánticos (ya presentes en la app original)
  primario: '#1c7ed6',
  primarioOscuro: '#1971c2',
  primarioSuave: '#e7f5ff',
  exito: '#2b8a3e',
  peligro: '#e03131',
  peligroSuave: '#fff0f0',
  advertencia: '#e8590c',
  advertenciaSuave: '#fff4e6',
  oscuro: '#333',
} as const;

export const espacio = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  completo: 999,
} as const;

// Elevación consistente para tarjetas y superficies flotantes (modales,
// barra inferior, botón flotante). Usa negro a baja opacidad: no es un color
// nuevo del sistema, es la sombra estándar de Material/iOS.
export const sombraTarjeta = {
  shadowColor: color.sombra,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
} as const;

export const sombraFlotante = {
  shadowColor: color.sombra,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
} as const;

export const sombraSuave = {
  shadowColor: color.sombra,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
} as const;

export const toqueMinimo = 44;
