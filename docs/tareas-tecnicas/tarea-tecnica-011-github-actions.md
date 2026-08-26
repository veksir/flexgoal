# Tarea técnica 11: GitHub Actions — test en cada push

**Tipo:** Herramienta de desarrollo — no agrega funcionalidad, no cambia
el modelo de datos.

## Contexto

La auditoría de código detectó ausencia de CI. Los tests existen pero
nadie los corre automáticamente en cada push.

## Cambio

- Nuevo archivo `.github/workflows/test.yml`: workflow que ejecuta
  `tsc --noEmit` y `npm test` en cada push a `main` y en cada PR.

## Criterios de aceptación

1. El workflow se ejecuta al hacer push a `main`.
2. El workflow ejecuta `tsc --noEmit` sin errores.
3. El workflow ejecuta `npm test` (147 pruebas) exitosamente.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en código existente.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `chore/github-actions`.
- **No mergear a main hasta confirmación de Kevin.**
