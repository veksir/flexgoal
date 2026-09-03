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

const { app, BrowserWindow, ipcMain, safeStorage, protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const ES_DEV = !app.isPackaged;
const ARCHIVO_CLAVE = () => path.join(app.getPath('userData'), 'gemini.key');
const DIR_OUT = path.join(__dirname, '..', 'out');

// ---------------------------------------------------------------------
// Protocolo "app://" — sirve el export estático de Next.js con un
// origen real (app://local), en vez de cargarlo vía file://.
//
// Por qué: Next genera rutas de navegación cliente (los .txt de RSC
// que usa cada <Link> para no recargar la página) como rutas
// absolutas ("/metas/index.txt"). Bajo file://, una ruta absoluta
// resuelve contra la raíz del sistema de archivos, no contra la
// carpeta out/, así que el fetch falla en silencio al cambiar de
// pestaña y la ventana queda en negro. Con un esquema privilegiado
// que tiene origen propio, esas rutas absolutas sí resuelven contra
// out/ correctamente, igual que en un servidor http normal.
// ---------------------------------------------------------------------
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function registrarProtocoloApp() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let rutaRelativa = decodeURIComponent(url.pathname);

    let rutaArchivo = path.normalize(path.join(DIR_OUT, rutaRelativa));

    // Evita salir de out/ (path traversal) por una URL maliciosa.
    if (!rutaArchivo.startsWith(DIR_OUT)) {
      rutaArchivo = path.join(DIR_OUT, 'index.html');
    }

    if (rutaRelativa === '/' || rutaRelativa === '') {
      rutaArchivo = path.join(DIR_OUT, 'index.html');
    } else if (!path.extname(rutaArchivo)) {
      // Rutas de página sin extensión ("/metas") -> su carpeta con
      // index.html (export con trailingSlash) o el .html plano.
      const comoCarpeta = path.join(rutaArchivo, 'index.html');
      const comoHtml = `${rutaArchivo}.html`;
      if (fs.existsSync(comoCarpeta)) {
        rutaArchivo = comoCarpeta;
      } else if (fs.existsSync(comoHtml)) {
        rutaArchivo = comoHtml;
      }
    }

    return net.fetch(pathToFileURL(rutaArchivo).toString());
  });
}

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
    ventana.loadURL('app://local/');
  }

  // La página exportada trae su propio <title> ("flexgoal — ...")
  // que Electron adopta automáticamente como título de ventana en
  // cuanto termina de cargar. Lo forzamos de vuelta a "flexgoal" para
  // que la barra de título no muestre el subtítulo largo.
  ventana.on('page-title-updated', (evento) => {
    evento.preventDefault();
    ventana.setTitle('flexgoal');
  });

  return ventana;
}

app.whenReady().then(() => {
  registrarProtocoloApp();
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
