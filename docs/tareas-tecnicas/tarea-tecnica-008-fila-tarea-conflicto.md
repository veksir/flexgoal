# Tarea técnica 8: Separar completar tarea de controles en fila (HoyScreen)

**Tipo:** Corrección de UX — no agrega funcionalidad, no cambia el
modelo de datos.

## Contexto

La auditoría de código detectó que en `HoyScreen`, toda la fila de cada
tarea es un único `Pressable` que marca la tarea como completada. Dentro
de esa misma fila hay botones (selector de modo, iniciar/detener sesión)
y un `TextInput`. Tocar cerca de esos controles puede completar la tarea
sin querer.

## Cambio

- `HoyScreen.tsx`: el contenedor de cada tarea cambia de `Pressable`
  (con `onPress` que completa) a `View`.
- Se agrega un `Pressable` separado (`tareaCheckbox`) que solo contiene
  el checkbox y es el que llama a `alternarTarea`.
- El checkbox ahora muestra `☑` o `☐` según el estado de la tarea.
- Se agrega tachado visual (`textDecorationLine: 'line-through'`) cuando
  la tarea está completada.
- `estilos.ts`: nuevo estilo `tareaCheckbox` para el botón del checkbox.

## Criterios de aceptación

1. Tocar el checkbox marca/desmarca la tarea.
2. Tocar el nombre de la tarea, el selector de modo o los botones de
   sesión NO marca la tarea como completada.
3. La app compila sin errores TypeScript.
4. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en la lógica de negocio.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/fila-tarea-conflicto`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
