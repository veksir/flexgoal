# flexgoal

Aplicación móvil local-first de planificación adaptativa de metas.

Convierte ideas y objetivos de largo plazo en un plan de acción diario, y
adapta ese plan comparando continuamente lo planificado contra lo realmente
ejecutado — en vez de exigir que la persona se adapte a un plan perfecto.

## Estado del proyecto

✅ Fase 1 (Fundamentos) y Fase 2 (Tiempo) completadas. Fase 3 (Planificación) en curso.

## Qué incluye hoy

- **Ideas → Metas → Objetivos → Tareas:** jerarquía completa con persistencia SQLite, navegación de 3 niveles y estado pendiente/completada.
- **Sesiones de tiempo real:** cronómetro manual por tarea, historial detallado y total acumulado.
- **Pomodoro configurable:** duraciones de trabajo/descanso a elección, fase visible, vibración al cambiar, resolución automática al reabrir la app.
- **Persistencia de sesión activa:** el cronómetro sobrevive cierre de la app sin perder tiempo.
- **Comparación estimado vs. real:** diferencia visible por tarea (y agregada por meta).
- **Metas con contexto:** categoría/área, prioridad (alta/media/baja) y fecha objetivo opcionales.

*(Actualizado a Fase 2 — ver `CLAUDE.md` para detalle completo por historia.)*

## Stack

- **Mobile:** React Native + Expo
- **Persistencia local:** SQLite (`expo-sqlite`)
- **IA (asistente, no dependencia crítica):** modelo local open source, en evaluación
- **Backend (opcional, fase futura):** FastAPI + PostgreSQL, solo para sincronización

## Documentación técnica

- [`docs/TDD.md`](docs/TDD.md) — Technical Design Document completo
- [`docs/adr/`](docs/adr/) — Registro de decisiones de arquitectura

## Desarrollo

Este proyecto sigue un flujo de trabajo documentado en `CLAUDE.md` (no
público / uso interno de desarrollo).

```bash
cd app
npx expo start
```
