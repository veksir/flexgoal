# Tarea técnica 12: Extraer componente Button unificado

**Tipo:** Refactor de UI — no agrega funcionalidad, no cambia el
modelo de datos.

## Contexto

La auditoría de código detectó 32 variantes de estilo de botón sin
un componente `<Button>`. Cambiar una regla global (ej. tamaño mínimo
de toque) exige tocar 32 lugares en vez de uno.

## Cambio

- Nuevo archivo `app/components/Button.tsx`: componente reutilizable
  con variantes `primary`, `secondary`, `danger`, `ghost`.
  - `minHeight: 44px` (toqueMinimo) consistente.
  - Soporte para `disabled`, `loading`, `style`, `textStyle`.
  - `accessibilityRole="button"` integrado.
- Migración parcial de pantallas principales:
  - `IdeasScreen.tsx`: botones de guardar idea y guardar propuesta IA.
  - `MetaDetalleScreen.tsx`: botones de guardar categoría, fecha
    objetivo y agregar objetivo.
  - `FormularioTarea.tsx`: botón de agregar tarea.

## Criterios de aceptación

1. Los botones migrados mantienen su comportamiento visual y funcional.
2. La app compila sin errores TypeScript.
3. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Migración parcial: otros botones se migrarán gradualmente.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `refactor/button-component`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
