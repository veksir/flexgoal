# Tarea técnica 2: Pulido de UX (revisión de capturas reales)

**Tipo:** Deuda técnica / UX — no agrega funcionalidad nueva, corrige
problemas detectados al revisar capturas de pantalla reales de la app
tras completar las Historias 1-7 y la Tarea técnica 1.

## Contexto

Al revisar capturas reales (no solo criterios de aceptación aislados),
se detectaron 3 problemas que violan directamente los principios de
diseño del producto ("menos ruido, más claridad" y capacidad de
descubrir acciones sin que alguien te las explique).

## Problema 1: Ruido visual — fecha de creación en cada fila

Actualmente, ideas, objetivos y tareas muestran su fecha/hora de
creación exacta debajo del nombre (ej. "18/8/2026, 10:53:06 p.m.") en
cada fila de cada lista. No aporta nada útil al usuario en el uso diario
y contradice el principio "menos ruido, más claridad".

**Cambio:** quitar esa línea de fecha de creación de las 3 listas
(Ideas, Objetivos dentro de una meta, Tareas dentro de un objetivo). No
se elimina el dato de la base de datos (`creado_en` se sigue guardando,
puede servir después) — solo se deja de mostrar en la UI por defecto.

## Problema 2: Se pierde el contexto jerárquico

Al entrar al detalle de un objetivo, el título dice "Objetivo: Objetivo
1" — no indica a qué meta pertenece. Similarmente, el detalle de una
meta dice "Metas: Idea para ux", un patrón de título que no comunica
jerarquía sino que parece una categoría fija llamada "Metas".

**Cambio:**
- En el detalle de una meta: cambiar el título de `"Metas: {nombre}"` a
  simplemente `{nombre}` como título grande, con `"← Volver a Metas"`
  como el link de volver (en vez de solo `"← Volver"`).
- En el detalle de un objetivo: mostrar un breadcrumb de dos niveles,
  ej. `"{nombreMeta} › {nombreObjetivo}"` como encabezado, y cambiar
  `"← Volver"` a `"← Volver a {nombreMeta}"`.
- Esto requiere pasar el nombre de la meta como prop hasta
  `ObjetivoDetalleScreen` (ya debería estar disponible vía
  `metaSeleccionada`, que ya vive en `App.tsx` desde el refactor).

## Problema 3: La acción de eliminar es invisible

Actualmente eliminar una idea/tarea es solo long-press, sin ninguna
pista visual. Un usuario nuevo no tiene forma de descubrirlo.

**Cambio:** agregar un ícono de basura (🗑️ o el ícono de `lucide-react-
native` si ya está disponible como dependencia; si no, usar el emoji de
texto simple, no instales una librería de íconos nueva solo para esto)
visible junto a cada fila de idea y de tarea, que al tocarlo dispara la
misma confirmación (`Alert.alert`) que ya existe con el long-press. El
long-press puede quedarse como atajo adicional, pero ya no es la única
forma de descubrir la acción.

## Criterios de aceptación

1. Ninguna lista (Ideas, Objetivos, Tareas) muestra la fecha/hora de
   creación por defecto.
2. El detalle de una meta muestra su nombre como título principal, y
   "Volver a Metas" como link de regreso.
3. El detalle de un objetivo muestra un breadcrumb con el nombre de la
   meta padre, y "Volver a {nombre de la meta}" como link de regreso.
4. Cada idea y cada tarea tiene un ícono de eliminar visible, además del
   long-press que ya existía — ambos disparan la misma confirmación.
5. Ningún otro comportamiento cambia (crear, convertir, agregar
   objetivo/tarea, toggle de estado, sesiones — todo sigue igual).

## Fuera de alcance

- Rediseño visual completo (colores, tipografía, espaciado) — esto es
  específicamente sobre los 3 problemas señalados, no una pasada de
  diseño general.
- Cualquier funcionalidad nueva.
- El ícono de configuración y el warning de SafeAreaView — confirmados
  como artefactos del entorno de desarrollo (Expo Go), no del producto;
  no requieren cambios.
