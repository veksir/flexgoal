# Rediseño visual y de UX — Flexgoal

Este documento resume el rediseño aplicado. **No se tocó la lógica de la
app** (persistencia, cálculos, validaciones): los 130 tests existentes
siguen pasando y `tsc --noEmit` compila sin errores. Tampoco se agregó una
paleta de color nueva ni se cambió la tipografía: se reutilizan exactamente
los mismos colores y la misma fuente del sistema que ya tenía el proyecto,
solo que ahora centralizados y aplicados con más consistencia.

## Qué cambió

### 1. Sistema de diseño centralizado (`app/screens/theme.ts`)
Antes cada pantalla repetía literales de color (`#1c7ed6`, `#666`, `#eee`...)
y valores de espaciado sueltos. Ahora hay un único archivo con:
- **Espaciado** en escala de 4/8/12/16/20/24/32 px.
- **Radios** consistentes (8/12/16/20/completo).
- **Sombras** estándar para tarjetas, modales y barra inferior.
- Los **mismos colores** que ya existían, solo con nombres (`color.primario`,
  `color.exito`, etc.) para no repetir hexadecimales sueltos.

### 2. Navegación reorganizada
- La barra de secciones (Hoy/Ideas/Metas/Horario/Semana) se movió del
  **top al fondo de la pantalla**, con ícono + etiqueta, como en apps
  nativas modernas (iOS/Android). Antes eran pestañas de texto arriba.
- La barra inferior **se oculta automáticamente** al entrar al detalle de
  una meta o un objetivo (patrón de navegación por pila), dejando más
  espacio y foco en el contenido, igual que WhatsApp, Notion, etc.
- El encabezado superior ahora muestra un subtítulo contextual de la
  sección activa ("Tus tareas para hoy", "Bandeja de ideas"...).

### 3. Listas como tarjetas, no filas con líneas
Todos los ítems (tareas, metas, ideas, objetivos, bloques de horario,
días de la semana) pasaron de filas separadas por una línea inferior a
**tarjetas** con esquinas redondeadas, sombra suave y separación entre
ellas. Es el patrón visual estándar en apps de productividad actuales
(Todoist, Things, Notion).

### 4. Jerarquía de información con insignias y barras de progreso
- La prioridad de una meta ahora se ve como un **punto de color + etiqueta**
  (insignia), no como texto plano concatenado.
- El progreso estimado-vs-real de una meta se visualiza con una **barra de
  progreso**, además del texto.
- Estados vacíos ("aún no tienes ideas/metas/tareas") ahora tienen un
  ícono, un título y un subtítulo de ayuda, en vez de una sola línea gris.

### 5. Formularios más cómodos
- Los campos de texto tienen fondo sutil y más padding (mejor tamaño de
  toque).
- Agregar una idea o un objetivo ahora es un **compositor** (input + botón
  circular de enviar), un patrón familiar de apps de mensajería/notas, en
  vez de un input y un botón de ancho completo apilados.
- La pantalla de detalle de una meta agrupa Categoría / Prioridad / Fecha
  objetivo / Estado en **tarjetas de sección** separadas, en vez de un
  bloque continuo de controles.

### 6. Accesibilidad y tamaños de toque
Botones e íconos pequeños (basura, editar, navegación de semana) ahora
respetan un tamaño mínimo de toque de ~44px, y los tabs de navegación
tienen `accessibilityRole`/`accessibilityState` para lectores de pantalla.

## Qué NO cambió (a propósito)
- Ningún color nuevo: se mantiene azul primario, verde éxito, rojo peligro,
  naranja advertencia y la escala de grises que ya existía.
- Ninguna fuente nueva: se sigue usando la tipografía del sistema con los
  mismos tamaños base.
- Cero cambios en `app/db/*`: toda la lógica, validaciones y persistencia
  quedan intactas.
- Cero cambios de nombres de props o contratos entre componentes: `App.tsx`
  sigue pasando las mismas props a cada pantalla.

## Archivos modificados
- `app/screens/theme.ts` (nuevo)
- `app/screens/estilos.ts` (reescrito, mismas claves + nuevas para tarjetas
  de sección, insignias, progreso, compositor, navegación inferior)
- `app/App.tsx` (header + barra inferior)
- `app/screens/HoyScreen.tsx`
- `app/screens/IdeasScreen.tsx`
- `app/screens/MetasScreen.tsx`
- `app/screens/MetaDetalleScreen.tsx`
- `app/screens/ObjetivoDetalleScreen.tsx`
- `app/screens/DisponibilidadScreen.tsx`

`FormularioTarea.tsx` y `SemanaScreen.tsx` no se tocaron directamente:
heredan el nuevo look automáticamente porque usan los estilos compartidos
de `estilos.ts`.

## Verificación hecha
```bash
cd app
npm install
npx tsc --noEmit   # 0 errores
npx jest           # 130/130 tests OK
```

## Cómo verlo
```bash
cd app
npx expo start
```
Abre con Expo Go en tu teléfono o un emulador para ver el resultado.
