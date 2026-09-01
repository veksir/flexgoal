# flexgoal

> **Esta rama (`desktop-nextjs`) contiene dos sistemas separados e
> independientes** que comparten nombre y filosofía, pero no comparten
> código, datos ni tecnología:
>
> - **`app/`** — la aplicación **móvil** (React Native + Expo + SQLite). Es
>   el proyecto original, documentado en el resto de este README.
> - **`desktop/`** — una aplicación de **escritorio** (Next.js + Electron),
>   con su propio modelo de datos en `localStorage`. Ver la sección
>   [Escritorio](#escritorio-electron--nextjs) más abajo.
>
> No hay sincronización entre ambas: son dos apps distintas que resuelven
> el mismo problema con arquitecturas distintas. Esta rama existe aparte
> de `main` a propósito — `main` es solo la app móvil.

Aplicación móvil local-first de planificación adaptativa de metas.

Convierte ideas y objetivos de largo plazo en un plan de acción diario, y
adapta ese plan comparando continuamente lo planificado contra lo realmente
ejecutado — en vez de exigir que la persona se adapte a un plan perfecto.

## Estado del proyecto

✅ Fase 1 (Fundamentos), Fase 2 (Tiempo) y Fase 3 (Planificación) completadas. Iniciando Fase 4 (Adaptación).

## Qué incluye hoy

- **Ideas → Metas → Objetivos → Tareas:** jerarquía completa con persistencia SQLite, navegación de 3 niveles y estado pendiente/completada.
- **Sesiones de tiempo real:** cronómetro manual por tarea, historial detallado y total acumulado.
- **Pomodoro configurable:** duraciones de trabajo/descanso a elección, fase visible, vibración al cambiar, resolución automática al reabrir la app.
- **Persistencia de sesión activa:** el cronómetro sobrevive cierre de la app sin perder tiempo.
- **Comparación estimado vs. real:** diferencia visible por tarea (y agregada por meta).
- **Metas con contexto:** categoría/área, prioridad (alta/media/baja) y fecha objetivo opcionales.
- **Vista Hoy:** tareas pendientes con fecha de hoy o vencidas, de todas las metas.
- **Disponibilidad declarada:** bloques de horario por día de la semana.
- **Vista Semana:** tareas planificadas vs. disponibilidad por día, navegación anterior/siguiente.
- **Editar tarea:** modal de edición para nombre, fecha planificada, duración y prioridad sin eliminar y recrear.

*(Actualizado a Fase 3 completa — ver `CLAUDE.md` para detalle completo por historia.)*

## Stack (móvil)

- **Mobile:** React Native + Expo
- **Persistencia local:** SQLite (`expo-sqlite`)
- **IA (asistente, no dependencia crítica):** modelo local open source, en evaluación
- **Backend (opcional, fase futura):** FastAPI + PostgreSQL, solo para sincronización

## Documentación técnica

- [`docs/TDD.md`](docs/TDD.md) — Technical Design Document completo
- [`docs/adr/`](docs/adr/) — Registro de decisiones de arquitectura

## Desarrollo (móvil)

Este proyecto sigue un flujo de trabajo documentado en `CLAUDE.md` (no
público / uso interno de desarrollo).

```bash
cd app
npx expo start
```

---

## Escritorio (Electron + Next.js)

App de escritorio instalable, independiente de la app móvil de arriba.
Vive en `desktop/` — es un proyecto Next.js completo con su propio
`package.json`, no depende de nada de `app/`.

### Por qué es un sistema separado

- **Modelo de datos distinto:** `Idea → Meta → Objetivo → Tarea → Sesión`,
  con `Sesión` como entidad propia que asigna una tarea a un día concreto
  (a diferencia de la app móvil, donde la fecha vive directo en la tarea).
- **Persistencia distinta:** `localStorage`, no SQLite. No hay servidor,
  no hay cuenta — export/import de un archivo JSON es el único traslado
  posible de datos entre equipos.
- **Empaquetado distinto:** Electron con exportación estática de Next.js
  (`output: 'export'`), no Expo.

### Arranca en blanco, a propósito

**Clonar este repo y correr la app de escritorio por primera vez arranca
sin ningún dato** — ni ideas, ni metas, ni disponibilidad declarada. No
hay datos de prueba mezclados con los tuyos.

Si querés ver la app con contenido de ejemplo (para probar funcionalidad
rápido, sin cargar nada a mano), andá a **Tiempo → "Restaurar ejemplo"**
dentro de la app ya corriendo. Eso reemplaza lo que tengas por un dataset
de demostración — nunca pasa solo, es una acción explícita.

### Cómo correrla

```bash
cd desktop
npm install

# Desarrollo (recarga en caliente):
npm run electron:dev

# Generar el instalable (.dmg/.exe/.AppImage) para tu sistema:
npm run electron:pack
# queda en desktop/release/
```

### Integración con IA (opcional)

La generación automática de objetivos/tareas a partir de una idea usa
Gemini. Necesitás tu propia clave de API (gratis en
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)),
configurable desde **Diseño** dentro de la app. Sin clave, todo lo demás
de la app funciona igual — la creación manual de estructura no depende de
esto.

La clave se guarda cifrada con el llavero del sistema operativo
(`safeStorage` de Electron) — nunca en texto plano, nunca en un servidor
propio (no existe un servidor propio).

