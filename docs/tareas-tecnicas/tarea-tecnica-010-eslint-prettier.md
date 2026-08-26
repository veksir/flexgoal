# Tarea técnica 10: Agregar ESLint + Prettier

**Tipo:** Herramienta de desarrollo — no agrega funcionalidad, no cambia
el modelo de datos.

## Contexto

La auditoría de código detectó ausencia de linter y formateador. En
solitario (sin PR humano que corrija), el linter es la única red de
seguridad automática.

## Cambio

- Nuevas dependencias de desarrollo: `eslint`, `@eslint/js`, `prettier`,
  `eslint-config-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`,
  `typescript-eslint`.
- Nuevo archivo `eslint.config.js`: configuración flat de ESLint con
  reglas de React, React Hooks y TypeScript.
- Nuevo archivo `.prettierrc`: configuración de formato.
- `package.json`: scripts `lint`, `lint:fix`, `format`, `format:check`.

## Criterios de aceptación

1. `npm run lint` ejecuta ESLint sin errores de configuración.
2. `npm run format` ejecuta Prettier sin errores de configuración.
3. `npm test` sigue funcionando (147 pruebas).
4. `npx tsc --noEmit` sigue sin errores.

## Alcance técnico adicional

- Sin migración de base de datos.
- Los warnings/errores existentes se documentan para futura limpieza.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `chore/eslint-prettier`.
- **No mergear a main hasta confirmación de Kevin.**
