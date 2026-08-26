# Tests de UI

## Estructura

```
app/
├── __mocks__/                          # Mocks de módulos nativos
│   ├── react-native.js                 # Componentes RN como View/Pressable genéricos
│   ├── expo-sqlite.js                  # Mock de SQLite
│   ├── expo-secure-store.js            # Mock de SecureStore
│   └── @react-native-community/
│       └── datetimepicker.js           # Mock del DateTimePicker
├── screens/__mocks__/theme.js          # Mock de theme.ts (colores, espaciado)
├── db/__mocks__/plantillasMeta.js      # Mock de plantillas
├── ia/__mocks__/gemini.js              # Mock de la IA
├── components/__tests__/
│   ├── Button.test.ts                  # Testea variantStyles (primary/secondary/danger/ghost)
│   ├── DatePicker.test.ts              # Testea parseFecha, formatearFechaLocal, roundtrip
│   ├── EditarTareaModal.test.ts        # Testea etiquetaPrioridad
│   └── BottomNav.test.ts              # Testea constante VISTAS (5 vistas)
├── hooks/__tests__/                    # (pendiente para hooks con lógica pura)
├── jest.config.js                      # Config para tests de db (147 tests)
└── jest.ui.config.js                   # Config para tests de UI (22 tests)
```

## Comandos

```bash
npm test              # Tests de capa de datos (db/__tests__/)
npm run test:ui       # Tests de UI (components/__tests__/)
npm run test:all      # Ambos
```

## Filosofía

Los tests de UI en este proyecto testean **lógica pura** extraída de los
componentes, no rendering. Esto permite correrlos en `node` sin necesidad
de Expo Go, simulador ni emulador — los mismos tests corren en CI
(GitHub Actions) sin configuración especial.

### Qué se testea

- **Button:** Las 4 variantes de estilo tienen los colores correctos.
- **DatePicker:** `parseFecha` acepta/rechaza formatos; `formatearFechaLocal`
  formatea correctamente; el roundtrip parse→formatear es idempotente.
- **EditarTareaModal:** `etiquetaPrioridad` capitaliza correctamente.
- **BottomNav:** La constante `VISTAS` tiene las 5 rutas, cada una con
  etiqueta, icono y subtítulo.

### Qué NO se testea (y por qué)

- **Rendering visual:** Requiere `@testing-library/react-native` +
  `react-test-renderer` + entorno React Native. La inversión no está
  justificada para un MVP local-first.
- **Interacciones de usuario (tap, scroll):** Mismo motivo.
- **Flujos completos (CRUD):** Ya cubiertos por los 147 tests de `db/`.

### Cómo agregar un test nuevo

1. Identifica la función pura (sin dependencias de React/RN).
2. Exporta la función desde el componente (`export function miFuncion`).
3. Crea un archivo `components/__tests__/MiComponente.test.ts`.
4. Importa y testea la función directamente.
5. Corre `npm run test:ui` para verificar.
