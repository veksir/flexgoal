// Puente seguro entre el proceso principal (Node, con acceso a
// safeStorage/filesystem) y el renderer (la app Next.js, sandboxed,
// sin acceso directo a Node). contextIsolation + este preload es lo
// que evita que una dependencia de terceros en el renderer pueda
// tocar el sistema de archivos.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flexgoalDesktop', {
  guardarClaveGemini: (clave) => ipcRenderer.invoke('gemini:guardar-clave', clave),
  obtenerClaveGemini: () => ipcRenderer.invoke('gemini:obtener-clave'),
  borrarClaveGemini: () => ipcRenderer.invoke('gemini:borrar-clave'),
});
