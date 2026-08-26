# Tarea técnica 15: Accesibilidad — labels en botones e inputs

**Tipo:** Mejora de accesibilidad — no agrega funcionalidad, no cambia
el modelo de datos.

## Contexto

La auditoría de código detectó solo 4 usos de `accessibilityLabel` en
toda la app (todos en BottomNav). El resto de botones e inputs no tiene
anotaciones para lectores de pantalla.

## Cambio

- `DisponibilidadScreen.tsx`: migrar botón "Agregar bloque" a
  `Button` con `accessibilityLabel`. Agregar `accessibilityLabel` y
  `accessibilityRole="button"` al botón de eliminar bloque.
- Componente `Button.tsx` ya incluye `accessibilityRole="button"` por
  defecto.

## Criterios de aceptación

1. Los botones migrados tienen `accessibilityLabel` descriptivo.
2. La app compila sin errores TypeScript.
3. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Migración parcial: más pantallas se actualizarán gradualmente.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `feat/accesibilidad-labels`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
