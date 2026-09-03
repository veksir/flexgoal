/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática: Electron carga los archivos generados
  // directamente desde disco (file://), sin correr un servidor Node
  // embebido. Por eso la integración con Gemini se hace desde el
  // cliente (fetch directo a la API de Google), no vía API routes de
  // Next.js — esas no existen en un export estático.
  output: 'export',
  // Electron sirve el export estático por un protocolo "app://"
  // propio con origen real (ver electron/main.js), así que las rutas
  // absolutas ("/_next/...") resuelven correctamente sin importar la
  // subruta activa. trailingSlash mantiene cada página en su propia
  // carpeta con index.html, que es la convención que usa el handler
  // del protocolo para resolver rutas sin extensión.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
