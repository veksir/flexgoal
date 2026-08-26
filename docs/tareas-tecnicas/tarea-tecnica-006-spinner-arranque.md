# Tarea técnica 6: Spinner en arranque (pantalla en blanco)

**Tipo:** Corrección de UX — no agrega funcionalidad, no cambia el
modelo de datos.

## Contexto

La auditoría de código detectó que mientras la base de datos se carga
(`db === null`), `App.tsx` renderiza `null` — una pantalla en blanco
sin ningún feedback visual para el usuario.

## Cambio

- `App.tsx`: reemplazar `null` por un `ActivityIndicator` centrado
  cuando `db` es null.
- `App.tsx`: agregar import de `ActivityIndicator` desde `react-native`.
- `App.tsx`: agregar estilo `spinner` al StyleSheet.

## Criterios de aceptación

1. Al abrir la app, se muestra un spinner centrado mientras la BD carga.
2. La app compila sin errores TypeScript.
3. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en ninguna pantalla fuera de `App.tsx`.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/spinner-arranque`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
