// Proceso principal de Electron.
//
// La app es 100% local: no hay servidor propio. En producción carga
// los archivos estáticos generados por `next build` (next.config.mjs
// tiene `output: 'export'`) directo desde disco. En desarrollo, apunta
// al servidor de `next dev` para tener recarga en caliente.
//
// La clave de API de Gemini se guarda cifrada con `safeStorage` de
// Electron (usa el llavero del sistema operativo: Keychain en macOS,
// DPAPI en Windows, libsecret en Linux) — el mismo nivel de
// protección que expo-secure-store le daba a la app móvil. Nunca se
// guarda en texto plano ni en localStorage.

const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ES_DEV = !app.isPackaged;
const ARCHIVO_CLAVE = () => path.join(app.getPath('userData'), 'gemini.key');

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0d0f12',
    title: 'flexgoal',
    icon: path.join(__dirname, '..', 'public', 'icon-dark-32x32.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Sin menú de aplicación por defecto (es una app de un solo
  // propósito, no un navegador) — reduce ruido visual.
  ventana.setMenuBarVisibility(false);

  if (ES_DEV) {
    ventana.loadURL('http://localhost:3000');
    ventana.webContents.openDevTools({ mode: 'detach' });
  } else {
    ventana.loadFile(path.join(__dirname, '..', 'out', 'index.html'));
  }

  return ventana;
}

app.whenReady().then(() => {
  crearVentana();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------------
// IPC: clave de API de Gemini (cifrada con el llavero del sistema)
// ---------------------------------------------------------------------

ipcMain.handle('gemini:guardar-clave', (_evento, clave) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'El llavero del sistema operativo no está disponible. No se puede guardar la clave de forma segura en este equipo.'
    );
  }
  const cifrado = safeStorage.encryptString(clave);
  fs.writeFileSync(ARCHIVO_CLAVE(), cifrado);
  return true;
});

ipcMain.handle('gemini:obtener-clave', () => {
  try {
    const cifrado = fs.readFileSync(ARCHIVO_CLAVE());
    return safeStorage.decryptString(cifrado);
  } catch {
    return null;
  }
});

ipcMain.handle('gemini:borrar-clave', () => {
  try {
    fs.unlinkSync(ARCHIVO_CLAVE());
  } catch {
    // No existía — no es un error real, es el estado deseado.
  }
  return true;
});
