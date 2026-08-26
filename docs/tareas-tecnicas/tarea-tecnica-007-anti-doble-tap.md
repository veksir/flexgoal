# Tarea técnica 7: Deshabilitar botones durante async (anti doble-tap)

**Tipo:** Corrección de UX — no agrega funcionalidad, no cambia el
modelo de datos.

## Contexto

La auditoría de código detectó que los botones de guardar no se
deshabilitan durante la operación async — un doble-tap rápido puede
crear registros duplicados.

## Cambio

Se agregó estado `isSaving` a las siguientes pantallas:

| Pantalla | Funciones protegidas |
|----------|---------------------|
| `IdeasScreen.tsx` | `guardarIdea`, `guardarPropuestaIA` |
| `MetaDetalleScreen.tsx` | `guardarCategoria`, `guardarFechaObjetivo`, `guardarObjetivo` |
| `FormularioTarea.tsx` | `guardarTarea` |
| `ObjetivoDetalleScreen.tsx` | `guardarEdicion` |

Cada función:
1. Verifica `isSaving` al inicio (retorna si ya está guardando).
2. Envuelve la operación en `try/finally` con `setIsSaving(true/false)`.
3. El botón correspondiente tiene `disabled={isSaving}` y opacidad reducida.

## Criterios de aceptación

1. Un doble-tap rápido en cualquier botón de guardar no crea registros
   duplicados.
2. Los botones muestran opacidad reducida mientras guardan.
3. La app compila sin errores TypeScript.
4. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en la lógica de negocio.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/anti-doble-tap`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
