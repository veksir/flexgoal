# flexgoal

Aplicación móvil local-first de planificación adaptativa de metas.

Convierte ideas y objetivos de largo plazo en un plan de acción diario, y
adapta ese plan comparando continuamente lo planificado contra lo realmente
ejecutado — en vez de exigir que la persona se adapte a un plan perfecto.

## Estado del proyecto

🚧 En desarrollo — Fase 1 (Fundamentos) en curso.

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
