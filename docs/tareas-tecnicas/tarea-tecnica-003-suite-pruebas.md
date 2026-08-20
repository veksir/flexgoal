# Tarea técnica 3: Suite de pruebas automatizadas para la capa de datos

**Tipo:** Infraestructura de pruebas — no agrega funcionalidad nueva al
usuario, pero cambia cómo se verifican las historias de aquí en
adelante.

## Motivo

Hasta ahora, cada historia se verificaba con una lista larga de pasos
manuales en el dispositivo (crear datos de prueba específicos, navegar,
comparar resultados). La mayoría de esos pasos verifican **lógica de
datos** (filtros, ordenamiento, sumas, aislamiento por FK) que no
necesita ni pantalla ni dispositivo — es lógica pura que se puede probar
con una máquina. Solo lo genuinamente visual (que el cronómetro se vea
correr, que el breadcrumb se lea bien, que la navegación se sienta
fluida) sigue necesitando verificación manual.

OpenCode ya viene "simulando" esto ad hoc en cada reporte (harness de
Node con SQLite real) — esta tarea formaliza eso en una suite real que
corre con un solo comando.

## El reto técnico

`app/db/*.ts` usa `expo-sqlite` directamente, que es un módulo nativo —
no corre en un entorno de pruebas de Node normal. La solución: las
funciones de `db/*.ts` deben recibir la conexión de base de datos como
parámetro (inyección de dependencia) en vez de importar una instancia
fija de `expo-sqlite` dentro de cada función. Así, en producción se les
pasa la conexión real de `expo-sqlite`, y en las pruebas se les pasa una
conexión de `node:sqlite` (ya usada en los harnesses previos de
OpenCode) — la misma lógica de negocio, dos "motores" distintos por
detrás, ambos son SQLite real.

## Alcance

1. Refactorizar `app/db/*.ts` para que cada función (`crearIdea`,
   `crearMeta`, `convertirIdeaEnMeta`, `crearObjetivo`,
   `listarObjetivosPorMeta`, `crearTarea`, `listarTareasPorObjetivo`,
   `alternarEstadoTarea`, `eliminarTarea`, `crearSesion`,
   `tiempoTotalPorTarea`, `progresoPorMeta`, `tareasParaHoy`,
   `actualizarEstadoMeta`, etc.) acepte la conexión de base de datos como
   primer parámetro, en vez de importarla internamente. La conexión real
   de la app se sigue abriendo una sola vez en `database.ts` y se pasa
   hacia abajo.

2. Configurar Jest (con soporte de TypeScript) en `app/`, con un script
   `npm test` en `package.json`.

3. Escribir un helper de prueba que cree una base de datos SQLite
   temporal (vía `node:sqlite`) y aplique el mismo esquema/migraciones
   que usa la app real (reutilizar las sentencias `CREATE TABLE`/`ALTER
   TABLE` ya existentes en `database.ts`, no reescribirlas).

4. Escribir pruebas automatizadas para toda la lógica que hasta ahora se
   verificaba a mano en las Historias 1-11, específicamente:
   - Aislamiento por `meta_id` (objetivos) y por `objetivo_id` (tareas).
   - Transacción atómica de `convertirIdeaEnMeta` (no queda huérfana ni
     la idea ni la meta si algo falla).
   - Validación de formato de fecha y de duración estimada (casos
     válidos e inválidos).
   - Que sesiones menores a 30 segundos no se guardan.
   - Que `tiempoTotalPorTarea` suma correctamente con 2+ sesiones.
   - Que `progresoPorMeta` agrega correctamente a través de
     Objetivo→Tarea→Sesión.
   - Que `tareasParaHoy` filtra y ordena correctamente (tarea vencida,
     de hoy, futura, y sin fecha — los 4 casos de la Historia 11).
   - Que las migraciones no rompen datos existentes al subir de versión
     (recreando el escenario de las Historias 5 y 6).

## Fuera de alcance

- Pruebas de UI/visuales (eso sigue siendo manual, con una lista de
  verificación mucho más corta de aquí en adelante).
- Refactorizar la lógica de negocio en sí (el comportamiento no cambia,
  solo cómo recibe la conexión de base de datos).
- Configurar CI/CD (GitHub Actions) para correr las pruebas
  automáticamente en cada push — se puede evaluar después si hace falta.

## Criterios de aceptación

1. `npm test` corre y pasa, cubriendo todas las funciones listadas en el
   alcance.
2. El comportamiento de la app en Expo Go no cambia en absoluto (mismo
   principio de "cero cambios de comportamiento" que en refactors
   anteriores) — es un cambio interno de cómo se estructura el código,
   no de qué hace.
3. `npx tsc --noEmit` sin errores.
4. De aquí en adelante, cada historia nueva que agregue lógica de datos
   debe venir acompañada de sus pruebas correspondientes en la misma
   rama — esto se vuelve parte de la Definition of Done estándar.
