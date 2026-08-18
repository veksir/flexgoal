# ADR-002: Selección de base de datos local para React Native

- **Estado:** Aprobado
- **Fecha:** 2026-08-18 (propuesto) — 2026-08-19 (aprobado, tras spike)
- **Autores:** Kevin Sena Molina

## 1. Contexto
Se necesita persistencia local robusta para el modelo Idea → Meta →
Objetivo → Tarea → Sesión, con consultas relacionales (progreso agregado,
tiempo por meta) y buen soporte en React Native/Expo.

## 2. Opciones Consideradas
1. **SQLite (vía expo-sqlite):** maduro, relacional, control total de
   queries; requiere más código para migraciones y sincronización futura.
2. **WatermelonDB:** pensado para apps offline-first reactivas, buena
   integración con sync futuro, pero con curva de aprendizaje y menos
   flexible para queries ad-hoc.
3. **Realm:** descartado sin spike — licenciamiento y roadmap de producto
   (propiedad de MongoDB) generaban incertidumbre adicional no justificada
   frente a las otras dos opciones.

## 3. Decisión Elegida
**SQLite vía `expo-sqlite`.**

Spike ejecutado comparando SQLite y WatermelonDB con el mismo escenario
(Meta→Objetivo→Tarea→Sesión, ~30 tareas, ~30 sesiones) y las 3 queries
críticas del sistema adaptativo: progreso agregado por meta, tareas
pendientes por rango de fechas, y desviación planificado-vs-realizado.

**Resultado:** SQLite 28/30 vs. WatermelonDB 21/30.

- Las 3 queries se resuelven en SQL directo en SQLite (1–2 ms medidos); en
  WatermelonDB requieren agregación manual en JS por falta de soporte de
  JOIN/agregaciones en el query builder (11–25 ms medidos, ~10x más lento
  en el mismo harness).
- SQLite funciona en Expo Go sin configuración adicional; WatermelonDB
  requiere dev build nativo (`expo prebuild`) y configuración manual de
  Babel (decorators, class-properties).
- WatermelonDB ganó en migraciones (declarativas, se auto-aplican) y quedó
  empatado en tipado de TypeScript, pero ninguno de los dos compensa el
  costo de setup y la debilidad en las queries agregadas, que son el
  núcleo del producto.

## 4. Consecuencias e Impacto
- **Positivas:** decisión informada por prueba real y medida, no por
  popularidad. Se elimina la dependencia de dev build nativo en Fase 1,
  permitiendo seguir usando Expo Go durante el desarrollo temprano. Menor
  boilerplate y menor superficie de configuración.
- **Riesgos / Trade-offs:** las migraciones en SQLite son manuales
  (`PRAGMA user_version` + `ALTER TABLE`), por lo que la disciplina de
  versionado de esquema recae en el equipo, no en el framework. Si en el
  futuro (Fase 6, sincronización) se necesita reactividad tipo-ORM u
  observación de cambios en tiempo real, esta decisión debería
  revisitarse — no está descartado reevaluar WatermelonDB en ese punto
  específico.
