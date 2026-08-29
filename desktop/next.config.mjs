/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática: Electron carga los archivos generados
  // directamente desde disco (file://), sin correr un servidor Node
  // embebido. Por eso la integración con Gemini se hace desde el
  // cliente (fetch directo a la API de Google), no vía API routes de
  // Next.js — esas no existen en un export estático.
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
